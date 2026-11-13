import { Router } from "express"
import { response } from "../../common/index.js"
import { googleLogin, login, signup } from "./auth.service.js"

export const authController = Router()

authController.post("/signup", async (req, res) => {
  const result = await signup(req.body)
  return response({
    res,
    data: { ...result.user.toJSON(), token: result.token },
    status: 201,
    message: "User created successfully",
  })
})

authController.post("/login", async (req, res) => {
  const result = await login(req.body)
  return response({
    res,
    data: result.token,
    message: "User logged in successfully",
  })
})

authController.post("/google", async (req, res) => {
  const result = await googleLogin(req.body)
  return response({
    res,
    data: result.token,
    message: "User logged in successfully",
  })
})
