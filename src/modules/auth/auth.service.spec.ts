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
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/repository/users.repository';
import { AdminRepository } from './repository/admin.repository';
import { HelperService } from '@/helper/helper.service';
import { AuthUtils } from './auth.utils';
import { LoginDto } from './dto/login.dto';
import { UpdateCredentialsDto } from './dto/updateCredentials.dto';
import { ResponseHandler } from '@/helper/response-handler/response-handler.service';
import { ResponseMessage } from '@/shared/constant/responseMessage';
import { UserRole } from '@/shared/types';

// Mock the repositories
const mockUsersRepository = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
};

const mockAdminRepository = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
};

// Mock the helper service
const mockHelperService = {
  argon2hash: jest.fn(),
  argon2verify: jest.fn(),
};

// Mock the auth utils
const mockAuthUtils = {
  createAccessTokens: jest.fn(),
  decodeAccessToken: jest.fn(),
};

// Mock the response handler
jest.mock('@/helper/response-handler/response-handler.service', () => ({
  ResponseHandler: {
    success: jest.fn(),
    transformError: jest.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let adminRepository: jest.Mocked<AdminRepository>;
  let helperService: jest.Mocked<HelperService>;
  let authUtils: jest.Mocked<AuthUtils>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: AdminRepository,
          useValue: mockAdminRepository,
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

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    adminRepository = module.get(AdminRepository);
    helperService = module.get(HelperService);
    authUtils = module.get(AuthUtils);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('adminLogin', () => {
    const mockLoginDto: LoginDto = {
      email: 'admin@iot-dashboard.com',
      password: 'admin123',
    };

    const mockAdmin = {
      _id: 'admin_id_1',
      email: 'admin@iot-dashboard.com',
      password: 'hashedPassword',
      role: UserRole.ADMIN,
      token: '',
      lastLogin: new Date(),
    } as any;

    it('should login admin successfully', async () => {
      const accessToken = 'admin_access_token';
      const mockResponse = { success: true, data: { accessToken } };

      adminRepository.findOne.mockResolvedValue(mockAdmin);
      helperService.argon2verify.mockResolvedValue(true);
      authUtils.createAccessTokens.mockResolvedValue(accessToken);
      adminRepository.findOneAndUpdate.mockResolvedValue(mockAdmin);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.adminLogin(mockLoginDto);

      expect(adminRepository.findOne).toHaveBeenCalledWith({
        email: mockLoginDto.email,
        role: UserRole.ADMIN,
      });
      expect(helperService.argon2verify).toHaveBeenCalledWith(mockAdmin.password, mockLoginDto.password);
      expect(authUtils.createAccessTokens).toHaveBeenCalledWith({
        email: mockAdmin.email,
        role: mockAdmin.role,
      });
      expect(adminRepository.findOneAndUpdate).toHaveBeenCalledWith({ email: mockAdmin.email }, { token: accessToken });
      expect(adminRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { email: mockAdmin.email },
        { lastLogin: expect.any(Date) },
      );
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: { accessToken },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when admin not found', async () => {
      const mockErrorResponse = {
        success: false,
        error: ResponseMessage.NOT_FOUND,
      };

      adminRepository.findOne.mockResolvedValue(null);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.adminLogin(mockLoginDto);

      expect(adminRepository.findOne).toHaveBeenCalledWith({
        email: mockLoginDto.email,
        role: UserRole.ADMIN,
      });
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(NotFoundException));
      expect(result).toEqual(mockErrorResponse);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockErrorResponse = {
        success: false,
        error: ResponseMessage.UNAUTHORIZED,
      };

      adminRepository.findOne.mockResolvedValue(mockAdmin);
      helperService.argon2verify.mockResolvedValue(false);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.adminLogin(mockLoginDto);

      expect(adminRepository.findOne).toHaveBeenCalledWith({
        email: mockLoginDto.email,
        role: UserRole.ADMIN,
      });
      expect(helperService.argon2verify).toHaveBeenCalledWith(mockAdmin.password, mockLoginDto.password);
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(UnauthorizedException));
      expect(result).toEqual(mockErrorResponse);
    });

    it('should handle authentication error', async () => {
      const error = new Error('Authentication failed');
      const mockErrorResponse = {
        success: false,
        error: 'Authentication failed',
      };

      adminRepository.findOne.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.adminLogin(mockLoginDto);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('login', () => {
    const mockLoginDto: LoginDto = {
      email: 'user@example.com',
      password: 'password123',
    };

    const mockUser = {
      _id: 'user_id_1',
      email: 'user@example.com',
      password: 'hashedPassword',
      role: UserRole.USER,
      token: '',
      lastLogin: new Date(),
    } as any;

    it('should login user successfully', async () => {
      const accessToken = 'user_access_token';
      const mockResponse = { success: true, data: { accessToken } };

      usersRepository.findOne.mockResolvedValue(mockUser);
      helperService.argon2verify.mockResolvedValue(true);
      authUtils.createAccessTokens.mockResolvedValue(accessToken);
      usersRepository.findOneAndUpdate.mockResolvedValue(mockUser);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.login(mockLoginDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        email: mockLoginDto.email,
        role: UserRole.USER,
      });
      expect(helperService.argon2verify).toHaveBeenCalledWith(mockUser.password, mockLoginDto.password);
      expect(authUtils.createAccessTokens).toHaveBeenCalledWith({
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(usersRepository.findOneAndUpdate).toHaveBeenCalledWith({ email: mockUser.email }, { token: accessToken });
      expect(usersRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { email: mockUser.email },
        { lastLogin: expect.any(Date) },
      );
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: { accessToken },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when user not found', async () => {
      const mockErrorResponse = {
        success: false,
        error: ResponseMessage.NOT_FOUND,
      };

      usersRepository.findOne.mockResolvedValue(null);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.login(mockLoginDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        email: mockLoginDto.email,
        role: UserRole.USER,
      });
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(NotFoundException));
      expect(result).toEqual(mockErrorResponse);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockErrorResponse = {
        success: false,
        error: ResponseMessage.UNAUTHORIZED,
      };

      usersRepository.findOne.mockResolvedValue(mockUser);
      helperService.argon2verify.mockResolvedValue(false);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.login(mockLoginDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        email: mockLoginDto.email,
        role: UserRole.USER,
      });
      expect(helperService.argon2verify).toHaveBeenCalledWith(mockUser.password, mockLoginDto.password);
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(UnauthorizedException));
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('adminLogout', () => {
    const mockUserData = {
      email: 'admin@iot-dashboard.com',
      role: UserRole.ADMIN,
    } as any;

    it('should logout admin successfully', async () => {
      const mockResponse = {
        success: true,
        data: { message: ResponseMessage.SUCCESS_MESSAGE_RESPONSE },
      };

      adminRepository.findOneAndUpdate.mockResolvedValue(mockUserData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.adminLogout(mockUserData);

      expect(adminRepository.findOneAndUpdate).toHaveBeenCalledWith({ email: mockUserData.email }, { token: '' });
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: { message: ResponseMessage.SUCCESS_MESSAGE_RESPONSE },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle logout error', async () => {
      const error = new Error('Logout failed');
      const mockErrorResponse = { success: false, error: 'Logout failed' };

      adminRepository.findOneAndUpdate.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.adminLogout(mockUserData);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('logout', () => {
    const mockUserData = {
      email: 'user@example.com',
      role: UserRole.USER,
    } as any;

    it('should logout user successfully', async () => {
      const mockResponse = {
        success: true,
        data: { message: ResponseMessage.SUCCESS_MESSAGE_RESPONSE },
      };

      usersRepository.findOneAndUpdate.mockResolvedValue(mockUserData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.logout(mockUserData);

      expect(usersRepository.findOneAndUpdate).toHaveBeenCalledWith({ email: mockUserData.email }, { token: '' });
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: { message: ResponseMessage.SUCCESS_MESSAGE_RESPONSE },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle logout error', async () => {
      const error = new Error('Logout failed');
      const mockErrorResponse = { success: false, error: 'Logout failed' };

      usersRepository.findOneAndUpdate.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.logout(mockUserData);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('updateAdminCredentials', () => {
    const mockUser = {
      email: 'admin@iot-dashboard.com',
      password: 'hashedCurrentPassword',
      role: UserRole.ADMIN,
    } as any;

    const mockUpdateCredentialsDto: UpdateCredentialsDto = {
      currentPassword: 'admin123',
      newPassword: 'NewAdmin123!',
    };

    it('should update admin credentials successfully', async () => {
      const hashedNewPassword = 'hashedNewPassword';
      const updatedAdmin = { ...mockUser, password: hashedNewPassword };
      const mockResponse = { success: true, data: updatedAdmin };

      helperService.argon2verify.mockResolvedValue(true);
      helperService.argon2hash.mockResolvedValue(hashedNewPassword);
      adminRepository.findOneAndUpdate.mockResolvedValue(updatedAdmin);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.updateAdminCredentials(mockUser, mockUpdateCredentialsDto);

      expect(helperService.argon2verify).toHaveBeenCalledWith(
        mockUser.password,
        mockUpdateCredentialsDto.currentPassword,
      );
      expect(helperService.argon2hash).toHaveBeenCalledWith(mockUpdateCredentialsDto.newPassword);
      expect(adminRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { email: mockUser.email },
        { password: hashedNewPassword },
      );
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: updatedAdmin,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw ConflictException when current password is invalid', async () => {
      const mockErrorResponse = {
        success: false,
        error: ResponseMessage.PASSWORD_MISMATCH,
      };

      helperService.argon2verify.mockResolvedValue(false);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.updateAdminCredentials(mockUser, mockUpdateCredentialsDto);

      expect(helperService.argon2verify).toHaveBeenCalledWith(
        mockUser.password,
        mockUpdateCredentialsDto.currentPassword,
      );
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(ConflictException));
      expect(result).toEqual(mockErrorResponse);
    });

    it('should handle update error', async () => {
      const error = new Error('Update failed');
      const mockErrorResponse = { success: false, error: 'Update failed' };

      helperService.argon2verify.mockResolvedValue(true);
      helperService.argon2hash.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.updateAdminCredentials(mockUser, mockUpdateCredentialsDto);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('updateCredentials', () => {
    const mockUser = {
      email: 'user@example.com',
      password: 'hashedCurrentPassword',
      role: UserRole.USER,
    } as any;

    const mockUpdateCredentialsDto: UpdateCredentialsDto = {
      currentPassword: 'password123',
      newPassword: 'NewPassword123!',
    };

    it('should update user credentials successfully', async () => {
      const hashedNewPassword = 'hashedNewPassword';
      const updatedUser = { ...mockUser, password: hashedNewPassword };
      const mockResponse = { success: true, data: updatedUser };

      helperService.argon2verify.mockResolvedValue(true);
      helperService.argon2hash.mockResolvedValue(hashedNewPassword);
      usersRepository.findOneAndUpdate.mockResolvedValue(updatedUser);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.updateCredentials(mockUser, mockUpdateCredentialsDto);

      expect(helperService.argon2verify).toHaveBeenCalledWith(
        mockUser.password,
        mockUpdateCredentialsDto.currentPassword,
      );
      expect(helperService.argon2hash).toHaveBeenCalledWith(mockUpdateCredentialsDto.newPassword);
      expect(usersRepository.findOneAndUpdate).toHaveBeenCalledWith(
        { email: mockUser.email },
        { password: hashedNewPassword },
      );
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: updatedUser,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw ConflictException when current password is invalid', async () => {
      const mockErrorResponse = {
        success: false,
        error: ResponseMessage.PASSWORD_MISMATCH,
      };

      helperService.argon2verify.mockResolvedValue(false);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.updateCredentials(mockUser, mockUpdateCredentialsDto);

      expect(helperService.argon2verify).toHaveBeenCalledWith(
        mockUser.password,
        mockUpdateCredentialsDto.currentPassword,
      );
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(ConflictException));
      expect(result).toEqual(mockErrorResponse);
    });

    it('should handle update error', async () => {
      const error = new Error('Update failed');
      const mockErrorResponse = { success: false, error: 'Update failed' };

      helperService.argon2verify.mockResolvedValue(true);
      helperService.argon2hash.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.updateCredentials(mockUser, mockUpdateCredentialsDto);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('Module initialization', () => {
    it('should initialize admin user on module init', async () => {
      const hashedPassword = 'hashedAdminPassword';
      const adminData = {
        email: 'admin@iot-dashboard.com',
        username: 'admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
      } as any;

      adminRepository.findOne.mockResolvedValue(null);
      helperService.argon2hash.mockResolvedValue(hashedPassword);
      adminRepository.create.mockResolvedValue(adminData);

      // Call the private method directly using any type
      const serviceAny = service as any;
      await serviceAny.initializeAdminUser();

      expect(adminRepository.findOne).toHaveBeenCalledWith({
        email: 'admin@iot-dashboard.com',
        role: UserRole.ADMIN,
      });
      expect(helperService.argon2hash).toHaveBeenCalledWith('admin123');
      expect(adminRepository.create).toHaveBeenCalledWith(adminData);
    });

    it('should not create admin if already exists', async () => {
      const existingAdmin = {
        email: 'admin@iot-dashboard.com',
        role: UserRole.ADMIN,
      } as any;

      adminRepository.findOne.mockResolvedValue(existingAdmin);

      // Trigger module initialization
      await service.onModuleInit();

      expect(adminRepository.findOne).toHaveBeenCalledWith({
        email: 'admin@iot-dashboard.com',
        role: UserRole.ADMIN,
      });
      expect(adminRepository.create).not.toHaveBeenCalled();
    });

    it('should handle initialization error gracefully', async () => {
      const error = new Error('Initialization failed');
      adminRepository.findOne.mockRejectedValue(error);

      // Trigger module initialization
      await service.onModuleInit();

      expect(adminRepository.findOne).toHaveBeenCalledWith({
        email: 'admin@iot-dashboard.com',
        role: UserRole.ADMIN,
      });
      // Should not throw error, just log it
    });
  });
});
