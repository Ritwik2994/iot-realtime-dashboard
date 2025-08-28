import { Document } from 'mongoose';
import { AbstractSchema } from '@/db/abstract.schema';
import { UserRole } from '@/shared/types';

export interface IUser extends Document, AbstractSchema {
  name?: string;
  email: string;
  password: string;
  role: UserRole;
  token?: string;
  lastLogin: Date;
  isActive: boolean;
}
