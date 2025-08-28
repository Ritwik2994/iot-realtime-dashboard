import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IAdmin } from '../interface/auth.interface';
import { ADMIN_MONGOOSE_PROVIDER } from '../schema/admin.schema';
import { AbstractRepository } from '@/db/abstract.repository';

export class AdminRepository extends AbstractRepository<IAdmin> {
  protected readonly logger = new Logger(AdminRepository.name);

  constructor(
    @InjectModel(ADMIN_MONGOOSE_PROVIDER)
    private readonly adminModel: Model<IAdmin>,
  ) {
    super(adminModel);
  }
}
