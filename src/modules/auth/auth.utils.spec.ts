import { Test, TestingModule } from '@nestjs/testing';
import { AuthUtils } from './auth.utils';
import { signJWT, encryptJWE, verifyJWT, decryptJWE } from './jwt';
import { UserRole } from '@/shared/types';
import { ACCESS_TOKEN_EXPIRATION_TIME, JWT_ISSUER } from '@/shared/constant/constant';
import { AccessTokenPayload, CreateAuthTokensParams } from './interface/auth.interface';

// Mock the JWT functions
jest.mock('./jwt', () => ({
  signJWT: jest.fn(),
  encryptJWE: jest.fn(),
  verifyJWT: jest.fn(),
  decryptJWE: jest.fn(),
}));

describe('AuthUtils', () => {
  let authUtils: AuthUtils;
  let mockSignJWT: jest.MockedFunction<typeof signJWT>;
  let mockEncryptJWE: jest.MockedFunction<typeof encryptJWE>;
  let mockVerifyJWT: jest.MockedFunction<typeof verifyJWT>;
  let mockDecryptJWE: jest.MockedFunction<typeof decryptJWE>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthUtils],
    }).compile();

    authUtils = module.get<AuthUtils>(AuthUtils);

    // Get mocked functions
    mockSignJWT = signJWT as jest.MockedFunction<typeof signJWT>;
    mockEncryptJWE = encryptJWE as jest.MockedFunction<typeof encryptJWE>;
    mockVerifyJWT = verifyJWT as jest.MockedFunction<typeof verifyJWT>;
    mockDecryptJWE = decryptJWE as jest.MockedFunction<typeof decryptJWE>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    const mockPayload: AccessTokenPayload = {
      role: UserRole.USER,
      email: 'test@example.com',
      phoneNumber: '+1234567890',
    };

    it('should generate token with default expiration time', async () => {
      const expectedToken = 'mock.jwt.token';
      mockSignJWT.mockResolvedValue(expectedToken);

      const result = await authUtils.generateToken(mockPayload, signJWT);

      expect(mockSignJWT).toHaveBeenCalledWith(JWT_ISSUER, mockPayload, ACCESS_TOKEN_EXPIRATION_TIME);
      expect(result).toBe(expectedToken);
    });

    it('should generate token with custom expiration time', async () => {
      const customExpirationTime = 7200;
      const expectedToken = 'mock.jwt.token';
      mockSignJWT.mockResolvedValue(expectedToken);

      const result = await authUtils.generateToken(mockPayload, signJWT, customExpirationTime);

      expect(mockSignJWT).toHaveBeenCalledWith(JWT_ISSUER, mockPayload, customExpirationTime);
      expect(result).toBe(expectedToken);
    });

    it('should generate token with encryptJWE function', async () => {
      const expectedToken = 'mock.encrypted.token';
      mockEncryptJWE.mockResolvedValue(expectedToken);

      const result = await authUtils.generateToken(mockPayload, encryptJWE);

      expect(mockEncryptJWE).toHaveBeenCalledWith(JWT_ISSUER, mockPayload, ACCESS_TOKEN_EXPIRATION_TIME);
      expect(result).toBe(expectedToken);
    });

    it('should handle token generation error', async () => {
      const error = new Error('Token generation failed');
      mockSignJWT.mockRejectedValue(error);

      await expect(authUtils.generateToken(mockPayload, signJWT)).rejects.toThrow('Token generation failed');
    });

    it('should handle empty payload', async () => {
      const emptyPayload = {} as AccessTokenPayload;
      const expectedToken = 'mock.jwt.token';
      mockSignJWT.mockResolvedValue(expectedToken);

      const result = await authUtils.generateToken(emptyPayload, signJWT);

      expect(mockSignJWT).toHaveBeenCalledWith(JWT_ISSUER, emptyPayload, ACCESS_TOKEN_EXPIRATION_TIME);
      expect(result).toBe(expectedToken);
    });
  });

  describe('decodeToken', () => {
    const mockToken = 'mock.jwt.token';

    it('should successfully decode token with verifyJWT', async () => {
      const mockPayload = {
        role: UserRole.ADMIN,
        email: 'admin@example.com',
        exp: 1234567890,
      };
      mockVerifyJWT.mockResolvedValue(mockPayload);

      const result = await authUtils.decodeToken(mockToken, verifyJWT);

      expect(mockVerifyJWT).toHaveBeenCalledWith(mockToken, JWT_ISSUER);
      expect(result).toEqual({
        success: true,
        role: mockPayload.role,
        email: mockPayload.email,
        exp: mockPayload.exp,
      });
    });

    it('should successfully decode token with decryptJWE', async () => {
      const mockPayload = {
        role: UserRole.USER,
        email: 'user@example.com',
        phoneNumber: '+1234567890',
        exp: 1234567890,
      };
      mockDecryptJWE.mockResolvedValue(mockPayload);

      const result = await authUtils.decodeToken(mockToken, decryptJWE);

      expect(mockDecryptJWE).toHaveBeenCalledWith(mockToken, JWT_ISSUER);
      expect(result).toEqual({
        success: true,
        role: mockPayload.role,
        email: mockPayload.email,
        exp: mockPayload.exp,
      });
    });

    it('should handle decode error and return failure response', async () => {
      const error = new Error('Invalid token');
      mockVerifyJWT.mockRejectedValue(error);

      const result = await authUtils.decodeToken(mockToken, verifyJWT);

      expect(mockVerifyJWT).toHaveBeenCalledWith(mockToken, JWT_ISSUER);
      expect(result).toEqual({
        success: false,
        error,
      });
    });

    it('should handle JWT expired error', async () => {
      const error = new Error('JWT Expired');
      mockDecryptJWE.mockRejectedValue(error);

      const result = await authUtils.decodeToken(mockToken, decryptJWE);

      expect(mockDecryptJWE).toHaveBeenCalledWith(mockToken, JWT_ISSUER);
      expect(result).toEqual({
        success: false,
        error,
      });
    });

    it('should handle payload without optional fields', async () => {
      const mockPayload = {
        role: UserRole.USER,
        exp: 1234567890,
      };
      mockVerifyJWT.mockResolvedValue(mockPayload);

      const result = await authUtils.decodeToken(mockToken, verifyJWT);

      expect(result).toEqual({
        success: true,
        role: mockPayload.role,
        email: undefined,
        exp: mockPayload.exp,
      });
    });

    it('should handle empty token', async () => {
      const error = new Error('Empty token');
      mockVerifyJWT.mockRejectedValue(error);

      const result = await authUtils.decodeToken('', verifyJWT);

      expect(mockVerifyJWT).toHaveBeenCalledWith('', JWT_ISSUER);
      expect(result).toEqual({
        success: false,
        error,
      });
    });
  });

  describe('createAccessTokens', () => {
    const mockParams: CreateAuthTokensParams = {
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      role: UserRole.USER,
    };

    it('should create access token with all parameters', async () => {
      const expectedToken = 'mock.access.token';
      mockEncryptJWE.mockResolvedValue(expectedToken);

      const result = await authUtils.createAccessTokens(mockParams);

      expect(mockEncryptJWE).toHaveBeenCalledWith(
        JWT_ISSUER,
        {
          role: mockParams.role,
          email: mockParams.email,
          phoneNumber: mockParams.phoneNumber,
        },
        ACCESS_TOKEN_EXPIRATION_TIME,
      );
      expect(result).toBe(expectedToken);
    });

    it('should create access token with only required parameters', async () => {
      const minimalParams: CreateAuthTokensParams = {
        role: UserRole.ADMIN,
      };
      const expectedToken = 'mock.access.token';
      mockEncryptJWE.mockResolvedValue(expectedToken);

      const result = await authUtils.createAccessTokens(minimalParams);

      expect(mockEncryptJWE).toHaveBeenCalledWith(
        JWT_ISSUER,
        {
          role: minimalParams.role,
          email: undefined,
          phoneNumber: undefined,
        },
        ACCESS_TOKEN_EXPIRATION_TIME,
      );
      expect(result).toBe(expectedToken);
    });

    it('should create access token with email only', async () => {
      const emailOnlyParams: CreateAuthTokensParams = {
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };
      const expectedToken = 'mock.access.token';
      mockEncryptJWE.mockResolvedValue(expectedToken);

      const result = await authUtils.createAccessTokens(emailOnlyParams);

      expect(mockEncryptJWE).toHaveBeenCalledWith(
        JWT_ISSUER,
        {
          role: emailOnlyParams.role,
          email: emailOnlyParams.email,
          phoneNumber: undefined,
        },
        ACCESS_TOKEN_EXPIRATION_TIME,
      );
      expect(result).toBe(expectedToken);
    });

    it('should create access token with phone number only', async () => {
      const phoneOnlyParams: CreateAuthTokensParams = {
        phoneNumber: '+9876543210',
        role: UserRole.USER,
      };
      const expectedToken = 'mock.access.token';
      mockEncryptJWE.mockResolvedValue(expectedToken);

      const result = await authUtils.createAccessTokens(phoneOnlyParams);

      expect(mockEncryptJWE).toHaveBeenCalledWith(
        JWT_ISSUER,
        {
          role: phoneOnlyParams.role,
          email: undefined,
          phoneNumber: phoneOnlyParams.phoneNumber,
        },
        ACCESS_TOKEN_EXPIRATION_TIME,
      );
      expect(result).toBe(expectedToken);
    });

    it('should handle token creation error', async () => {
      const error = new Error('Token creation failed');
      mockEncryptJWE.mockRejectedValue(error);

      await expect(authUtils.createAccessTokens(mockParams)).rejects.toThrow('Token creation failed');
    });
  });

  describe('decodeAccessToken', () => {
    const mockAccessToken = 'mock.access.token';

    it('should successfully decode access token', async () => {
      const mockPayload = {
        role: UserRole.USER,
        email: 'user@example.com',
        phoneNumber: '+1234567890',
        exp: 1234567890,
      };
      mockDecryptJWE.mockResolvedValue(mockPayload);

      const result = await authUtils.decodeAccessToken(mockAccessToken);

      expect(mockDecryptJWE).toHaveBeenCalledWith(mockAccessToken, JWT_ISSUER);
      expect(result).toEqual({
        success: true,
        role: mockPayload.role,
        email: mockPayload.email,
        exp: mockPayload.exp,
      });
    });

    it('should handle access token decode error', async () => {
      const error = new Error('Invalid access token');
      mockDecryptJWE.mockRejectedValue(error);

      const result = await authUtils.decodeAccessToken(mockAccessToken);

      expect(mockDecryptJWE).toHaveBeenCalledWith(mockAccessToken, JWT_ISSUER);
      expect(result).toEqual({
        success: false,
        error,
      });
    });

    it('should handle expired access token', async () => {
      const error = new Error('JWT Expired');
      mockDecryptJWE.mockRejectedValue(error);

      const result = await authUtils.decodeAccessToken(mockAccessToken);

      expect(mockDecryptJWE).toHaveBeenCalledWith(mockAccessToken, JWT_ISSUER);
      expect(result).toEqual({
        success: false,
        error,
      });
    });

    it('should handle empty access token', async () => {
      const error = new Error('Empty token');
      mockDecryptJWE.mockRejectedValue(error);

      const result = await authUtils.decodeAccessToken('');

      expect(mockDecryptJWE).toHaveBeenCalledWith('', JWT_ISSUER);
      expect(result).toEqual({
        success: false,
        error,
      });
    });

    it('should handle access token with minimal payload', async () => {
      const mockPayload = {
        role: UserRole.ADMIN,
        exp: 1234567890,
      };
      mockDecryptJWE.mockResolvedValue(mockPayload);

      const result = await authUtils.decodeAccessToken(mockAccessToken);

      expect(result).toEqual({
        success: true,
        role: mockPayload.role,
        email: undefined,
        exp: mockPayload.exp,
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null payload in generateToken', async () => {
      const expectedToken = 'mock.jwt.token';
      mockSignJWT.mockResolvedValue(expectedToken);

      const result = await authUtils.generateToken(null as any, signJWT);

      expect(mockSignJWT).toHaveBeenCalledWith(JWT_ISSUER, null, ACCESS_TOKEN_EXPIRATION_TIME);
      expect(result).toBe(expectedToken);
    });

    it('should handle undefined token in decodeToken', async () => {
      const error = new Error('Undefined token');
      mockVerifyJWT.mockRejectedValue(error);

      const result = await authUtils.decodeToken(undefined as any, verifyJWT);

      expect(mockVerifyJWT).toHaveBeenCalledWith(undefined, JWT_ISSUER);
      expect(result).toEqual({
        success: false,
        error,
      });
    });

    it('should handle null token in decodeAccessToken', async () => {
      const error = new Error('Null token');
      mockDecryptJWE.mockRejectedValue(error);

      const result = await authUtils.decodeAccessToken(null as any);

      expect(mockDecryptJWE).toHaveBeenCalledWith(null, JWT_ISSUER);
      expect(result).toEqual({
        success: false,
        error,
      });
    });

    it('should handle payload with all fields undefined in createAccessTokens', async () => {
      const emptyParams = {} as CreateAuthTokensParams;
      const expectedToken = 'mock.access.token';
      mockEncryptJWE.mockResolvedValue(expectedToken);

      const result = await authUtils.createAccessTokens(emptyParams);

      expect(mockEncryptJWE).toHaveBeenCalledWith(
        JWT_ISSUER,
        {
          role: undefined,
          email: undefined,
          phoneNumber: undefined,
        },
        ACCESS_TOKEN_EXPIRATION_TIME,
      );
      expect(result).toBe(expectedToken);
    });
  });
});
