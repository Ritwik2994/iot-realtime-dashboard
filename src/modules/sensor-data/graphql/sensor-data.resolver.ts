import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { SensorDataService } from '../sensor-data.service';
import { SensorData, SensorDataResponse, SensorDataStatsResponse } from './sensor-data.model';
import { CreateSensorDataInput, QuerySensorDataInput, SensorDataStatsInput } from './sensor-data.input';

import { UserRole } from '@/shared/types';
import { RolesDecorator } from '@/modules/auth/decorators/roles.decorator';
import { Auth } from '@/modules/auth/graphql-auth.guard';

@Resolver(() => SensorData)
@Auth()
export class SensorDataResolver {
  constructor(private readonly sensorDataService: SensorDataService) {}

  private convertToGraphQLType(sensorData: any): SensorData {
    return {
      id: sensorData._id?.toString() || sensorData.id,
      deviceId: sensorData.deviceId,
      temperature: sensorData.temperature,
      humidity: sensorData.humidity,
      powerUsage: sensorData.powerUsage,
      timestamp: sensorData.timestamp,
      location: sensorData.location,
      isAlert: sensorData.isAlert,
      alertMessage: sensorData.alertMessage,
      createdAt: sensorData.createdAt,
      updatedAt: sensorData.updatedAt,
    };
  }

  @Query(() => SensorDataResponse, {
    description: 'Get all sensor data with pagination and filters',
  })
  async getAllSensorData(@Args('input') input: QuerySensorDataInput): Promise<SensorDataResponse> {
    const result = await this.sensorDataService.findAllSensorData(input as any);
    return {
      success: true,
      data: result.data.map(item => this.convertToGraphQLType(item)),
      message: 'Sensor data retrieved successfully',
      total: result.metadata.total,
      page: result.metadata.page,
      limit: result.metadata.limit,
    };
  }

  @Query(() => SensorData, { description: 'Get sensor data by ID' })
  async getSensorDataById(@Args('id', { type: () => ID }) id: string): Promise<SensorData> {
    const result = await this.sensorDataService.findSensorDataById(id);
    return this.convertToGraphQLType(result.data);
  }

  @Query(() => [SensorData], {
    description: 'Get latest sensor data for a device',
  })
  async getLatestSensorData(@Args('deviceId', { nullable: true }) deviceId?: string): Promise<SensorData[]> {
    const result = await this.sensorDataService.findLatestSensorData(deviceId);
    return result.data.map(item => this.convertToGraphQLType(item));
  }

  @Query(() => SensorDataStatsResponse, {
    description: 'Get sensor data statistics',
  })
  async getSensorDataStats(@Args('input') input: SensorDataStatsInput): Promise<SensorDataStatsResponse> {
    const result = await this.sensorDataService.getSensorDataStats(input.deviceId, input.hours);
    return {
      success: true,
      data: result.data,
      message: 'Statistics retrieved successfully',
    };
  }

  @Query(() => [String], { description: 'Get list of all devices' })
  async getDeviceList(): Promise<string[]> {
    const result = await this.sensorDataService.getDeviceList();
    return result.data;
  }

  @Mutation(() => SensorData, { description: 'Create new sensor data' })
  @RolesDecorator(UserRole.ADMIN)
  async createSensorData(@Args('input') input: CreateSensorDataInput): Promise<SensorData> {
    const result = await this.sensorDataService.createSensorData(input as any);
    return this.convertToGraphQLType(result.data);
  }

  @Mutation(() => Boolean, { description: 'Delete sensor data by ID' })
  @RolesDecorator(UserRole.ADMIN)
  async deleteSensorData(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.sensorDataService.deleteSensorData(id);
    return true;
  }
}
