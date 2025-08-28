import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Auth } from './auth.guard';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/getUser.decorator';
import { LoginDto } from './dto/login.dto';
import { UpdateCredentialsDto } from './dto/updateCredentials.dto';
import { GetUserType } from './interface/auth.interface';
import { IUser } from '../users/interface/user.interface';
import { GlobalResponse } from '@/helper/response-handler/response-handler.interface';
import { ResponseHandler } from '@/helper/response-handler/response-handler.service';

@Controller('auth')
@ApiTags('Auth Module')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  async adminLogin(@Body() loginDto: LoginDto): Promise<GlobalResponse> {
    return await this.authService.adminLogin(loginDto);
  }

  @Auth()
  @ApiBearerAuth()
  @Patch('admin/change-password')
  async updateAdminCredentials(
    @GetUser() user: GetUserType,
    @Body() updateCredentials: UpdateCredentialsDto,
  ): Promise<GlobalResponse> {
    return await this.authService.updateAdminCredentials(user, updateCredentials);
  }

  @Auth()
  @ApiBearerAuth()
  @Post('admin/logout')
  async adminLogout(@GetUser() user: GetUserType): Promise<GlobalResponse> {
    return await this.authService.adminLogout(user);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<GlobalResponse> {
    return await this.authService.login(loginDto);
  }

  @Auth()
  @ApiBearerAuth()
  @Patch('change-password')
  async updateCredentials(
    @GetUser() user: GetUserType,
    @Body() updateCredentials: UpdateCredentialsDto,
  ): Promise<GlobalResponse> {
    return await this.authService.updateCredentials(user, updateCredentials);
  }

  @Auth()
  @ApiBearerAuth()
  @Post('logout')
  async logout(@GetUser() user: GetUserType): Promise<GlobalResponse> {
    return await this.authService.logout(user);
  }

  @Auth()
  @ApiBearerAuth()
  @Get('profile')
  async profile(@GetUser() user: IUser | any): Promise<GlobalResponse> {
    return ResponseHandler.success({
      data: user,
    });
  }
}
