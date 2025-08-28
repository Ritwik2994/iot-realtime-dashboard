import { MongooseModule } from '@nestjs/mongoose';
import { Schema } from 'mongoose';

import { extendBaseSchema } from '../../../db/base.schema';
import { IUser } from '../interface/user.interface';
import { UserRole } from '@/shared/types';

export const USERS_MONGOOSE_PROVIDER = 'users_mongoose_module';
export const USERS_COLLECTION_NAME = 'users';

const UsersSchema = extendBaseSchema(
  new Schema<IUser>(
    {
      email: { type: String, required: true, unique: true },
      name: { type: String, required: false },
      password: { type: String, required: true },
      role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.USER,
        required: true,
      },
      token: { type: String, required: false },
      lastLogin: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  ),
);

UsersSchema.index({ email: 1 });
UsersSchema.index({ role: 1 });
UsersSchema.index({ isActive: 1 });
UsersSchema.index({ createdAt: -1 });

export { UsersSchema };

export const UsersMongooseModel = MongooseModule.forFeature([
  {
    name: USERS_MONGOOSE_PROVIDER,
    schema: UsersSchema,
    collection: USERS_COLLECTION_NAME,
  },
]);
