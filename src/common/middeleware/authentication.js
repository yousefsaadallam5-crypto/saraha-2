import { exceptions } from "../utils/exceptions.js"
import { verifyToken } from "../security/index.js"

export const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization
  const match =
    typeof authorization === "string" &&
    authorization.match(/^Bearer\s+(\S+)$/i)

  if (!match) {
    exceptions.unauthorized("A Bearer token is required")
  }

  let payload
  try {
    payload = verifyToken({ token: match[1] })
  } catch {
    exceptions.unauthorized("Invalid or expired token")
  }

  if (!payload || typeof payload !== "object" || typeof payload.sub !== "string") {
    exceptions.unauthorized("Invalid token payload")
  }

  req.auth = payload
  next()
}
