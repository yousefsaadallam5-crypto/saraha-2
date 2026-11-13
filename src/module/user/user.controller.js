import { Router } from "express"
import { authenticate } from "../../common/index.js"
import { response } from "../../common/index.js"
import { profile } from "./user.service.js"

export const userController = Router()

userController.get("/profile", authenticate, async (req, res) => {
  const user = await profile(req.auth.sub)
  return response({
    res,
    data: user,
    message: "User profile",
  })
})

