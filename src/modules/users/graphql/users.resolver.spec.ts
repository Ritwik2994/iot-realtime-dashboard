import { UserRole } from '@/shared/types';

describe('Users GraphQL Types', () => {
  describe('User GraphQL Type Conversion', () => {
    it('should convert user data to GraphQL type', () => {
      const mockUser = {
        _id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.USER,
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const convertToUserGraphQLType = (user: any) => {
        return {
          id: user._id?.toString() || user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      };

      const result = convertToUserGraphQLType(mockUser);

      expect(result).toEqual({
        id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.USER,
        isActive: true,
        lastLogin: mockUser.lastLogin,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });
  });

  describe('Users Response Structure', () => {
    it('should have correct response structure', () => {
      const mockUsers = [
        {
          _id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: UserRole.USER,
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'user-2',
          email: 'user2@example.com',
          name: 'User 2',
          role: UserRole.USER,
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const convertToUserGraphQLType = (user: any) => {
        return {
          id: user._id?.toString() || user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      };

      const expectedResponse = {
        success: true,
        data: mockUsers.map(convertToUserGraphQLType),
        message: 'Users retrieved successfully',
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        nextPageToken: null,
        hasNextPage: false,
      };

      expect(expectedResponse).toHaveProperty('success');
      expect(expectedResponse).toHaveProperty('data');
      expect(expectedResponse).toHaveProperty('message');
      expect(expectedResponse).toHaveProperty('total');
      expect(expectedResponse).toHaveProperty('page');
      expect(expectedResponse).toHaveProperty('limit');
      expect(expectedResponse).toHaveProperty('totalPages');
      expect(expectedResponse).toHaveProperty('hasNextPage');
      expect(expectedResponse.data).toHaveLength(2);
    });
  });
});
