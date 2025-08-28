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
import { GqlExecutionContext } from '@nestjs/graphql';

import { AuthUtils } from './auth.utils';
import { UserRole } from '@/shared/types';
import { ResponseMessage } from '@/shared/constant/responseMessage';
import { UsersRepository } from '../users/repository/users.repository';
import { AdminRepository } from './repository/admin.repository';

export const ROLES_KEY = 'roles';

@Injectable()
export class GraphQLAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersRepository: UsersRepository,
    private readonly adminRepository: AdminRepository,
    private readonly authUtils: AuthUtils,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const gqlContext = GqlExecutionContext.create(context);
      const { req } = gqlContext.getContext();

      if (!req) {
        throw new UnauthorizedException('Request context not available');
      }

      const requiredRoles = this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler());

      // Check if the request is authenticated using JWT
      if (!req?.headers?.authorization) {
        throw new UnauthorizedException(ResponseMessage.UNAUTHORIZED);
      }

      const user = await this.validateToken(req.headers.authorization);

      if (!user) {
        throw new UnauthorizedException(ResponseMessage.UNAUTHORIZED);
      }

      const hasAccess = !requiredRoles || requiredRoles.length === 0 || requiredRoles.includes(user?.role);

      if (!hasAccess) {
        throw new UnauthorizedException(ResponseMessage.FORBIDDEN);
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(ResponseMessage.UNAUTHORIZED);
    }
  }

  private async validateToken(authHeader: string): Promise<any> {
    const tokenParts = authHeader.split(' ');
    if (tokenParts[0] !== 'Bearer') {
      throw new UnauthorizedException(ResponseMessage.JWT_BEARER_MISSING);
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
        });
      } else {
        userData = await this.usersRepository.findOne({
          email: tokenInfo['email'],
        });
      }

      if (!userData) {
        throw new UnauthorizedException(ResponseMessage.UNAUTHORIZED);
      }

      // Check if the stored token matches the provided token
      if (userData.token !== token) {
        throw new UnauthorizedException(ResponseMessage.UNAUTHORIZED);
      }

      return { ...userData, ...tokenInfo };
    } catch (error) {
      throw new UnauthorizedException(ResponseMessage.UNAUTHORIZED);
    }
  }
}

export function Auth(...roles: UserRole[]) {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(GraphQLAuthGuard));
}
