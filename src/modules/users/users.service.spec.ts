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
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './repository/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { IUser } from './interface/user.interface';
import { ResponseHandler } from '@/helper/response-handler/response-handler.service';
import { HelperService } from '@/helper/helper.service';
import { AuthUtils } from '../auth/auth.utils';
import { UserRole } from '@/shared/types';

// Mock the repository
const mockUsersRepository = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
};

// Mock the helper service
const mockHelperService = {
  argon2hash: jest.fn(),
  argon2verify: jest.fn(),
};

// Mock the auth utils
const mockAuthUtils = {
  generateAccessToken: jest.fn(),
  decodeAccessToken: jest.fn(),
};

// Mock the response handler
jest.mock('@/helper/response-handler/response-handler.service', () => ({
  ResponseHandler: {
    success: jest.fn(),
    transformError: jest.fn(),
  },
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let helperService: jest.Mocked<HelperService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: HelperService,
          useValue: mockHelperService,
        },
        {
          provide: AuthUtils,
          useValue: mockAuthUtils,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
    helperService = module.get(HelperService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockCreateDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    };

    const mockUser: Partial<IUser> = {
      _id: 'user_id_1',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword',
      role: UserRole.USER,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create user successfully', async () => {
      const hashedPassword = 'hashedPassword';
      const mockResponse = { success: true, data: mockUser };

      repository.findOne.mockResolvedValue(null);
      helperService.argon2hash.mockResolvedValue(hashedPassword);
      repository.create.mockResolvedValue(mockUser as IUser);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.createUser(mockCreateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        $or: [{ email: mockCreateDto.email }],
      });
      expect(helperService.argon2hash).toHaveBeenCalledWith(mockCreateDto.password);
      expect(repository.create).toHaveBeenCalledWith({
        ...mockCreateDto,
        role: UserRole.USER,
        password: hashedPassword,
        isActive: true,
        lastLogin: expect.any(Date),
      });
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: {
          id: mockUser._id.toString(),
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          isActive: mockUser.isActive,
          lastLogin: mockUser.lastLogin,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw ConflictException when user already exists', async () => {
      const existingUser = { _id: 'existing_user', email: 'test@example.com' };
      const mockErrorResponse = {
        success: false,
        error: 'User with this email already exists',
      };

      repository.findOne.mockResolvedValue(existingUser as IUser);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.createUser(mockCreateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        $or: [{ email: mockCreateDto.email }],
      });
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(ConflictException));
      expect(result).toEqual(mockErrorResponse);
    });

    it('should handle creation error', async () => {
      const error = new Error('Database error');
      const mockErrorResponse = { success: false, error: 'Database error' };

      repository.findOne.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.createUser(mockCreateDto);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
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

    const mockUsers = [
      {
        _id: 'user_1',
        email: 'user1@example.com',
        name: 'User One',
        role: UserRole.USER,
        isActive: true,
        lastLogin: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        _id: 'user_2',
        email: 'user2@example.com',
        name: 'User Two',
        role: UserRole.USER,
        isActive: true,
        lastLogin: new Date('2024-01-02'),
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    it('should find all users with filters', async () => {
      const mockResponse = {
        success: true,
        data: mockUsers.map(user => ({
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        metadata: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };

      repository.find.mockResolvedValue(mockUsers as IUser[]);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findAllUsers(mockQueryDto);

      expect(repository.find).toHaveBeenCalledWith({
        isDeleted: false,
        $or: [
          { email: { $regex: 'test', $options: 'i' } },
          { username: { $regex: 'test', $options: 'i' } },
          { name: { $regex: 'test', $options: 'i' } },
        ],
      });
      expect(result).toEqual(mockResponse);
    });

    it('should find all users with default query', async () => {
      const defaultQueryDto: QueryUsersDto = {};
      const mockResponse = {
        success: true,
        data: mockUsers.map(user => ({
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        metadata: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };

      repository.find.mockResolvedValue(mockUsers as IUser[]);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findAllUsers(defaultQueryDto);

      expect(repository.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toEqual(mockResponse);
    });

    it('should handle cursor-based pagination', async () => {
      const cursorQueryDto: QueryUsersDto = {
        ...mockQueryDto,
        nextPageToken: Buffer.from(
          JSON.stringify({
            createdAt: '2024-01-01T00:00:00.000Z',
            id: 'user_1',
          }),
        ).toString('base64'),
      };

      const mockResponse = {
        success: true,
        data: mockUsers.slice(1).map(user => ({
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        metadata: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };

      repository.find.mockResolvedValue(mockUsers as IUser[]);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findAllUsers(cursorQueryDto);

      expect(repository.find).toHaveBeenCalledWith({
        isDeleted: false,
        $or: [
          { createdAt: { $lt: new Date('2024-01-01T00:00:00.000Z') } },
          {
            createdAt: new Date('2024-01-01T00:00:00.000Z'),
            _id: { $lt: 'user_1' },
          },
        ],
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid next page token', async () => {
      const invalidTokenQueryDto: QueryUsersDto = {
        ...mockQueryDto,
        nextPageToken: 'invalid_token',
      };

      const mockResponse = {
        success: true,
        data: mockUsers.map(user => ({
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })),
        metadata: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };

      repository.find.mockResolvedValue(mockUsers as IUser[]);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findAllUsers(invalidTokenQueryDto);

      expect(repository.find).toHaveBeenCalledWith({
        isDeleted: false,
        $or: [
          { email: { $regex: 'test', $options: 'i' } },
          { username: { $regex: 'test', $options: 'i' } },
          { name: { $regex: 'test', $options: 'i' } },
        ],
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle query error', async () => {
      const error = new Error('Query failed');
      const mockErrorResponse = { success: false, error: 'Query failed' };

      repository.find.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.findAllUsers(mockQueryDto);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('findUserById', () => {
    const mockId = 'user_id_1';
    const mockUser: Partial<IUser> = {
      _id: mockId,
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.USER,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should find user by ID successfully', async () => {
      const mockResponse = { success: true, data: mockUser };

      repository.findOne.mockResolvedValue(mockUser as IUser);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findUserById(mockId);

      expect(repository.findOne).toHaveBeenCalledWith({ _id: mockId });
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: {
          id: mockUser._id.toString(),
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          isActive: mockUser.isActive,
          lastLogin: mockUser.lastLogin,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockErrorResponse = { success: false, error: 'User not found' };

      repository.findOne.mockResolvedValue(null);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.findUserById(mockId);

      expect(repository.findOne).toHaveBeenCalledWith({ _id: mockId });
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(NotFoundException));
      expect(result).toEqual(mockErrorResponse);
    });

    it('should throw NotFoundException when user is deleted', async () => {
      const deletedUser = { ...mockUser, isDeleted: true };
      const mockErrorResponse = { success: false, error: 'User not found' };

      repository.findOne.mockResolvedValue(deletedUser as IUser);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.findUserById(mockId);

      expect(repository.findOne).toHaveBeenCalledWith({ _id: mockId });
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(NotFoundException));
      expect(result).toEqual(mockErrorResponse);
    });

    it('should handle repository error', async () => {
      const error = new Error('Database error');
      const mockErrorResponse = { success: false, error: 'Database error' };

      repository.findOne.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.findUserById(mockId);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('Private methods', () => {
    describe('mapToUserResponse', () => {
      it('should map user to response format', () => {
        const mockUser: Partial<IUser> = {
          _id: 'user_id_1',
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER,
          isActive: true,
          lastLogin: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        };

        const serviceAny = service as any;
        const result = serviceAny.mapToUserResponse(mockUser);

        expect(result).toEqual({
          id: mockUser._id.toString(),
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          isActive: mockUser.isActive,
          lastLogin: mockUser.lastLogin,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        });
      });
    });
  });
});
