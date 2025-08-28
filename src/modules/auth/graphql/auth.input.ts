import { InputType, Field, Int } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsNumber, Min, Max } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsString({ message: 'Email must be a string' })
  email: string;

  @Field()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(20, {
    message: 'Password must be no more than 20 characters long',
  })
  password: string;
}

@InputType()
export class UpdateCredentialsInput {
  @Field()
  @IsString({ message: 'Current password must be a string' })
  @MinLength(8, {
    message: 'Current password must be at least 8 characters long',
  })
  @MaxLength(20, {
    message: 'Current password must be no more than 20 characters long',
  })
  currentPassword: string;

  @Field()
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(20, {
    message: 'New password must be no more than 20 characters long',
  })
  newPassword: string;
}

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsString({ message: 'Email must be a string' })
  email: string;

  @Field()
  @IsString({ message: 'Name must be a string' })
  name: string;

  @Field()
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100, {
    message: 'Password must be no more than 100 characters long',
  })
  password: string;
}

@InputType()
export class QueryUsersInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortOrder?: string = 'desc';

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nextPageToken?: string;
}
