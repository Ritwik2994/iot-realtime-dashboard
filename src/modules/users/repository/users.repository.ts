import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IUser } from '../interface/user.interface';
import { AbstractRepository } from '@/db/abstract.repository';
import { USERS_MONGOOSE_PROVIDER } from '../schemas/users.schema';

export class UsersRepository extends AbstractRepository<IUser> {
  protected readonly logger = new Logger(UsersRepository.name);

  constructor(
    @InjectModel(USERS_MONGOOSE_PROVIDER)
    private readonly usersModel: Model<IUser>,
  ) {
    super(usersModel);
  }

  // Optional: Add any user-specific methods here
  async findByEmail(email: string): Promise<IUser | null> {
    return this.usersModel.findOne({ email });
  }
}
