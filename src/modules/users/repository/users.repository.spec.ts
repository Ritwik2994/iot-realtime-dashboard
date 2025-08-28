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
import { getModelToken } from '@nestjs/mongoose';
import { UsersRepository } from './users.repository';
import { IUser } from '../interface/user.interface';
import { UserRole } from '@/shared/types';

// Mock the mongoose model
const mockUsersModel = jest.fn().mockImplementation(() => ({
  save: jest.fn(),
})) as any;

mockUsersModel.findOne = jest.fn();
mockUsersModel.find = jest.fn();
mockUsersModel.create = jest.fn();
mockUsersModel.findById = jest.fn();
mockUsersModel.findByIdAndUpdate = jest.fn();
mockUsersModel.findByIdAndDelete = jest.fn();
mockUsersModel.countDocuments = jest.fn();
mockUsersModel.distinct = jest.fn();
mockUsersModel.aggregate = jest.fn();

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let model: jest.Mocked<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getModelToken('users_mongoose_module'),
          useValue: mockUsersModel,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    model = module.get(getModelToken('users_mongoose_module'));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    const mockEmail = 'test@example.com';
    const mockUser: Partial<IUser> = {
      _id: 'user_id_1',
      email: mockEmail,
      name: 'Test User',
      role: UserRole.USER,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should find user by email successfully', async () => {
      model.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByEmail(mockEmail);

      expect(model.findOne).toHaveBeenCalledWith({ email: mockEmail });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      model.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail(mockEmail);

      expect(model.findOne).toHaveBeenCalledWith({ email: mockEmail });
      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      const error = new Error('Database connection failed');
      model.findOne.mockRejectedValue(error);

      await expect(repository.findByEmail(mockEmail)).rejects.toThrow('Database connection failed');

      expect(model.findOne).toHaveBeenCalledWith({ email: mockEmail });
    });

    it('should handle empty email', async () => {
      const emptyEmail = '';
      model.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail(emptyEmail);

      expect(model.findOne).toHaveBeenCalledWith({ email: emptyEmail });
      expect(result).toBeNull();
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'test+tag@example.com';
      model.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByEmail(specialEmail);

      expect(model.findOne).toHaveBeenCalledWith({ email: specialEmail });
      expect(result).toEqual(mockUser);
    });
  });

  describe('Inherited methods', () => {
    it('should have access to inherited findOne method', async () => {
      const mockFilter = { email: 'test@example.com' };
      const mockUser = { _id: 'user_id_1', email: 'test@example.com' };

      model.findOne.mockResolvedValue(mockUser);

      const result = await repository.findOne(mockFilter);

      expect(model.findOne).toHaveBeenCalledWith(mockFilter, {}, { lean: true });
      expect(result).toEqual(mockUser);
    });

    it('should have access to inherited find method', async () => {
      const mockFilter = { isActive: true };
      const mockUsers = [
        { _id: 'user_1', email: 'user1@example.com' },
        { _id: 'user_2', email: 'user2@example.com' },
      ];

      model.find.mockResolvedValue(mockUsers);

      const result = await repository.find(mockFilter);

      expect(model.find).toHaveBeenCalledWith(mockFilter, {}, { lean: true });
      expect(result).toEqual(mockUsers);
    });

    it('should have access to inherited create method', async () => {
      const mockUserData = {
        email: 'new@example.com',
        name: 'New User',
        password: 'hashedPassword',
        role: UserRole.USER,
      };
      const mockCreatedUser = { _id: 'new_user_id', ...mockUserData };

      // Mock the constructor behavior
      const mockSave = jest.fn().mockResolvedValue({
        ...mockCreatedUser,
        toJSON: jest.fn().mockReturnValue(mockCreatedUser),
      });
      const mockInstance = { save: mockSave };
      (model as any).mockReturnValue(mockInstance);

      const result = await repository.create(mockUserData);

      expect(model).toHaveBeenCalledWith(expect.objectContaining(mockUserData));
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedUser);
    });

    it('should have access to inherited findById method', async () => {
      const mockId = 'user_id_1';
      const mockUser = { _id: mockId, email: 'test@example.com' };

      model.findById.mockResolvedValue(mockUser);

      const result = await repository.findById(mockId);

      expect(model.findById).toHaveBeenCalledWith(mockId, {}, { lean: true });
      expect(result).toEqual(mockUser);
    });
  });
});
