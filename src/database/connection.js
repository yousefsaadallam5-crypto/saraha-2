import mongoose from "mongoose"
import configService from "../config/config.service.js"

export const dbconnect = async () => {
  try {
    await mongoose.connect(configService.DB_URI)
    console.log("DB connected")
  } catch (error) {
    throw new Error("Database connection failed", { cause: error })
  }
}