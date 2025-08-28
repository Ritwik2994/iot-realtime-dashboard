import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { Auth } from '../auth/auth.guard';
import { RolesDecorator } from '../auth/decorators/roles.decorator';
import { UserRole } from '@/shared/types';
import { GlobalResponse } from '@/helper/response-handler/response-handler.interface';

@ApiTags('users')
@Controller('users')
@Auth()
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user account.',
  })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<GlobalResponse> {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @RolesDecorator(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users with pagination',
    description:
      'Retrieve a paginated list of users with filtering and sorting options. Only admins can access this endpoint.',
  })
  async findAllUsers(@Query() queryDto: QueryUsersDto): Promise<GlobalResponse> {
    return this.usersService.findAllUsers(queryDto);
  }

  @Get(':id')
  @RolesDecorator(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID. Only admins can access this endpoint.',
  })
  async findUserById(@Param('id') id: string): Promise<GlobalResponse> {
    return this.usersService.findUserById(id);
  }
}
