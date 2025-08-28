// Mock environment variables
process.env.SERVER_SECRET = 'test-secret-key-for-jwt-encryption';
process.env.NODE_ENV = 'development';
process.env.PORT = '3000';
process.env.DB_MONGO_URI = 'mongodb://localhost:27017/test';
process.env.ALLOWED_DOMAINS = 'http://localhost:3000';
process.env.THROTTLE_TTL = '60';
process.env.THROTTLE_LIMIT = '100';
process.env.ACCESS_TOKEN_EXPIRATION_TIME = '3600';
process.env.ENCRYPTION_KEY_32_BYTE = '12345678901234567890123456789012';
process.env.IV_KEY = '1234567890123456';

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { GlobalResponse } from '@/helper/response-handler/response-handler.interface';
import { RestAuthGuard } from '../auth/auth.guard';
import { UsersRepository } from './repository/users.repository';
import { AdminRepository } from '../auth/repository/admin.repository';
import { AuthUtils } from '../auth/auth.utils';

// Mock the service
const mockUsersService = {
  createUser: jest.fn(),
  findAllUsers: jest.fn(),
  findUserById: jest.fn(),
};

// Mock the guard dependencies
const mockUsersRepository = {
  findOne: jest.fn(),
};

const mockAdminRepository = {
  findOne: jest.fn(),
};

const mockAuthUtils = {
  decodeAccessToken: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: AdminRepository,
          useValue: mockAdminRepository,
        },
        {
          provide: AuthUtils,
          useValue: mockAuthUtils,
        },
        RestAuthGuard,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockCreateDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    };

    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 201,
      data: {
        id: 'user_id_1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should create user successfully', async () => {
      service.createUser.mockResolvedValue(mockServiceResponse);

      const result = await controller.createUser(mockCreateDto);

      expect(service.createUser).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 400,
        error: { message: 'User creation failed' },
      };
      service.createUser.mockResolvedValue(errorResponse);

      const result = await controller.createUser(mockCreateDto);

      expect(service.createUser).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual(errorResponse);
    });

    it('should handle validation errors', async () => {
      const invalidDto = {
        email: 'invalid-email',
        name: '',
        password: '123',
      } as CreateUserDto;

      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 400,
        error: { message: 'Validation failed' },
      };
      service.createUser.mockResolvedValue(errorResponse);

      const result = await controller.createUser(invalidDto);

      expect(service.createUser).toHaveBeenCalledWith(invalidDto);
      expect(result).toEqual(errorResponse);
    });
  });

  describe('findAllUsers', () => {
    const mockQueryDto: QueryUsersDto = {
      page: 1,
      limit: 10,
      search: 'test',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 200,
      data: [
        {
          id: 'user_1',
          email: 'user1@example.com',
          name: 'User One',
          role: 'USER',
          isActive: true,
          lastLogin: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'user_2',
          email: 'user2@example.com',
          name: 'User Two',
          role: 'USER',
          isActive: true,
          lastLogin: new Date('2024-01-02'),
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ],
      metadata: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        nextPageToken: undefined,
        hasNextPage: false,
      },
    };

    it('should get all users with filters', async () => {
      service.findAllUsers.mockResolvedValue(mockServiceResponse);

      const result = await controller.findAllUsers(mockQueryDto);

      expect(service.findAllUsers).toHaveBeenCalledWith(mockQueryDto);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should get all users with default query', async () => {
      const defaultQueryDto: QueryUsersDto = {};
      service.findAllUsers.mockResolvedValue(mockServiceResponse);

      const result = await controller.findAllUsers(defaultQueryDto);

      expect(service.findAllUsers).toHaveBeenCalledWith(defaultQueryDto);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 400,
        error: { message: 'Query failed' },
      };
      service.findAllUsers.mockResolvedValue(errorResponse);

      const result = await controller.findAllUsers(mockQueryDto);

      expect(service.findAllUsers).toHaveBeenCalledWith(mockQueryDto);
      expect(result).toEqual(errorResponse);
    });

    it('should handle pagination parameters', async () => {
      const paginationQueryDto: QueryUsersDto = {
        page: 2,
        limit: 5,
        sortBy: 'email',
        sortOrder: 'asc',
      };
      service.findAllUsers.mockResolvedValue(mockServiceResponse);

      const result = await controller.findAllUsers(paginationQueryDto);

      expect(service.findAllUsers).toHaveBeenCalledWith(paginationQueryDto);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle search parameters', async () => {
      const searchQueryDto: QueryUsersDto = {
        search: 'john',
        page: 1,
        limit: 20,
      };
      service.findAllUsers.mockResolvedValue(mockServiceResponse);

      const result = await controller.findAllUsers(searchQueryDto);

      expect(service.findAllUsers).toHaveBeenCalledWith(searchQueryDto);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle cursor-based pagination', async () => {
      const cursorQueryDto: QueryUsersDto = {
        nextPageToken: Buffer.from(
          JSON.stringify({
            createdAt: '2024-01-01T00:00:00.000Z',
            id: 'user_1',
          }),
        ).toString('base64'),
        limit: 10,
      };
      service.findAllUsers.mockResolvedValue(mockServiceResponse);

      const result = await controller.findAllUsers(cursorQueryDto);

      expect(service.findAllUsers).toHaveBeenCalledWith(cursorQueryDto);
      expect(result).toEqual(mockServiceResponse);
    });
  });

  describe('findUserById', () => {
    const mockId = 'user_id_1';
    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 200,
      data: {
        id: mockId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should get user by ID successfully', async () => {
      service.findUserById.mockResolvedValue(mockServiceResponse);

      const result = await controller.findUserById(mockId);

      expect(service.findUserById).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 404,
        error: { message: 'User not found' },
      };
      service.findUserById.mockResolvedValue(errorResponse);

      const result = await controller.findUserById(mockId);

      expect(service.findUserById).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(errorResponse);
    });

    it('should handle empty ID', async () => {
      service.findUserById.mockResolvedValue(mockServiceResponse);

      const result = await controller.findUserById('');

      expect(service.findUserById).toHaveBeenCalledWith('');
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle invalid ID format', async () => {
      const invalidId = 'invalid_id_format';
      service.findUserById.mockResolvedValue(mockServiceResponse);

      const result = await controller.findUserById(invalidId);

      expect(service.findUserById).toHaveBeenCalledWith(invalidId);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle null ID', async () => {
      const nullId = null as any;
      service.findUserById.mockResolvedValue(mockServiceResponse);

      const result = await controller.findUserById(nullId);

      expect(service.findUserById).toHaveBeenCalledWith(nullId);
      expect(result).toEqual(mockServiceResponse);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null parameters in createUser', async () => {
      const nullDto = null as any;
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 201,
        data: null,
      };
      service.createUser.mockResolvedValue(mockServiceResponse);

      const result = await controller.createUser(nullDto);

      expect(service.createUser).toHaveBeenCalledWith(nullDto);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle undefined parameters in findAllUsers', async () => {
      const undefinedDto = undefined as any;
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        data: [],
      };
      service.findAllUsers.mockResolvedValue(mockServiceResponse);

      const result = await controller.findAllUsers(undefinedDto);

      expect(service.findAllUsers).toHaveBeenCalledWith(undefinedDto);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle large limit values', async () => {
      const largeLimitDto: QueryUsersDto = {
        limit: 1000,
        page: 1,
      };
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        data: [],
      };
      service.findAllUsers.mockResolvedValue(mockServiceResponse);

      const result = await controller.findAllUsers(largeLimitDto);

      expect(service.findAllUsers).toHaveBeenCalledWith(largeLimitDto);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle special characters in search', async () => {
      const specialSearchDto: QueryUsersDto = {
        search: 'test@example.com',
        page: 1,
        limit: 10,
      };
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        data: [],
      };
      service.findAllUsers.mockResolvedValue(mockServiceResponse);

      const result = await controller.findAllUsers(specialSearchDto);

      expect(service.findAllUsers).toHaveBeenCalledWith(specialSearchDto);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle malformed next page token', async () => {
      const malformedTokenDto: QueryUsersDto = {
        nextPageToken: 'malformed_token_with_special_chars!@#$%',
        limit: 10,
      };
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        data: [],
      };
      service.findAllUsers.mockResolvedValue(mockServiceResponse);

      const result = await controller.findAllUsers(malformedTokenDto);

      expect(service.findAllUsers).toHaveBeenCalledWith(malformedTokenDto);
      expect(result).toEqual(mockServiceResponse);
    });
  });
});
