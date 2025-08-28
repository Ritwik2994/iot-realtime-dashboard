import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

@InputType()
export class CreateSensorDataInput {
  @Field()
  @IsString()
  deviceId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(-50)
  @Max(100)
  temperature: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  @Max(100)
  humidity: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  powerUsage: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;
}

@InputType()
export class QuerySensorDataInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  endDate?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @Field({ nullable: true })
  @IsOptional()
  alertsOnly?: boolean = false;
}

@InputType()
export class SensorDataStatsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  hours?: number;
}
