import { forwardRef, Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersMongooseModel } from './schemas/users.schema';
import { AuthModule } from '../auth/auth.module';
import { UsersRepository } from './repository/users.repository';
import { HelperModule } from '@/helper/helper.module';
import { UsersResolver } from './graphql/users.resolver';

@Module({
  imports: [UsersMongooseModel, forwardRef(() => AuthModule), HelperModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersResolver],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
