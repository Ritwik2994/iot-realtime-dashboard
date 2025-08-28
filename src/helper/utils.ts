import { createHash, randomBytes } from 'node:crypto';

import { BadRequestException } from '@nestjs/common';

export function isBase64(input: string): boolean {
  const regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  return regex.test(input);
}

export function isJWT(input: string): boolean {
  // Regex to check if the string matches the JWT structure
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  return jwtRegex.test(input);
}

export function encodeBase64(input: Uint8Array): string {
  const res = btoa(String.fromCharCode(...input));

  // sanity check
  if (!isBase64(res)) {
    throw new BadRequestException('Invalid base64 output; this should never happen');
  }

  return res;
}

export function computeHash(
  algorithm: 'sha256' | 'SHA-256' | 'sha1' | 'md5',
  secret: string | Buffer | any,
): ArrayBuffer {
  const hash = createHash(algorithm.toLowerCase()); // Convert algorithm to lowercase to match Node.js crypto module
  hash.update(secret); // Update the hash with the secret
  return Uint8Array.from(hash.digest()).buffer; // Return the result as ArrayBuffer
}

export function generateRandomValues(buffer: Uint8Array): Uint8Array {
  const randomBuffer = randomBytes(buffer.length);
  buffer.set(randomBuffer);
  return buffer;
}

export function pick<T extends {}, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k as K))) as any;
}
