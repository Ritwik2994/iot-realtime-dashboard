import { MongooseModule } from '@nestjs/mongoose';
import { Schema } from 'mongoose';

import { extendBaseSchema } from '../../../db/base.schema';
import { IAdmin } from '../interface/auth.interface';

export const ADMIN_MONGOOSE_PROVIDER = 'admin_mongoose_module';
export const ADMIN_COLLECTION_NAME = 'admins';

const AdminSchema = extendBaseSchema(
  new Schema<IAdmin>(
    {
      email: { type: String, unique: true },
      password: { type: String, required: true },
      token: { type: String },
      isActive: { type: Boolean, default: false },
      isDeleted: { type: Boolean, default: false },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  ),
);

AdminSchema.index({ email: 1 });

export { AdminSchema };

export const AdminMongooseModel = MongooseModule.forFeature([
  {
    name: ADMIN_MONGOOSE_PROVIDER,
    schema: AdminSchema,
    collection: ADMIN_COLLECTION_NAME,
  },
]);
