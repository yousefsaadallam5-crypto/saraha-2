import jwt from "jsonwebtoken"
import configService from "../../config/config.service.js"

export const createToken = ({
  payload = {},
  options = {},
  secret = configService.JWT_SECRET,
}) =>
  jwt.sign(payload, secret, {
    expiresIn: configService.JWT_EXPIRES_IN,
    ...options,
  })

export const verifyToken = ({ token, secret = configService.JWT_SECRET }) =>
  jwt.verify(token, secret)