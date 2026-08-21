// src/lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for GCM

/**
 * Mengambil dan memvalidasi Encryption Key dari Environment Variable
 */
function getKey(): Buffer {
    const envKey = process.env.ENCRYPTION_KEY;
    if (!envKey) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables.');
    }
    // Derive a 32-byte key from the env string using SHA-256
    return crypto.createHash('sha256').update(String(envKey)).digest();
}

/**
 * Mengenkripsi plain text password
 */
export function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

/**
 * Mendekripsi password yang terenkripsi
 */
export function decrypt(encrypted: string, iv: string, authTag: string): string {
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}