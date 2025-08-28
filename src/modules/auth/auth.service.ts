import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthUtils } from './auth.utils';
import { LoginDto } from './dto/login.dto';
import { UpdateCredentialsDto } from './dto/updateCredentials.dto';
import { AdminRepository } from './repository/admin.repository';
import { GlobalResponse } from '@/helper/response-handler/response-handler.interface';
import { ResponseHandler } from '@/helper/response-handler/response-handler.service';
import { HelperService } from '@/helper/helper.service';
import { ResponseMessage } from '@/shared/constant/responseMessage';
import { UserRole } from '@/shared/types';
import { UsersRepository } from '../users/repository/users.repository';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly adminRepository: AdminRepository,
    private readonly helperService: HelperService,
    private readonly authUtils: AuthUtils,
  ) {}

  onModuleInit() {
    this.initializeAdminUser();
  }

  private async initializeAdminUser(): Promise<void> {
    try {
      const adminEmail = 'admin@iot-dashboard.com';
      const hashedPassword = await this.helperService.argon2hash('admin123');

      const adminData = {
        email: adminEmail,
        username: 'admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
      };

      const existingAdmin = await this.adminRepository.findOne({
        email: adminEmail,
        role: UserRole.ADMIN,
      });

      if (!existingAdmin) {
        await this.adminRepository.create(adminData);
      }
    } catch (error) {
      Logger.error('Admin initialization failed:', error.message);
    }
  }

  private async authenticateUser(
    repository: UsersRepository | AdminRepository,
    loginDto: LoginDto,
    role: UserRole,
  ): Promise<GlobalResponse> {
    try {
      const { email, password } = loginDto;
      const user = await repository.findOne({ email, role });

      if (!user) throw new NotFoundException(ResponseMessage.NOT_FOUND);

      const isPasswordValid = await this.helperService.argon2verify(user.password, password);
      if (!isPasswordValid) {
        throw new UnauthorizedException(ResponseMessage.UNAUTHORIZED);
      }

      const jwt = await this.authUtils.createAccessTokens({
        email: user.email,
        role: user.role as UserRole,
      });
      await repository.findOneAndUpdate({ email }, { token: jwt });
      await repository.findOneAndUpdate({ email }, { lastLogin: new Date() });

      return ResponseHandler.success({
        data: { accessToken: jwt },
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async adminLogin(loginDto: LoginDto): Promise<GlobalResponse> {
    return this.authenticateUser(this.adminRepository, loginDto, UserRole.ADMIN);
  }

  async login(loginDto: LoginDto): Promise<GlobalResponse> {
    return this.authenticateUser(this.usersRepository, loginDto, UserRole.USER);
  }

  private async logoutUser(repository: UsersRepository | AdminRepository, userData: any): Promise<GlobalResponse> {
    try {
      const { email } = userData;
      await repository.findOneAndUpdate({ email }, { token: '' });

      return ResponseHandler.success({
        data: { message: ResponseMessage.SUCCESS_MESSAGE_RESPONSE },
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async adminLogout(userData: any): Promise<GlobalResponse> {
    return this.logoutUser(this.adminRepository, userData);
  }

  async logout(userData: any): Promise<GlobalResponse> {
    return this.logoutUser(this.usersRepository, userData);
  }

  private async updateUserCredentials(
    repository: UsersRepository | AdminRepository,
    user: any,
    updateCredentialsDto: UpdateCredentialsDto,
  ): Promise<GlobalResponse> {
    try {
      const { currentPassword, newPassword } = updateCredentialsDto;
      const { email, password } = user;

      const isPasswordValid = await this.helperService.argon2verify(password, currentPassword);
      if (!isPasswordValid) {
        throw new ConflictException(ResponseMessage.PASSWORD_MISMATCH);
      }

      const hashedPassword = await this.helperService.argon2hash(newPassword);
      const updatedUser = await repository.findOneAndUpdate({ email }, { password: hashedPassword });

      return ResponseHandler.success({
        data: updatedUser,
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async updateAdminCredentials(user: any, updateCredentialsDto: UpdateCredentialsDto): Promise<GlobalResponse> {
    return this.updateUserCredentials(this.adminRepository, user, updateCredentialsDto);
  }

  async updateCredentials(user: any, updateCredentialsDto: UpdateCredentialsDto): Promise<GlobalResponse> {
    return this.updateUserCredentials(this.usersRepository, user, updateCredentialsDto);
  }
}
