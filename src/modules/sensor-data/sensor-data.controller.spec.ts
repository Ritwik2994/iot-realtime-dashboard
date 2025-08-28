// Mock environment variables
process.env.SERVER_SECRET = 'test-secret-key-for-jwt-encryption';
process.env.NODE_ENV = 'development';
process.env.PORT = '3000';
process.env.DB_MONGO_URI = 'mongodb://localhost:27017/test';
process.env.ALLOWED_DOMAINS = 'http://localhost:3000';
process.env.THROTTLE_TTL = '60';
process.env.THROTTLE_LIMIT = '100';
process.env.ACCESS_TOKEN_EXPIRATION_TIME = '3600';
process.env.ENCRYPTION_KEY_32_BYTE = '12345678901234567890123456789012';
process.env.IV_KEY = '1234567890123456';

import { Test, TestingModule } from '@nestjs/testing';
import { SensorDataController } from './sensor-data.controller';
import { SensorDataService } from './sensor-data.service';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';
import { QuerySensorDataDto } from './dto/query-sensor-data.dto';
import { GenerateSensorDataDto } from './dto/generate-sensor-data.dto';
import { GlobalResponse } from '@/helper/response-handler/response-handler.interface';
import { RestAuthGuard } from '../auth/auth.guard';
import { UsersRepository } from '../users/repository/users.repository';
import { AdminRepository } from '../auth/repository/admin.repository';
import { AuthUtils } from '../auth/auth.utils';

// Mock the service
const mockSensorDataService = {
  createSensorData: jest.fn(),
  generateRandomSensorData: jest.fn(),
  findAllSensorData: jest.fn(),
  findLatestSensorData: jest.fn(),
  getSensorDataStats: jest.fn(),
  getDeviceList: jest.fn(),
  findSensorDataById: jest.fn(),
  deleteSensorData: jest.fn(),
};

// Mock the guard dependencies
const mockUsersRepository = {
  findOne: jest.fn(),
};

const mockAdminRepository = {
  findOne: jest.fn(),
};

const mockAuthUtils = {
  decodeAccessToken: jest.fn(),
};

describe('SensorDataController', () => {
  let controller: SensorDataController;
  let service: jest.Mocked<SensorDataService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SensorDataController],
      providers: [
        {
          provide: SensorDataService,
          useValue: mockSensorDataService,
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: AdminRepository,
          useValue: mockAdminRepository,
        },
        {
          provide: AuthUtils,
          useValue: mockAuthUtils,
        },
        RestAuthGuard,
      ],
    }).compile();

    controller = module.get<SensorDataController>(SensorDataController);
    service = module.get(SensorDataService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createSensorData', () => {
    const mockCreateDto: CreateSensorDataDto = {
      deviceId: 'device_001',
      temperature: 25.5,
      humidity: 65.2,
      powerUsage: 150.5,
      location: 'Living Room',
    };

    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 201,
      data: {
        _id: 'sensor_id_1',
        deviceId: 'device_001',
        temperature: 25.5,
        humidity: 65.2,
        powerUsage: 150.5,
        location: 'Living Room',
        timestamp: new Date(),
        isAlert: false,
      },
    };

    it('should create sensor data successfully', async () => {
      service.createSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.createSensorData(mockCreateDto);

      expect(service.createSensorData).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Sensor data created successfully',
      });
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 400,
        error: { message: 'Creation failed' },
      };
      service.createSensorData.mockResolvedValue(errorResponse);

      const result = await controller.createSensorData(mockCreateDto);

      expect(service.createSensorData).toHaveBeenCalledWith(mockCreateDto);
      expect(result).toEqual({
        success: true,
        data: errorResponse,
        message: 'Sensor data created successfully',
      });
    });
  });

  describe('generateRandomSensorData', () => {
    const mockGenerateDto: GenerateSensorDataDto = {
      count: 10,
      deviceIdPrefix: 'test_device_',
      location: 'Test Location',
    };

    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 201,
      data: {
        generated: 10,
        message: 'Successfully generated 10 sensor data records',
      },
    };

    it('should generate random sensor data successfully', async () => {
      service.generateRandomSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.generateRandomSensorData(mockGenerateDto);

      expect(service.generateRandomSensorData).toHaveBeenCalledWith(mockGenerateDto);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Random sensor data generated successfully',
      });
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 400,
        error: { message: 'Generation failed' },
      };
      service.generateRandomSensorData.mockResolvedValue(errorResponse);

      const result = await controller.generateRandomSensorData(mockGenerateDto);

      expect(service.generateRandomSensorData).toHaveBeenCalledWith(mockGenerateDto);
      expect(result).toEqual({
        success: true,
        data: errorResponse,
        message: 'Random sensor data generated successfully',
      });
    });

    it('should handle minimal generate DTO', async () => {
      const minimalDto: GenerateSensorDataDto = {
        count: 5,
      };
      service.generateRandomSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.generateRandomSensorData(minimalDto);

      expect(service.generateRandomSensorData).toHaveBeenCalledWith(minimalDto);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Random sensor data generated successfully',
      });
    });
  });

  describe('getAllSensorData', () => {
    const mockQueryDto: QuerySensorDataDto = {
      deviceId: 'device_001',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      limit: 10,
      page: 1,
      alertsOnly: false,
    };

    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 200,
      data: [
        {
          _id: 'sensor_id_1',
          deviceId: 'device_001',
          temperature: 25.5,
          humidity: 65.2,
          powerUsage: 150.5,
        },
      ],
      metadata: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    it('should get all sensor data with filters', async () => {
      service.findAllSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.getAllSensorData(mockQueryDto);

      expect(service.findAllSensorData).toHaveBeenCalledWith(mockQueryDto);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Sensor data retrieved successfully',
      });
    });

    it('should get all sensor data with default query', async () => {
      const defaultQueryDto: QuerySensorDataDto = {};
      service.findAllSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.getAllSensorData(defaultQueryDto);

      expect(service.findAllSensorData).toHaveBeenCalledWith(defaultQueryDto);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Sensor data retrieved successfully',
      });
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 400,
        error: { message: 'Query failed' },
      };
      service.findAllSensorData.mockResolvedValue(errorResponse);

      const result = await controller.getAllSensorData(mockQueryDto);

      expect(service.findAllSensorData).toHaveBeenCalledWith(mockQueryDto);
      expect(result).toEqual({
        success: true,
        data: errorResponse,
        message: 'Sensor data retrieved successfully',
      });
    });

    it('should handle alerts only filter', async () => {
      const alertsOnlyDto: QuerySensorDataDto = {
        ...mockQueryDto,
        alertsOnly: true,
      };
      service.findAllSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.getAllSensorData(alertsOnlyDto);

      expect(service.findAllSensorData).toHaveBeenCalledWith(alertsOnlyDto);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Sensor data retrieved successfully',
      });
    });
  });

  describe('getLatestSensorData', () => {
    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 200,
      data: [
        {
          _id: 'sensor_id_1',
          deviceId: 'device_001',
          temperature: 25.5,
          humidity: 65.2,
          powerUsage: 150.5,
          timestamp: new Date(),
        },
      ],
    };

    it('should get latest sensor data for all devices', async () => {
      service.findLatestSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.getLatestSensorData();

      expect(service.findLatestSensorData).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Latest sensor data retrieved successfully',
      });
    });

    it('should get latest sensor data for specific device', async () => {
      const deviceId = 'device_001';
      service.findLatestSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.getLatestSensorData(deviceId);

      expect(service.findLatestSensorData).toHaveBeenCalledWith(deviceId);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Latest sensor data retrieved successfully',
      });
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 400,
        error: { message: 'Query failed' },
      };
      service.findLatestSensorData.mockResolvedValue(errorResponse);

      const result = await controller.getLatestSensorData();

      expect(service.findLatestSensorData).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({
        success: true,
        data: errorResponse,
        message: 'Latest sensor data retrieved successfully',
      });
    });

    it('should handle empty device ID', async () => {
      service.findLatestSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.getLatestSensorData('');

      expect(service.findLatestSensorData).toHaveBeenCalledWith('');
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Latest sensor data retrieved successfully',
      });
    });
  });

  describe('getSensorDataStats', () => {
    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 200,
      data: {
        avgTemperature: 25.5,
        avgHumidity: 65.2,
        avgPowerUsage: 150.5,
        maxTemperature: 30.1,
        minTemperature: 20.3,
        maxHumidity: 75.8,
        minHumidity: 55.1,
        totalAlerts: 3,
        count: 10,
      },
    };

    it('should get sensor data stats for all devices', async () => {
      service.getSensorDataStats.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSensorDataStats();

      expect(service.getSensorDataStats).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Statistics retrieved successfully',
      });
    });

    it('should get sensor data stats for specific device', async () => {
      const deviceId = 'device_001';
      service.getSensorDataStats.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSensorDataStats(deviceId);

      expect(service.getSensorDataStats).toHaveBeenCalledWith(deviceId, undefined);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Statistics retrieved successfully',
      });
    });

    it('should get sensor data stats with custom hours', async () => {
      const deviceId = 'device_001';
      const hours = 48;
      service.getSensorDataStats.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSensorDataStats(deviceId, hours);

      expect(service.getSensorDataStats).toHaveBeenCalledWith(deviceId, hours);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Statistics retrieved successfully',
      });
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 400,
        error: { message: 'Stats failed' },
      };
      service.getSensorDataStats.mockResolvedValue(errorResponse);

      const result = await controller.getSensorDataStats();

      expect(service.getSensorDataStats).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual({
        success: true,
        data: errorResponse,
        message: 'Statistics retrieved successfully',
      });
    });

    it('should handle string hours parameter', async () => {
      const hours = '24';
      service.getSensorDataStats.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSensorDataStats(undefined, hours as any);

      expect(service.getSensorDataStats).toHaveBeenCalledWith(undefined, hours);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Statistics retrieved successfully',
      });
    });
  });

  describe('getDeviceList', () => {
    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 200,
      data: ['device_001', 'device_002', 'device_003'],
    };

    it('should get device list successfully', async () => {
      service.getDeviceList.mockResolvedValue(mockServiceResponse);

      const result = await controller.getDeviceList();

      expect(service.getDeviceList).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Device list retrieved successfully',
      });
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 400,
        error: { message: 'Device list failed' },
      };
      service.getDeviceList.mockResolvedValue(errorResponse);

      const result = await controller.getDeviceList();

      expect(service.getDeviceList).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: errorResponse,
        message: 'Device list retrieved successfully',
      });
    });

    it('should handle empty device list', async () => {
      const emptyResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        data: [],
      };
      service.getDeviceList.mockResolvedValue(emptyResponse);

      const result = await controller.getDeviceList();

      expect(service.getDeviceList).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: emptyResponse,
        message: 'Device list retrieved successfully',
      });
    });
  });

  describe('getSensorDataById', () => {
    const mockId = 'sensor_id_1';
    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 200,
      data: {
        _id: mockId,
        deviceId: 'device_001',
        temperature: 25.5,
        humidity: 65.2,
        powerUsage: 150.5,
        timestamp: new Date(),
        isAlert: false,
      },
    };

    it('should get sensor data by ID successfully', async () => {
      service.findSensorDataById.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSensorDataById(mockId);

      expect(service.findSensorDataById).toHaveBeenCalledWith(mockId);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Sensor data retrieved successfully',
      });
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 404,
        error: { message: 'Sensor data not found' },
      };
      service.findSensorDataById.mockResolvedValue(errorResponse);

      const result = await controller.getSensorDataById(mockId);

      expect(service.findSensorDataById).toHaveBeenCalledWith(mockId);
      expect(result).toEqual({
        success: true,
        data: errorResponse,
        message: 'Sensor data retrieved successfully',
      });
    });

    it('should handle empty ID', async () => {
      service.findSensorDataById.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSensorDataById('');

      expect(service.findSensorDataById).toHaveBeenCalledWith('');
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Sensor data retrieved successfully',
      });
    });

    it('should handle invalid ID format', async () => {
      const invalidId = 'invalid_id_format';
      service.findSensorDataById.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSensorDataById(invalidId);

      expect(service.findSensorDataById).toHaveBeenCalledWith(invalidId);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Sensor data retrieved successfully',
      });
    });
  });

  describe('deleteSensorData', () => {
    const mockId = 'sensor_id_1';
    const mockServiceResponse: GlobalResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: 200,
      message: 'Sensor data deleted successfully',
    };

    it('should delete sensor data successfully', async () => {
      service.deleteSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.deleteSensorData(mockId);

      expect(service.deleteSensorData).toHaveBeenCalledWith(mockId);
      expect(result).toEqual({
        success: true,
        message: 'Sensor data deleted successfully',
      });
    });

    it('should handle service error', async () => {
      const errorResponse: GlobalResponse = {
        success: false,
        timestamp: new Date().toISOString(),
        statusCode: 404,
        error: { message: 'Sensor data not found' },
      };
      service.deleteSensorData.mockResolvedValue(errorResponse);

      const result = await controller.deleteSensorData(mockId);

      expect(service.deleteSensorData).toHaveBeenCalledWith(mockId);
      expect(result).toEqual({
        success: true,
        message: 'Sensor data deleted successfully',
      });
    });

    it('should handle empty ID', async () => {
      service.deleteSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.deleteSensorData('');

      expect(service.deleteSensorData).toHaveBeenCalledWith('');
      expect(result).toEqual({
        success: true,
        message: 'Sensor data deleted successfully',
      });
    });

    it('should handle invalid ID format', async () => {
      const invalidId = 'invalid_id_format';
      service.deleteSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.deleteSensorData(invalidId);

      expect(service.deleteSensorData).toHaveBeenCalledWith(invalidId);
      expect(result).toEqual({
        success: true,
        message: 'Sensor data deleted successfully',
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null parameters in createSensorData', async () => {
      const nullDto = null as any;
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 201,
        data: null,
      };
      service.createSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.createSensorData(nullDto);

      expect(service.createSensorData).toHaveBeenCalledWith(nullDto);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Sensor data created successfully',
      });
    });

    it('should handle undefined parameters in getAllSensorData', async () => {
      const undefinedDto = undefined as any;
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        data: [],
      };
      service.findAllSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.getAllSensorData(undefinedDto);

      expect(service.findAllSensorData).toHaveBeenCalledWith(undefinedDto);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Sensor data retrieved successfully',
      });
    });

    it('should handle null device ID in getLatestSensorData', async () => {
      const nullDeviceId = null as any;
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        data: [],
      };
      service.findLatestSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.getLatestSensorData(nullDeviceId);

      expect(service.findLatestSensorData).toHaveBeenCalledWith(nullDeviceId);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Latest sensor data retrieved successfully',
      });
    });

    it('should handle null parameters in getSensorDataStats', async () => {
      const nullDeviceId = null as any;
      const nullHours = null as any;
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        data: {},
      };
      service.getSensorDataStats.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSensorDataStats(nullDeviceId, nullHours);

      expect(service.getSensorDataStats).toHaveBeenCalledWith(nullDeviceId, nullHours);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Statistics retrieved successfully',
      });
    });

    it('should handle null ID in getSensorDataById', async () => {
      const nullId = null as any;
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        data: null,
      };
      service.findSensorDataById.mockResolvedValue(mockServiceResponse);

      const result = await controller.getSensorDataById(nullId);

      expect(service.findSensorDataById).toHaveBeenCalledWith(nullId);
      expect(result).toEqual({
        success: true,
        data: mockServiceResponse,
        message: 'Sensor data retrieved successfully',
      });
    });

    it('should handle null ID in deleteSensorData', async () => {
      const nullId = null as any;
      const mockServiceResponse: GlobalResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        statusCode: 200,
        message: 'Sensor data deleted successfully',
      };
      service.deleteSensorData.mockResolvedValue(mockServiceResponse);

      const result = await controller.deleteSensorData(nullId);

      expect(service.deleteSensorData).toHaveBeenCalledWith(nullId);
      expect(result).toEqual({
        success: true,
        message: 'Sensor data deleted successfully',
      });
    });
  });
});
