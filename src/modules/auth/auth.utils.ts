import { Injectable } from '@nestjs/common';

import { AccessTokenPayload, CreateAuthTokensParams } from './interface/auth.interface';
import { ACCESS_TOKEN_EXPIRATION_TIME, JWT_ISSUER } from '@/shared/constant/constant';
import { signJWT, encryptJWE, verifyJWT, decryptJWE } from './jwt';

@Injectable()
export class AuthUtils {
  async generateToken(
    payload: AccessTokenPayload,
    tokenFunction: typeof signJWT | typeof encryptJWE,
    expirationTime: number = ACCESS_TOKEN_EXPIRATION_TIME,
  ): Promise<string> {
    return tokenFunction(JWT_ISSUER, payload, expirationTime);
  }

  async decodeToken(token: string, decodeFunction: typeof verifyJWT | typeof decryptJWE): Promise<any> {
    try {
      const payload = await decodeFunction(token, JWT_ISSUER);

      return {
        success: true,
        role: payload.role,
        email: payload.email,
        exp: payload.exp,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  async createAccessTokens({ email, phoneNumber, role }: CreateAuthTokensParams): Promise<any> {
    return await this.generateToken(
      {
        role,
        email,
        phoneNumber,
      },
      encryptJWE,
    );
  }

  async decodeAccessToken(accessToken: string): Promise<any> {
    return await this.decodeToken(accessToken, decryptJWE);
  }
}
