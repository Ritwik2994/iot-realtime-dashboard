import { UserRole } from '@/shared/types';
import { AbstractSchema } from '@/db/abstract.schema';
import { IUser } from '@/modules/users/interface/user.interface';
import { Document } from 'mongoose';

export interface IAdmin extends Document, AbstractSchema {
  email: string;
  password: string;
  role: string;
  token?: string;
  isActive?: boolean;
}

export type GetUserType = IUser | IAdmin;

export interface AccessTokenPayload {
  role: UserRole;
  email?: string;
  phoneNumber?: string;
  exp?: number;
}

export interface CreateAuthTokensParams {
  email?: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
}
