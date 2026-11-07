import crypto from "node:crypto"
import configService, {
  validateEncryptionConfig,
} from "../../config/config.service.js";

export const encryption = (plaintext) => {
  if (typeof plaintext !== "string") {
    throw new TypeError("Value to encrypt must be a string");
  }

  validateEncryptionConfig();
  const key = Buffer.from(configService.ENC_KEY, "hex");
  const iv = crypto.randomBytes(configService.ENC_IV_LENGTH);
  const cipher = crypto.createCipheriv(configService.ENC_ALGO, key, iv);
  const encrypted = cipher.update(plaintext, "utf8", "hex") + cipher.final("hex");
  return `${iv.toString("hex")}::${encrypted}`;
};

export const decryption = (cipherText) => {
  if (typeof cipherText !== "string") {
    throw new TypeError("Value to decrypt must be a string");
  }

  const [hexIv, encrypted, ...extraParts] = cipherText.split("::");
  if (
    extraParts.length > 0 ||
    !/^(?:[0-9a-f]{2})+$/i.test(hexIv || "") ||
    !/^(?:[0-9a-f]{2})*$/i.test(encrypted || "")
  ) {
    throw new Error("Encrypted value has an invalid format");
  }

  validateEncryptionConfig();
  const iv = Buffer.from(hexIv, "hex");
  if (iv.length !== configService.ENC_IV_LENGTH) {
    throw new Error("Encrypted value has an invalid initialization vector");
  }

  const key = Buffer.from(configService.ENC_KEY, "hex");
  const decipher = crypto.createDecipheriv(configService.ENC_ALGO, key, iv);
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
};