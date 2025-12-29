import crypto from 'crypto';

export class TokenEncryption {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly IV_LENGTH = 16;
  private static readonly KEY_HASH_ALGORITHM = 'sha256';

  private static getEncryptionKey(): Buffer {
    const keyEnv = process.env.CHUTES_ENCRYPTION_KEY;
    
    if (!keyEnv) {
      throw new Error('CHUTES_ENCRYPTION_KEY environment variable is not set');
    }

    if (keyEnv.length === 32) {
      return Buffer.from(keyEnv, 'hex');
    }

    if (keyEnv.length === 64 && /^[0-9a-fA-F]+$/.test(keyEnv)) {
      return Buffer.from(keyEnv, 'hex');
    }

    return crypto.createHash(this.KEY_HASH_ALGORITHM).update(keyEnv).digest();
  }

  public static encrypt(text: string, providedIv?: Buffer): { encrypted: string; iv: string } {
    if (!text) {
      return { encrypted: '', iv: '' };
    }

    const key = this.getEncryptionKey();
    const iv = providedIv || crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    const encryptedBuffer = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);

    return {
      encrypted: encryptedBuffer.toString('base64'),
      iv: iv.toString('base64'),
    };
  }

  public static decrypt(encryptedBase64: string, ivBase64: string): string {
    if (!encryptedBase64 || !ivBase64) {
      return '';
    }

    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(ivBase64, 'base64');
      const encrypted = Buffer.from(encryptedBase64, 'base64');

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      
      const decryptedBuffer = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decryptedBuffer.toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }
}