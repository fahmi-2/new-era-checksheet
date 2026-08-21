// src/lib/password.ts
import bcrypt from 'bcrypt';
import { encrypt } from './encryption';

export interface PasswordData {
    password_hash: string;
    encrypted_password: string;
    encryption_iv: string;
    encryption_auth_tag: string;
}

/**
 * Menghasilkan hash bcrypt dan enkripsi AES dari satu plain password
 * Gunakan ini saat Signup atau Update Password
 */
export async function generatePasswordData(plainPassword: string): Promise<PasswordData> {
    const password_hash = await bcrypt.hash(plainPassword, 10);
    const { encrypted, iv, authTag } = encrypt(plainPassword);

    return {
        password_hash,
        encrypted_password: encrypted,
        encryption_iv: iv,
        encryption_auth_tag: authTag
    };
}

/**
 * Verifikasi password saat login (tetap menggunakan bcrypt)
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
}