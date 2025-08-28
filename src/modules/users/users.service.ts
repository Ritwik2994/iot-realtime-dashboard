import { Injectable, ConflictException, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserRole } from '@/shared/types';
import { IUser } from './interface/user.interface';
import { UsersRepository } from './repository/users.repository';
import { HelperService } from '@/helper/helper.service';
import { AuthUtils } from '../auth/auth.utils';
import { ResponseHandler } from '@/helper/response-handler/response-handler.service';
import { GlobalResponse } from '@/helper/response-handler/response-handler.interface';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly helperService: HelperService,
    private readonly authUtils: AuthUtils,
  ) {}

  onModuleInit() {
    this.initializeUser();
  }

  private async initializeUser(): Promise<void> {
    try {
      const userEmail = 'user1@iot-dashboard.com';
      const hashedPassword = await this.helperService.argon2hash('User@2525');

      const userData = {
        email: userEmail,
        username: 'user02',
        password: hashedPassword,
        role: UserRole.USER,
      };

      const existingUser = await this.usersRepository.findOne({
        email: userEmail,
        role: UserRole.USER,
      });

      if (!existingUser) {
        await this.usersRepository.create(userData);
      }
    } catch (error) {
      console.error('User initialization failed:', error.message);
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<GlobalResponse> {
    try {
      const { email } = createUserDto;

      // Check if user already exists
      const existingUser = await this.usersRepository.findOne({
        $or: [{ email }],
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.helperService.argon2hash(createUserDto.password);

      const userData = {
        ...createUserDto,
        role: UserRole.USER,
        password: hashedPassword,
        isActive: true,
        lastLogin: new Date(),
      };

      const user = await this.usersRepository.create(userData);

      return ResponseHandler.success({
        data: this.mapToUserResponse(user),
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async findAllUsers(queryDto: QueryUsersDto): Promise<GlobalResponse> {
    try {
      const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', nextPageToken } = queryDto;

      // Build filter query
      const filter: any = { isDeleted: false };

      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ];
      }

      // Handle cursor-based pagination
      if (nextPageToken) {
        try {
          const decodedToken = Buffer.from(nextPageToken, 'base64').toString('utf-8');
          const tokenData = JSON.parse(decodedToken);

          if (tokenData.createdAt && tokenData.id) {
            const sortDirection = sortOrder === 'desc' ? '$lt' : '$gt';
            filter.$or = [
              { createdAt: { [sortDirection]: new Date(tokenData.createdAt) } },
              {
                createdAt: new Date(tokenData.createdAt),
                _id: { [sortDirection]: tokenData.id },
              },
            ];
          }
        } catch (error) {
          this.logger.warn('Invalid next page token provided');
        }
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const allUsers = await this.usersRepository.find(filter);

      // Apply sorting
      allUsers.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });

      // Apply cursor-based pagination
      let filteredUsers = allUsers;
      if (nextPageToken) {
        try {
          const decodedToken = Buffer.from(nextPageToken, 'base64').toString('utf-8');
          const tokenData = JSON.parse(decodedToken);

          if (tokenData.createdAt && tokenData.id) {
            const tokenDate = new Date(tokenData.createdAt);
            const sortDirection = sortOrder === 'desc' ? -1 : 1;

            filteredUsers = allUsers.filter(user => {
              const userDate = new Date(user.createdAt);
              if (sortDirection === -1) {
                return (
                  userDate < tokenDate ||
                  (userDate.getTime() === tokenDate.getTime() && user._id.toString() < tokenData.id)
                );
              } else {
                return (
                  userDate > tokenDate ||
                  (userDate.getTime() === tokenDate.getTime() && user._id.toString() > tokenData.id)
                );
              }
            });
          }
        } catch (error) {
          this.logger.warn('Invalid next page token provided');
        }
      } else {
        // Apply offset-based pagination for first page
        const skip = (page - 1) * limit;
        filteredUsers = allUsers.slice(skip);
      }

      const total = allUsers.length;
      const hasNextPage = filteredUsers.length > limit;
      const data = hasNextPage ? filteredUsers.slice(0, limit) : filteredUsers;

      // Generate next page token
      let nextPageTokenResult: string | undefined;
      if (hasNextPage && data.length > 0) {
        const lastUser = data[data.length - 1];
        const tokenData = {
          createdAt: lastUser.createdAt.toISOString(),
          id: lastUser._id.toString(),
        };
        nextPageTokenResult = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      }

      return ResponseHandler.success({
        data: data.map(user => this.mapToUserResponse(user)),
        metadata: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          nextPageToken: nextPageTokenResult,
          hasNextPage,
        },
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async findUserById(id: string): Promise<GlobalResponse> {
    try {
      const user = await this.usersRepository.findOne({ _id: id });
      if (!user || user.isDeleted) {
        throw new NotFoundException('User not found');
      }

      return ResponseHandler.success({
        data: this.mapToUserResponse(user),
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  private mapToUserResponse(user: IUser) {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
