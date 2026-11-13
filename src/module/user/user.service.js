import { exceptions } from "../../common/index.js"
import { userModel } from "../../database/modle/index.js"

export const profile = async (userId) => {
  const user = await userModel.findById(userId)
  if (!user) {
    exceptions.unauthorized("User session is no longer valid")
  }
  return user
}