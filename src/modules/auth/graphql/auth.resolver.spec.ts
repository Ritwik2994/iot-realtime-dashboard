import { UserRole } from '@/shared/types';

describe('Auth GraphQL Types', () => {
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

  describe('Admin GraphQL Type Conversion', () => {
    it('should convert admin data to GraphQL type', () => {
      const mockAdmin = {
        _id: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const convertToAdminGraphQLType = (admin: any) => {
        return {
          id: admin._id?.toString() || admin.id,
          email: admin.email,
          role: admin.role as UserRole,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        };
      };

      const result = convertToAdminGraphQLType(mockAdmin);

      expect(result).toEqual({
        id: 'admin-id',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        isActive: true,
        lastLogin: mockAdmin.lastLogin,
        createdAt: mockAdmin.createdAt,
        updatedAt: mockAdmin.updatedAt,
      });
    });
  });
});
