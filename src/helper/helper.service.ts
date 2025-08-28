import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { Types } from 'mongoose';
import { ISort } from '@/shared/types';
import { SortEnum } from '@/shared/enum/common.enum';

@Injectable()
export class HelperService {
  private readonly IV_KEY: string = this.configService.get('IV_KEY');
  private readonly ENCRYPTION_KEY_32_BYTE: string = this.configService.get("'ENCRYPTION_KEY_32_BYTE");
  private readonly ALGORITHM: string = 'aes-256-cbc';

  constructor(private readonly configService: ConfigService) {}

  searchDataStartingWith(data: string) {
    return { $regex: new RegExp(`^${data}`, 'i') };
  }

  searchDataAnywhere(data: string) {
    const escapedData = data.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return { $regex: new RegExp(escapedData, 'i') };
  }

  async buildSort(sortField?: string, sortEnum?: string): Promise<ISort> {
    const sortOrderValue = sortEnum === SortEnum.ASC ? 1 : -1;
    return sortField ? { [sortField]: sortOrderValue } : { _id: sortOrderValue };
  }

  async argon2hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      hashLength: 32,
      parallelism: 4,
      memoryCost: 65_536,
      timeCost: 10,
      salt: randomBytes(16),
    });
  }

  async argon2verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async decryptMessage(encryptedData: string): Promise<string> {
    const decipher = createDecipheriv(
      this.ALGORITHM,
      Buffer.from(this.ENCRYPTION_KEY_32_BYTE),
      Buffer.from(this.IV_KEY),
    );
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf-8');
    decryptedData += decipher.final('utf8');
    return decryptedData;
  }

  async encryptMessage(message: string): Promise<string> {
    const cipher = createCipheriv(this.ALGORITHM, Buffer.from(this.ENCRYPTION_KEY_32_BYTE), Buffer.from(this.IV_KEY));
    let encryptedData = cipher.update(message, 'utf-8', 'hex');
    encryptedData += cipher.final('hex');
    return encryptedData;
  }

  async idFieldValidator(id: string): Promise<'_id' | 'slug'> {
    try {
      new Types.ObjectId(id);
      return '_id';
    } catch {
      return 'slug';
    }
  }
}

export function generateEnumValidationMessage<T extends Record<string, number | string>>(
  enumObj: T,
  title: string,
): string {
  const enumEntries = Object.entries(enumObj)
    .filter(([_, value]) => typeof value === 'number')
    .map(([key, value]) => `${key} (${value})`);

  return `${title} must be one of the following values: ${enumEntries.join(', ')}`;
}
