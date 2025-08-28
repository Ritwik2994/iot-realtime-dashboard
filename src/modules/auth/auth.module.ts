import { forwardRef, Global, Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { RestAuthGuard } from './auth.guard';
import { GraphQLAuthGuard } from './graphql-auth.guard';
import { AuthService } from './auth.service';
import { AuthUtils } from './auth.utils';
import { AdminRepository } from './repository/admin.repository';
import { AdminMongooseModel } from './schema/admin.schema';
import { UsersModule } from '../users/users.module';
import { AuthResolver } from './graphql/auth.resolver';

@Global()
@Module({
  imports: [AdminMongooseModel, forwardRef(() => UsersModule)],
  providers: [AuthService, RestAuthGuard, GraphQLAuthGuard, AuthUtils, AdminRepository, AuthResolver],
  controllers: [AuthController],
  exports: [RestAuthGuard, GraphQLAuthGuard, AuthUtils, AdminRepository],
})
export class AuthModule {}
