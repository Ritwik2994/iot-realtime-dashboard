import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { SensorDataService } from './sensor-data.service';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';
import { QuerySensorDataDto } from './dto/query-sensor-data.dto';
import { GenerateSensorDataDto } from './dto/generate-sensor-data.dto';

import { UserRole } from '@/shared/types';
import { Auth } from '../auth/auth.guard';
import { RolesDecorator } from '../auth/decorators/roles.decorator';

@ApiTags('sensor-data')
@Controller('sensor-data')
@Auth()
@ApiBearerAuth()
export class SensorDataController {
  constructor(private readonly sensorDataService: SensorDataService) {}

  @Post()
  @RolesDecorator(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create sensor data' })
  @ApiResponse({ status: 201, description: 'Sensor data created successfully' })
  async createSensorData(@Body() createSensorDataDto: CreateSensorDataDto) {
    const sensorData = await this.sensorDataService.createSensorData(createSensorDataDto);
    return {
      success: true,
      data: sensorData,
      message: 'Sensor data created successfully',
    };
  }

  @Post('generate')
  @RolesDecorator(UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate random sensor data in bulk' })
  @ApiResponse({
    status: 201,
    description: 'Random sensor data generated successfully',
  })
  async generateRandomSensorData(@Body() generateDto: GenerateSensorDataDto) {
    const result = await this.sensorDataService.generateRandomSensorData(generateDto);
    return {
      success: true,
      data: result,
      message: 'Random sensor data generated successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all sensor data with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Sensor data retrieved successfully',
  })
  async getAllSensorData(@Query() queryDto: QuerySensorDataDto) {
    const result = await this.sensorDataService.findAllSensorData(queryDto);
    return {
      success: true,
      data: result,
      message: 'Sensor data retrieved successfully',
    };
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest sensor data' })
  @ApiResponse({
    status: 200,
    description: 'Latest sensor data retrieved successfully',
  })
  async getLatestSensorData(@Query('deviceId') deviceId?: string) {
    const sensorData = await this.sensorDataService.findLatestSensorData(deviceId);
    return {
      success: true,
      data: sensorData,
      message: 'Latest sensor data retrieved successfully',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get sensor data statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getSensorDataStats(@Query('deviceId') deviceId?: string, @Query('hours') hours?: number) {
    const stats = await this.sensorDataService.getSensorDataStats(deviceId, hours);
    return {
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully',
    };
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get list of all devices' })
  @ApiResponse({
    status: 200,
    description: 'Device list retrieved successfully',
  })
  async getDeviceList() {
    const devices = await this.sensorDataService.getDeviceList();
    return {
      success: true,
      data: devices,
      message: 'Device list retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sensor data by ID' })
  @ApiResponse({
    status: 200,
    description: 'Sensor data retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Sensor data not found' })
  async getSensorDataById(@Param('id') id: string) {
    const sensorData = await this.sensorDataService.findSensorDataById(id);
    return {
      success: true,
      data: sensorData,
      message: 'Sensor data retrieved successfully',
    };
  }

  @Delete(':id')
  @RolesDecorator(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete sensor data' })
  @ApiResponse({ status: 200, description: 'Sensor data deleted successfully' })
  @ApiResponse({ status: 404, description: 'Sensor data not found' })
  async deleteSensorData(@Param('id') id: string) {
    await this.sensorDataService.deleteSensorData(id);
    return {
      success: true,
      message: 'Sensor data deleted successfully',
    };
  }
}
