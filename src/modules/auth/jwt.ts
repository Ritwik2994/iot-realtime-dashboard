import * as elliptic from 'elliptic';
import { base64url, createLocalJWKSet, EncryptJWT, importJWK, jwtDecrypt, jwtVerify, SignJWT } from 'jose';

import { computeHash, encodeBase64, pick } from '../../helper/utils';
import { getEnvVariable } from '@/shared/config/config';

const serverSecret = base64url.decode(getEnvVariable('SERVER_SECRET'));
const enc = 'A256CBC-HS512';
const DEFAULT_MAX_AGE = 1 * 24 * 60 * 60; // 24 hours
const now = () => (Date.now() / 1000) | 0;
const alg = 'dir';

export async function signJWT(issuer: string, payload: any, expirationTime: number = DEFAULT_MAX_AGE): Promise<string> {
  const privateJwk = await importJWK(await getPrivateJwk());
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(now() + expirationTime)
    .sign(privateJwk);
}

export async function verifyJWT(jwt: string, issuer: string) {
  const jwkSet = createLocalJWKSet(await getPublicJwkSet());
  const verified = await jwtVerify(jwt, jwkSet, {
    issuer,
  });
  return verified.payload;
}

export async function getPrivateJwk() {
  const secretHash = computeHash('SHA-256', serverSecret);
  const priv = new Uint8Array(secretHash);

  const ec = new elliptic.ec('p256');
  const key = ec.keyFromPrivate(priv);
  const publicKey = key.getPublic();

  return {
    kty: 'EC',
    crv: 'P-256',
    d: encodeBase64(priv),
    x: encodeBase64(publicKey.getX().toBuffer()),
    y: encodeBase64(publicKey.getY().toBuffer()),
  };
}

export async function getPublicJwkSet() {
  const privateJwk = await getPrivateJwk();
  const jwk = pick(privateJwk, ['kty', 'crv', 'x', 'y']);
  return {
    keys: [jwk],
  };
}

export async function encryptJWE(issuer: string, payload: any, expirationTime = DEFAULT_MAX_AGE): Promise<string> {
  return await new EncryptJWT(payload)
    .setProtectedHeader({ alg, enc })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(now() + expirationTime)
    .encrypt(serverSecret);
}

export async function decryptJWE(jwt: string, issuer?: string) {
  try {
    if (!jwt) {
      throw new Error('Provided JWT is empty');
    }
    const { payload } = await jwtDecrypt(jwt, serverSecret);

    return payload;
  } catch (error) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      throw new Error(`JWT Expired`);
    }
    throw new Error();
  }
}
