import express from "express";
import configService, { validateConfig } from "./config/config.service.js";
import { dbconnect } from "./database/connection.js";
import { errorHandler } from "./common/index.js";
import { authController } from "./module/index.js";

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use("/auth", authController);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hello World",
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use(errorHandler);

try {
  validateConfig();
  await dbconnect();
  const server = app.listen(configService.port, () => {
    console.log(`Server is running on port ${configService.port}`);
  });
  server.on("error", (error) => {
    console.error(`Server failed to start: ${error.message}`);
    process.exitCode = 1;
  });
} catch (error) {
  console.error(`Application startup failed: ${error.message}`);
  process.exitCode = 1;
}
