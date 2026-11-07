import { userModel } from "../../database/modle/index.js";
import {
  exceptions,
  genderEnum,
  HashEnum,
  myCompare,
  myHash,
} from "../../common/index.js";
import { encryption } from "../../common/security/encryption.js";

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const validateCredentials = (data, { requireStrongPassword = false } = {}) => {
  if (!isRecord(data)) {
    exceptions.badRequest("A JSON object is required");
  }

  const email =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 50) {
    exceptions.badRequest("A valid email address is required");
  }

  if (!password) {
    exceptions.badRequest("Password is required");
  }
  if (requireStrongPassword && (password.length < 8 || password.length > 128)) {
    exceptions.badRequest("Password must be between 8 and 128 characters");
  }
  if (!requireStrongPassword && password.length > 1024) {
    exceptions.badRequest("Password is too long");
  }

  return { email, password };
};

export const signup = async (data) => {
  const { email, password } = validateCredentials(data, {
    requireStrongPassword: true,
  });
  const firstName =
    typeof data.firstName === "string" ? data.firstName.trim() : "";
  const lastName =
    typeof data.lastName === "string" ? data.lastName.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";

  if (firstName.length < 3 || firstName.length > 50) {
    exceptions.badRequest("First name must be between 3 and 50 characters");
  }
  if (lastName.length < 3 || lastName.length > 50) {
    exceptions.badRequest("Last name must be between 3 and 50 characters");
  }
  if (!phone || phone.length > 64) {
    exceptions.badRequest("A valid phone number is required");
  }

  const userData = { firstName, lastName, email, password, phone };
  if (data.gender !== undefined) {
    const gender = Number(data.gender);
    if (!Number.isInteger(gender) || !Object.values(genderEnum).includes(gender)) {
      exceptions.badRequest("Gender is invalid");
    }
    userData.gender = gender;
  }

  if (await userModel.exists({ email })) {
    exceptions.conflict("User already exists");
  }

  userData.password = await myHash({
    plainText: password,
    lib: HashEnum.argon,
  });
  userData.phone = encryption(phone);

  try {
    return await userModel.create(userData);
  } catch (error) {
    if (error.code === 11000) {
      exceptions.conflict("User already exists");
    }
    throw error;
  }
};

export const login = async (data) => {
  const { email, password } = validateCredentials(data);
  const user = await userModel.findOne({ email }).select("+password");

  if (
    !user ||
    !(await myCompare({
      plainText: password,
      encrypted: user.password,
      lib: HashEnum.argon,
    }))
  ) {
    exceptions.unauthorized("Invalid email or password");
  }

  return user;
};
