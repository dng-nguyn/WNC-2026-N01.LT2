import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'node:crypto';
import { Setting } from './setting.entity';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Keys stored encrypted in DB (the SePay API key)
const ENCRYPTED_KEYS = new Set(['sepay_api_key']);

// Env var fallback mapping: DB key → env var name
const ENV_FALLBACK: Record<string, string> = {
  sepay_api_key: 'SEPAY_API_KEY',
  sepay_account_number: 'SEPAY_ACCOUNT_NUMBER',
  sepay_bank_name: 'SEPAY_BANK_NAME',
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly encryptionKey: Buffer | null;

  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('SETTINGS_ENCRYPTION_KEY')
      ?? this.configService.get<string>('JWT_SECRET');
    if (secret) {
      // Derive a 256-bit key from the secret using SHA-256
      this.encryptionKey = crypto.createHash('sha256').update(secret).digest();
    } else {
      this.encryptionKey = null;
      this.logger.warn('No SETTINGS_ENCRYPTION_KEY or JWT_SECRET — settings will be stored in plaintext');
    }
  }

  // ── Encryption ──

  private encrypt(plaintext: string): string {
    if (!this.encryptionKey) return plaintext;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format: base64(iv + tag + ciphertext)
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  private decrypt(encoded: string): string {
    if (!this.encryptionKey) return encoded;
    try {
      const data = Buffer.from(encoded, 'base64');
      const iv = data.subarray(0, IV_LENGTH);
      const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH);
      const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
      decipher.setAuthTag(tag);
      return decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8');
    } catch (err) {
      this.logger.error('Failed to decrypt setting — value may be corrupted');
      return encoded;
    }
  }

  // ── Core CRUD ──

  async get(key: string): Promise<string | null> {
    // Check DB first
    try {
      const setting = await this.settingsRepository.findOne({ where: { key } });
      if (setting) {
        return ENCRYPTED_KEYS.has(key) ? this.decrypt(setting.value) : setting.value;
      }
    } catch {
      // Table may not exist yet — fall through to env var fallback
    }

    // Fall back to env var
    const envKey = ENV_FALLBACK[key];
    if (envKey) {
      const envValue = this.configService.get<string>(envKey);
      if (envValue) return envValue;
    }

    return null;
  }

  async set(key: string, value: string): Promise<Setting> {
    let setting = await this.settingsRepository.findOne({ where: { key } });
    const storedValue = ENCRYPTED_KEYS.has(key) ? this.encrypt(value) : value;
    if (setting) {
      setting.value = storedValue;
    } else {
      setting = this.settingsRepository.create({ key, value: storedValue });
    }
    return this.settingsRepository.save(setting);
  }

  async delete(key: string): Promise<void> {
    await this.settingsRepository.delete(key);
  }

  async getMany(keys: string[]): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};
    for (const key of keys) {
      results[key] = await this.get(key);
    }
    return results;
  }
}
