import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole } from '@/shared/types';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => String)
  role: UserRole;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  lastLogin?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Admin {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field(() => String)
  role: UserRole;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  lastLogin?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class LoginResponse {
  @Field()
  success: boolean;

  @Field()
  accessToken: string;
}

@ObjectType()
export class LogoutResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class UpdateCredentialsResponse {
  @Field()
  success: boolean;

  @Field(() => User, { nullable: true })
  data?: User;

  @Field()
  message: string;
}

@ObjectType()
export class UsersResponse {
  @Field()
  success: boolean;

  @Field(() => [User])
  data: User[];

  @Field()
  message: string;

  @Field()
  total: number;

  @Field()
  page: number;

  @Field()
  limit: number;

  @Field()
  totalPages: number;

  @Field({ nullable: true })
  nextPageToken?: string;

  @Field()
  hasNextPage: boolean;
}

@ObjectType()
export class UserResponse {
  @Field()
  success: boolean;

  @Field(() => User, { nullable: true })
  data?: User;

  @Field()
  message: string;
}
