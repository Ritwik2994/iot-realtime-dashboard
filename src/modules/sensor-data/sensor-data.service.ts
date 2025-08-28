import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateSensorDataDto } from './dto/create-sensor-data.dto';
import { QuerySensorDataDto } from './dto/query-sensor-data.dto';
import { GenerateSensorDataDto } from './dto/generate-sensor-data.dto';
import { PaginatedResponse } from '@/shared/types';
import { SensorDataRepository } from './repository/sensor-data.repository';
import { ResponseHandler } from '@/helper/response-handler/response-handler.service';
import { GlobalResponse } from '@/helper/response-handler/response-handler.interface';
import { ISensorData } from './interface/sensor-data.interface';

@Injectable()
export class SensorDataService {
  constructor(private readonly sensorDataRepository: SensorDataRepository) {}

  async createSensorData(createSensorDataDto: CreateSensorDataDto): Promise<GlobalResponse> {
    try {
      const sensorData = await this.sensorDataRepository.create({
        ...createSensorDataDto,
        timestamp: new Date(),
        isAlert: this.detectAlerts(createSensorDataDto),
        alertMessage: this.generateAlertMessage(createSensorDataDto),
      });

      return ResponseHandler.success({
        data: sensorData,
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async generateRandomSensorData(generateDto: GenerateSensorDataDto): Promise<GlobalResponse> {
    try {
      const { count, deviceIdPrefix = 'device_', location } = generateDto;
      const sensorDataArray: Partial<ISensorData>[] = [];

      for (let i = 0; i < count; i++) {
        const deviceId = `${deviceIdPrefix}${Math.floor(Math.random() * 1000) + 1}`;
        const temperature = this.generateRandomTemperature();
        const humidity = this.generateRandomHumidity();
        const powerUsage = this.generateRandomPowerUsage();
        const timestamp = this.generateRandomTimestamp();

        const sensorData = {
          deviceId,
          temperature,
          humidity,
          powerUsage,
          timestamp,
          location,
          isAlert: this.detectAlerts({
            deviceId,
            temperature,
            humidity,
            powerUsage,
            location,
          }),
          alertMessage: this.generateAlertMessage({
            deviceId,
            temperature,
            humidity,
            powerUsage,
            location,
          }),
        };

        sensorDataArray.push(sensorData);
      }

      const createdData = await this.sensorDataRepository.createMany(sensorDataArray);

      return ResponseHandler.success({
        data: {
          generated: createdData.length,
          message: `Successfully generated ${createdData.length} sensor data records`,
        },
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async findAllSensorData(queryDto: QuerySensorDataDto): Promise<GlobalResponse> {
    try {
      const { deviceId, startDate, endDate, limit = 50, page = 1, alertsOnly } = queryDto;

      const filter: any = {};

      if (deviceId) filter.deviceId = deviceId;
      if (alertsOnly) filter.isAlert = true;

      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.sensorDataRepository.find(filter),
        this.sensorDataRepository.countDocuments(filter),
      ]);

      // Sort and paginate the data manually since repository.find returns all matching documents
      const sortedData = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const paginatedData = sortedData.slice(skip, skip + limit);
      return ResponseHandler.success({
        data: paginatedData,
        metadata: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async findSensorDataById(id: string): Promise<GlobalResponse> {
    try {
      const sensorData = await this.sensorDataRepository.findById(id);
      if (!sensorData) {
        throw new NotFoundException('Sensor data not found');
      }

      return ResponseHandler.success({
        data: sensorData,
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async findLatestSensorData(deviceId?: string): Promise<GlobalResponse> {
    try {
      const filter = deviceId ? { deviceId } : {};

      const sensorData = await this.sensorDataRepository.find(filter);

      // Sort by timestamp and limit to 10
      const sortedData = sensorData
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      return ResponseHandler.success({
        data: sortedData,
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async getSensorDataStats(deviceId?: string, hours: number = 24): Promise<GlobalResponse> {
    try {
      const filter: any = {
        timestamp: { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) },
      };

      if (deviceId) filter.deviceId = deviceId;

      const stats = await this.sensorDataRepository.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            avgTemperature: { $avg: '$temperature' },
            avgHumidity: { $avg: '$humidity' },
            avgPowerUsage: { $avg: '$powerUsage' },
            maxTemperature: { $max: '$temperature' },
            minTemperature: { $min: '$temperature' },
            maxHumidity: { $max: '$humidity' },
            minHumidity: { $min: '$humidity' },
            totalAlerts: { $sum: { $cond: ['$isAlert', 1, 0] } },
            count: { $sum: 1 },
          },
        },
      ]);

      const result = stats?.[0] || {
        avgTemperature: 0,
        avgHumidity: 0,
        avgPowerUsage: 0,
        maxTemperature: 0,
        minTemperature: 0,
        maxHumidity: 0,
        minHumidity: 0,
        totalAlerts: 0,
        count: 0,
      };

      return ResponseHandler.success({
        data: result,
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async getDeviceList(): Promise<GlobalResponse> {
    try {
      const devices = await this.sensorDataRepository.distinct('deviceId');

      return ResponseHandler.success({
        data: devices,
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  async deleteSensorData(id: string): Promise<GlobalResponse> {
    try {
      const result = await this.sensorDataRepository.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException('Sensor data not found');
      }

      return ResponseHandler.success({
        message: 'Sensor data deleted successfully',
      });
    } catch (error) {
      return ResponseHandler.transformError(error);
    }
  }

  private generateRandomTemperature(): number {
    // Generate temperature between -10 and 95 degrees Celsius
    return Math.round((Math.random() * 105 - 10) * 10) / 10;
  }

  private generateRandomHumidity(): number {
    // Generate humidity between 15 and 95 percent
    return Math.round((Math.random() * 80 + 15) * 10) / 10;
  }

  private generateRandomPowerUsage(): number {
    // Generate power usage between 50 and 1200 watts
    return Math.round((Math.random() * 1150 + 50) * 10) / 10;
  }

  private generateRandomTimestamp(): Date {
    // Generate timestamp within the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
    return new Date(randomTime);
  }

  private detectAlerts(sensorData: CreateSensorDataDto): boolean {
    return (
      sensorData.temperature > 80 ||
      sensorData.temperature < 10 ||
      sensorData.humidity > 90 ||
      sensorData.humidity < 20 ||
      sensorData.powerUsage > 1000
    );
  }

  private generateAlertMessage(sensorData: CreateSensorDataDto): string | undefined {
    const alerts: string[] = [];

    if (sensorData.temperature > 80) alerts.push('High temperature');
    if (sensorData.temperature < 10) alerts.push('Low temperature');
    if (sensorData.humidity > 90) alerts.push('High humidity');
    if (sensorData.humidity < 20) alerts.push('Low humidity');
    if (sensorData.powerUsage > 1000) alerts.push('High power usage');

    return alerts.length > 0 ? alerts.join(', ') : undefined;
  }
}
