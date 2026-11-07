import { Router } from "express";
import { response } from "../../common/index.js";
import { login, signup } from "./auth.service.js";

export const authController = Router();

authController.post("/signup", async (req, res) => {
  const user = await signup(req.body);
  return response({
    res,
    data: user,
    status: 201,
    message: "User created successfully",
  });
});

authController.post("/login", async (req, res) => {
  const user = await login(req.body);
  return response({
    res,
    data: user,
    message: "User logged in successfully",
  });
});
