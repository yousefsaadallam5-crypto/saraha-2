import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getCipherInfo } from "node:crypto";

const configDirectory = dirname(fileURLToPath(import.meta.url));
const nodeEnvironment = process.env.NODE_ENV || "development";

config({
  path: resolve(configDirectory, `../.env.${nodeEnvironment}`),
  quiet: true,
});

const configService = {
  port: Number(process.env.PORT || 3000),
  DB_URI: process.env.DB_URI,
  SALT: Number(process.env.SALT),
  ENC_KEY: process.env.ENC_KEY,
  ENC_IV_LENGTH: Number(process.env.ENC_IV_LENGTH),
  ENC_ALGO: process.env.ENC_ALGO,
};

export const validateEncryptionConfig = () => {
  if (typeof configService.ENC_ALGO !== "string" || !configService.ENC_ALGO) {
    throw new Error("ENC_ALGO must be configured");
  }

  const cipherInfo = getCipherInfo(configService.ENC_ALGO);
  if (!cipherInfo) {
    throw new Error("ENC_ALGO must name a supported cipher");
  }

  if (!/^(?:[0-9a-f]{2})+$/i.test(configService.ENC_KEY || "")) {
    throw new Error("ENC_KEY must be a non-empty hexadecimal key");
  }

  if (Buffer.from(configService.ENC_KEY, "hex").length !== cipherInfo.keyLength) {
    throw new Error("ENC_KEY has an invalid length for ENC_ALGO");
  }

  if (
    !Number.isInteger(configService.ENC_IV_LENGTH) ||
    configService.ENC_IV_LENGTH !== cipherInfo.ivLength
  ) {
    throw new Error("ENC_IV_LENGTH is invalid for ENC_ALGO");
  }
};

export const validateConfig = () => {
  if (
    !Number.isInteger(configService.port) ||
    configService.port < 1 ||
    configService.port > 65535
  ) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  if (!configService.DB_URI?.trim()) {
    throw new Error("DB_URI must be configured");
  }

  if (!Number.isInteger(configService.SALT) || configService.SALT < 4 || configService.SALT > 31) {
    throw new Error("SALT must be an integer between 4 and 31");
  }

  validateEncryptionConfig();
};

export default configService;