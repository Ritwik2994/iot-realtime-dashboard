import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '@/shared/types';
import { ResponseMessage } from '@/shared/constant/responseMessage';
import { UsersRepository } from '../users/repository/users.repository';
import { AdminRepository } from './repository/admin.repository';
import { ResponseHandler } from '@/helper/response-handler/response-handler.service';
import { AuthUtils } from './auth.utils';

export const ROLES_KEY = 'roles';

@Injectable()
export class RestAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersRepository: UsersRepository,
    private readonly adminRepository: AdminRepository,
    private readonly authUtils: AuthUtils,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean | any> {
    const req = context.switchToHttp().getRequest();
    const requiredRoles = this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler());

    // Check if the request is authenticated using JWT or GOOGLE
    if (!req?.headers?.authorization) {
      return ResponseHandler.errors.UNAUTHORIZED(ResponseMessage.UNAUTHORIZED);
    }

    try {
      req.user = await this.validateToken(req.headers.authorization);

      const hasAccess = !requiredRoles || requiredRoles.length === 0 || requiredRoles.includes(req?.user?.role);

      if (!hasAccess) {
        return false;
      }

      return true;
    } catch {
      // Ensure we throw an HttpException that the interceptor can handle
      return ResponseHandler.errors.UNAUTHORIZED(ResponseMessage.UNAUTHORIZED);
    }
  }

  private async validateToken(authHeader: string): Promise<any> {
    const tokenParts = authHeader.split(' ');
    if (tokenParts[0] !== 'Bearer') {
      return ResponseHandler.errors.FORBIDDEN(ResponseMessage.JWT_BEARER_MISSING);
    }
    const token = tokenParts[1];

    return this.validateEncryptedJWTToken(token);
  }

  private async validateEncryptedJWTToken(token: string) {
    try {
      const tokenInfo = await this.authUtils.decodeAccessToken(token);

      if (!tokenInfo.success) {
        throw new UnauthorizedException(ResponseMessage.UNAUTHORIZED);
      }

      let userData;

      if (tokenInfo.role === UserRole.ADMIN) {
        userData = await this.adminRepository.findOne({
          email: tokenInfo['email'],
          token,
        });
      } else {
        userData = await this.usersRepository.findOne({
          email: tokenInfo['email'],
          token,
        });
      }

      if (!userData) {
        throw new UnauthorizedException(ResponseMessage.UNAUTHORIZED);
      }
      return { ...userData, ...tokenInfo };
    } catch (error) {
      // Ensure we throw an HttpException that the interceptor can handle
      return ResponseHandler.transformError(error);
    }
  }
}

export function Auth(...roles: UserRole[]) {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(RestAuthGuard));
}
