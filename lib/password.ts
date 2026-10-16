import bcrypt from "bcrypt";
import { encrypt } from "./encryption";

export interface PasswordData {
  password_hash: string;
  encrypted_password: string;
  encryption_iv: string;
  encryption_auth_tag: string;
}

export async function generatePasswordData(
  plainPassword: string
): Promise<PasswordData> {

  console.log("[Password] Mulai bcrypt hash");

  const password_hash = await bcrypt.hash(plainPassword, 10);

  console.log("[Password] Bcrypt berhasil");

  console.log("[Password] Mulai encryption");

  const result = encrypt(plainPassword);

  console.log("[Password] Encryption berhasil");

  const { encrypted, iv, authTag } = result;

  return {
    password_hash,
    encrypted_password: encrypted,
    encryption_iv: iv,
    encryption_auth_tag: authTag,
  };
}