import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { UsersService } from '../users.service';
import { UsersResponse, UserResponse, User } from '../../auth/graphql/auth.model';
import { CreateUserInput, QueryUsersInput } from '../../auth/graphql/auth.input';

import { UserRole } from '@/shared/types';
import { RolesDecorator } from '../../auth/decorators/roles.decorator';
import { Auth } from '../../auth/graphql-auth.guard';
import { GraphQLThrottlerGuard } from '@/shared/core/graphql-throttler.guard';

@Resolver(() => User)
@UseGuards(Auth)
@RolesDecorator(UserRole.ADMIN)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

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

  @Query(() => UsersResponse, {
    description: 'Get all users with pagination and filters',
  })
  async getAllUsers(@Args('input') input: QueryUsersInput): Promise<UsersResponse> {
    const result = await this.usersService.findAllUsers(input as any);
    return {
      success: true,
      data: result.data.map(user => this.convertToUserGraphQLType(user)),
      message: 'Users retrieved successfully',
      total: result.metadata.total,
      page: result.metadata.page,
      limit: result.metadata.limit,
      totalPages: result.metadata.totalPages,
      nextPageToken: result.metadata.nextPageToken,
      hasNextPage: result.metadata.hasNextPage,
    };
  }

  @Query(() => User, { description: 'Get user by ID' })
  async getUserById(@Args('id', { type: () => ID }) id: string): Promise<User> {
    try {
      const result = await this.usersService.findUserById(id);
      return this.convertToUserGraphQLType(result.data);
    } catch (error) {
      throw new Error(`Failed to get user by ID: ${error.message}`);
    }
  }

  @Mutation(() => UserResponse, { description: 'Create new user' })
  @UseGuards(GraphQLThrottlerGuard)
  async createUser(@Args('input') input: CreateUserInput): Promise<UserResponse> {
    try {
      const result = await this.usersService.createUser(input as any);
      return {
        success: true,
        data: this.convertToUserGraphQLType(result.data),
        message: 'User created successfully',
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  @Query(() => [User], { description: 'Get all active users' })
  async getActiveUsers(): Promise<User[]> {
    const result = await this.usersService.findAllUsers({
      limit: 1000,
      page: 1,
    } as any);

    const activeUsers = result.data.filter(user => user.isActive);
    return activeUsers.map(user => this.convertToUserGraphQLType(user));
  }

  @Query(() => Int, { description: 'Get total number of users' })
  async getTotalUsers(): Promise<number> {
    const result = await this.usersService.findAllUsers({
      limit: 1,
      page: 1,
    } as any);
    return result.metadata.total;
  }
}
