import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class SensorData {
  @Field(() => ID)
  id: string;

  @Field()
  deviceId: string;

  @Field(() => Float)
  temperature: number;

  @Field(() => Float)
  humidity: number;

  @Field(() => Float)
  powerUsage: number;

  @Field()
  timestamp: Date;

  @Field({ nullable: true })
  location?: string;

  @Field()
  isAlert: boolean;

  @Field({ nullable: true })
  alertMessage?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@ObjectType()
export class SensorDataStats {
  @Field(() => Float)
  avgTemperature: number;

  @Field(() => Float)
  avgHumidity: number;

  @Field(() => Float)
  avgPowerUsage: number;

  @Field(() => Int)
  totalRecords: number;

  @Field(() => Float)
  maxTemperature: number;

  @Field(() => Float)
  minTemperature: number;

  @Field(() => Float)
  maxHumidity: number;

  @Field(() => Float)
  minHumidity: number;
}

@ObjectType()
export class SensorDataResponse {
  @Field()
  success: boolean;

  @Field(() => [SensorData])
  data: SensorData[];

  @Field()
  message: string;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

@ObjectType()
export class SensorDataStatsResponse {
  @Field()
  success: boolean;

  @Field(() => SensorDataStats)
  data: SensorDataStats;

  @Field()
  message: string;
}
