import { OAuth2Client } from "google-auth-library"
import { exceptions, HashEnum, myCompare, myHash } from "../../common/index.js"
import { createToken } from "../../common/security/index.js"
import { encryption } from "../../common/security/encryption.js"
import { userModel } from "../../database/modle/index.js"
import configService from "../../config/config.service.js"

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const createAuthResult = (user) => ({
  user,
  token: createToken({ payload: { sub: user.id } }),
})

export const signup = async (data) => {
  if (
    !data ||
    typeof data.email !== "string" ||
    !isValidEmail(data.email.trim()) ||
    typeof data.password !== "string" ||
    data.password.length < 8 ||
    data.password.length > 128 ||
    typeof data.firstName !== "string" ||
    typeof data.lastName !== "string" ||
    typeof data.phone !== "string"
  ) {
    exceptions.badRequest("Valid name, email, password, and phone are required")
  }

  const email = data.email.trim().toLowerCase()
  if (await userModel.exists({ email })) {
    exceptions.conflict("User already exists")
  }

  const userData = {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email,
    password: await myHash({ plainText: data.password, lib: HashEnum.argon }),
    phone: encryption(data.phone.trim()),
  }
  if (data.gender !== undefined) {
    userData.gender = data.gender
  }

  let user
  try {
    user = await userModel.create(userData)
  } catch (error) {
    if (error.code === 11000) {
      exceptions.conflict("User already exists")
    }
    throw error
  }

  return createAuthResult(user)
}

export const login = async ({ email, password } = {}) => {
  if (typeof email !== "string" || typeof password !== "string") {
    exceptions.badRequest("Email and password are required")
  }

  const user = await userModel
    .findOne({ email: email.trim().toLowerCase() })
    .select("+password")
  if (
    !user ||
    !user.password ||
    !(await myCompare({
      plainText: password,
      encrypted: user.password,
      lib: HashEnum.argon,
    }))
  ) {
    exceptions.unauthorized("Invalid email or password")
  }

  return createAuthResult(user)
}

export const googleLogin = async ({ idToken, credential } = {}) => {
  if (!configService.GOOGLE_CLIENT_ID) {
    const error = new Error("Google login is not configured")
    error.statusCode = 503
    throw error
  }

  const submittedToken = idToken || credential
  if (typeof submittedToken !== "string" || !submittedToken) {
    exceptions.badRequest("A Google ID token is required")
  }

  let ticket
  try {
    ticket = await new OAuth2Client(configService.GOOGLE_CLIENT_ID).verifyIdToken({
      idToken: submittedToken,
      audience: configService.GOOGLE_CLIENT_ID,
    })
  } catch (error) {
    if (
      error?.response?.status === 400 ||
      error?.response?.status === 401 ||
      /token|jwt|signature/i.test(error?.message || "")
    ) {
      exceptions.unauthorized("Invalid Google ID token")
    }
    throw error
  }

  const googleUser = ticket.getPayload()
  if (
    !googleUser?.sub ||
    !googleUser.email ||
    googleUser.email_verified !== true
  ) {
    exceptions.unauthorized("Google account email must be verified")
  }

  const email = googleUser.email.trim().toLowerCase()
  let user = await userModel.findOne({
    $or: [{ googleId: googleUser.sub }, { email }],
  })

  if (!user) {
    const [givenName, ...familyNames] = (googleUser.name || "").trim().split(/\s+/)
    const firstName =
      (googleUser.given_name || givenName || "Google").length >= 3
        ? googleUser.given_name || givenName || "Google"
        : "Google"
    const familyName =
      (googleUser.family_name || familyNames.join(" ") || "User").trim()
    user = await userModel.create({
      firstName,
      lastName: familyName.length >= 3 ? familyName : "User",
      email,
      googleId: googleUser.sub,
    })
  } else if (user.googleId && user.googleId !== googleUser.sub) {
    exceptions.conflict("This email is already linked to another Google account")
  } else if (!user.googleId) {
    user.googleId = googleUser.sub
    await user.save()
  }

  return createAuthResult(user)
}