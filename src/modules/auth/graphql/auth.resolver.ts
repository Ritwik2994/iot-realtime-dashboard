import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { LoginResponse, LogoutResponse, UpdateCredentialsResponse, User, Admin } from './auth.model';
import { LoginInput, UpdateCredentialsInput } from './auth.input';

import { UserRole } from '@/shared/types';
import { RolesDecorator } from '../decorators/roles.decorator';
import { Auth } from '../graphql-auth.guard';
import { CurrentUserGraphQL } from '../decorators/current-user-graphql.decorator';
import { GraphQLThrottlerGuard } from '@/shared/core/graphql-throttler.guard';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  private convertToUserGraphQLType(user: any): User {
    if (!user) {
      throw new Error('User object is undefined or null');
    }

    return {
      id: user._id?.toString() || user.id || 'unknown',
      email: user.email || '',
      name: user.name || '',
      role: (user.role as UserRole) || UserRole.USER,
      isActive: user.isActive ?? true,
      lastLogin: user.lastLogin || new Date(),
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    };
  }

  private convertToAdminGraphQLType(admin: any): Admin {
    if (!admin) {
      throw new Error('Admin object is undefined or null');
    }

    return {
      id: admin._id?.toString() || admin.id || 'unknown',
      email: admin.email || '',
      role: (admin.role as UserRole) || UserRole.ADMIN,
      isActive: admin.isActive ?? true,
      lastLogin: admin.lastLogin || new Date(),
      createdAt: admin.createdAt || new Date(),
      updatedAt: admin.updatedAt || new Date(),
    };
  }

  @Mutation(() => LoginResponse, { description: 'Admin login' })
  @UseGuards(GraphQLThrottlerGuard)
  async adminLogin(@Args('input') input: LoginInput): Promise<LoginResponse> {
    const result = await this.authService.adminLogin(input as any);
    return {
      success: result.success,
      accessToken: result.data.accessToken,
    };
  }

  @Mutation(() => LoginResponse, { description: 'User login' })
  @UseGuards(GraphQLThrottlerGuard)
  async login(@Args('input') input: LoginInput): Promise<LoginResponse> {
    const result = await this.authService.login(input as any);
    return {
      success: result.success,
      accessToken: result.data.accessToken,
    };
  }

  @Mutation(() => LogoutResponse, { description: 'Admin logout' })
  @UseGuards(Auth)
  @RolesDecorator(UserRole.ADMIN)
  async adminLogout(@CurrentUserGraphQL() user: any): Promise<LogoutResponse> {
    const result = await this.authService.adminLogout(user);
    return {
      success: result.success,
      message: result.message,
    };
  }

  @Mutation(() => LogoutResponse, { description: 'User logout' })
  @UseGuards(Auth)
  async logout(@CurrentUserGraphQL() user: any): Promise<LogoutResponse> {
    const result = await this.authService.logout(user);
    return {
      success: result.success,
      message: result.message,
    };
  }

  @Mutation(() => UpdateCredentialsResponse, {
    description: 'Update admin credentials',
  })
  @UseGuards(Auth)
  @RolesDecorator(UserRole.ADMIN)
  async updateAdminCredentials(
    @CurrentUserGraphQL() user: any,
    @Args('input') input: UpdateCredentialsInput,
  ): Promise<UpdateCredentialsResponse> {
    const result = await this.authService.updateAdminCredentials(user, input as any);
    return {
      success: result.success,
      data: result.data ? this.convertToAdminGraphQLType(result.data) : undefined,
      message: result.message,
    };
  }

  @Mutation(() => UpdateCredentialsResponse, {
    description: 'Update user credentials',
  })
  @UseGuards(Auth)
  async updateCredentials(
    @CurrentUserGraphQL() user: any,
    @Args('input') input: UpdateCredentialsInput,
  ): Promise<UpdateCredentialsResponse> {
    const result = await this.authService.updateCredentials(user, input as any);
    return {
      success: result.success,
      data: result.data ? this.convertToUserGraphQLType(result.data) : undefined,
      message: result.message,
    };
  }

  @Query(() => User, { description: 'Get current user profile' })
  @UseGuards(Auth)
  async getCurrentUser(@CurrentUserGraphQL() user: any): Promise<User> {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      return this.convertToUserGraphQLType(user);
    } catch (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }
  }

  @Query(() => Admin, { description: 'Get current admin profile' })
  @UseGuards(Auth)
  @RolesDecorator(UserRole.ADMIN)
  async getCurrentAdmin(@CurrentUserGraphQL() user: any): Promise<Admin> {
    try {
      return this.convertToAdminGraphQLType(user);
    } catch (error) {
      throw new Error(`Failed to get current admin: ${error.message}`);
    }
  }
}
