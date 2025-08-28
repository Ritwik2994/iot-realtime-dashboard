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
import { NotFoundException } from '@nestjs/common';
import { SensorDataService } from './sensor-data.service';
import { SensorDataRepository } from './repository/sensor-data.repository';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';
import { QuerySensorDataDto } from './dto/query-sensor-data.dto';
import { GenerateSensorDataDto } from './dto/generate-sensor-data.dto';
import { ISensorData } from './interface/sensor-data.interface';
import { ResponseHandler } from '@/helper/response-handler/response-handler.service';

// Mock the repository
const mockSensorDataRepository = {
  create: jest.fn(),
  createMany: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  distinct: jest.fn(),
  aggregate: jest.fn(),
};

// Mock the response handler
jest.mock('@/helper/response-handler/response-handler.service', () => ({
  ResponseHandler: {
    success: jest.fn(),
    transformError: jest.fn(),
  },
}));

describe('SensorDataService', () => {
  let service: SensorDataService;
  let repository: jest.Mocked<SensorDataRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SensorDataService,
        {
          provide: SensorDataRepository,
          useValue: mockSensorDataRepository,
        },
      ],
    }).compile();

    service = module.get<SensorDataService>(SensorDataService);
    repository = module.get(SensorDataRepository);

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

    const mockSensorData: Partial<ISensorData> = {
      _id: 'sensor_id_1',
      deviceId: 'device_001',
      temperature: 25.5,
      humidity: 65.2,
      powerUsage: 150.5,
      location: 'Living Room',
      timestamp: new Date(),
      isAlert: false,
      alertMessage: undefined,
    };

    it('should create sensor data successfully', async () => {
      const mockResponse = { success: true, data: mockSensorData };
      repository.create.mockResolvedValue(mockSensorData as ISensorData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.createSensorData(mockCreateDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...mockCreateDto,
        timestamp: expect.any(Date),
        isAlert: false,
        alertMessage: undefined,
      });
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: mockSensorData,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create sensor data with alert when temperature is high', async () => {
      const highTempDto: CreateSensorDataDto = {
        ...mockCreateDto,
        temperature: 85.0,
      };
      const mockResponse = { success: true, data: mockSensorData };
      repository.create.mockResolvedValue(mockSensorData as ISensorData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.createSensorData(highTempDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...highTempDto,
        timestamp: expect.any(Date),
        isAlert: true,
        alertMessage: 'High temperature',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create sensor data with alert when temperature is low', async () => {
      const lowTempDto: CreateSensorDataDto = {
        ...mockCreateDto,
        temperature: 5.0,
      };
      const mockResponse = { success: true, data: mockSensorData };
      repository.create.mockResolvedValue(mockSensorData as ISensorData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.createSensorData(lowTempDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...lowTempDto,
        timestamp: expect.any(Date),
        isAlert: true,
        alertMessage: 'Low temperature',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create sensor data with alert when humidity is high', async () => {
      const highHumidityDto: CreateSensorDataDto = {
        ...mockCreateDto,
        humidity: 95.0,
      };
      const mockResponse = { success: true, data: mockSensorData };
      repository.create.mockResolvedValue(mockSensorData as ISensorData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.createSensorData(highHumidityDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...highHumidityDto,
        timestamp: expect.any(Date),
        isAlert: true,
        alertMessage: 'High humidity',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create sensor data with alert when humidity is low', async () => {
      const lowHumidityDto: CreateSensorDataDto = {
        ...mockCreateDto,
        humidity: 15.0,
      };
      const mockResponse = { success: true, data: mockSensorData };
      repository.create.mockResolvedValue(mockSensorData as ISensorData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.createSensorData(lowHumidityDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...lowHumidityDto,
        timestamp: expect.any(Date),
        isAlert: true,
        alertMessage: 'Low humidity',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create sensor data with alert when power usage is high', async () => {
      const highPowerDto: CreateSensorDataDto = {
        ...mockCreateDto,
        powerUsage: 1100.0,
      };
      const mockResponse = { success: true, data: mockSensorData };
      repository.create.mockResolvedValue(mockSensorData as ISensorData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.createSensorData(highPowerDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...highPowerDto,
        timestamp: expect.any(Date),
        isAlert: true,
        alertMessage: 'High power usage',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create sensor data with multiple alerts', async () => {
      const multipleAlertsDto: CreateSensorDataDto = {
        ...mockCreateDto,
        temperature: 85.0,
        humidity: 95.0,
        powerUsage: 1100.0,
      };
      const mockResponse = { success: true, data: mockSensorData };
      repository.create.mockResolvedValue(mockSensorData as ISensorData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.createSensorData(multipleAlertsDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...multipleAlertsDto,
        timestamp: expect.any(Date),
        isAlert: true,
        alertMessage: 'High temperature, High humidity, High power usage',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle creation error', async () => {
      const error = new Error('Database error');
      const mockErrorResponse = { success: false, error: 'Database error' };
      repository.create.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.createSensorData(mockCreateDto);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('generateRandomSensorData', () => {
    const mockGenerateDto: GenerateSensorDataDto = {
      count: 5,
      deviceIdPrefix: 'test_device_',
      location: 'Test Location',
    };

    const mockGeneratedData = [
      {
        _id: '1',
        deviceId: 'test_device_123',
        temperature: 25.5,
        humidity: 65.2,
        powerUsage: 150.5,
        timestamp: new Date(),
        location: 'Test Location',
        isAlert: false,
        alertMessage: undefined,
      },
      {
        _id: '2',
        deviceId: 'test_device_456',
        temperature: 30.1,
        humidity: 70.8,
        powerUsage: 200.3,
        timestamp: new Date(),
        location: 'Test Location',
        isAlert: false,
        alertMessage: undefined,
      },
    ];

    it('should generate random sensor data successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          generated: 2,
          message: 'Successfully generated 2 sensor data records',
        },
      };
      repository.createMany.mockResolvedValue(mockGeneratedData as unknown as ISensorData[]);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.generateRandomSensorData(mockGenerateDto);

      expect(repository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            deviceId: expect.stringMatching(/^test_device_\d+$/),
            temperature: expect.any(Number),
            humidity: expect.any(Number),
            powerUsage: expect.any(Number),
            timestamp: expect.any(Date),
            location: 'Test Location',
            isAlert: expect.any(Boolean),
            alertMessage: expect.any(String),
          }),
        ]),
      );
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: {
          generated: 2,
          message: 'Successfully generated 2 sensor data records',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should generate random sensor data with default prefix', async () => {
      const dtoWithoutPrefix: GenerateSensorDataDto = {
        count: 3,
        location: 'Default Location',
      };
      const mockResponse = {
        success: true,
        data: {
          generated: 3,
          message: 'Successfully generated 3 sensor data records',
        },
      };
      repository.createMany.mockResolvedValue(mockGeneratedData as unknown as ISensorData[]);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.generateRandomSensorData(dtoWithoutPrefix);

      expect(repository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            deviceId: expect.stringMatching(/^device_\d+$/),
            location: 'Default Location',
          }),
        ]),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle generation error', async () => {
      const error = new Error('Generation failed');
      const mockErrorResponse = { success: false, error: 'Generation failed' };
      repository.createMany.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.generateRandomSensorData(mockGenerateDto);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('findAllSensorData', () => {
    const mockQueryDto: QuerySensorDataDto = {
      deviceId: 'device_001',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      limit: 10,
      page: 1,
      alertsOnly: false,
    };

    const mockSensorData = [
      {
        _id: '1',
        deviceId: 'device_001',
        temperature: 25.5,
        humidity: 65.2,
        powerUsage: 150.5,
        timestamp: new Date('2024-06-01'),
        location: 'Living Room',
        isAlert: false,
        alertMessage: undefined,
      },
      {
        _id: '2',
        deviceId: 'device_001',
        temperature: 26.1,
        humidity: 70.8,
        powerUsage: 180.3,
        timestamp: new Date('2024-06-02'),
        location: 'Living Room',
        isAlert: false,
        alertMessage: undefined,
      },
    ];

    it('should find all sensor data with filters', async () => {
      const mockResponse = {
        success: true,
        data: mockSensorData,
        metadata: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };
      repository.find.mockResolvedValue(mockSensorData as unknown as ISensorData[]);
      repository.countDocuments.mockResolvedValue(2);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findAllSensorData(mockQueryDto);

      expect(repository.find).toHaveBeenCalledWith({
        deviceId: 'device_001',
        timestamp: {
          $gte: new Date('2024-01-01T00:00:00Z'),
          $lte: new Date('2024-12-31T23:59:59Z'),
        },
      });
      expect(repository.countDocuments).toHaveBeenCalledWith({
        deviceId: 'device_001',
        timestamp: {
          $gte: new Date('2024-01-01T00:00:00Z'),
          $lte: new Date('2024-12-31T23:59:59Z'),
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should find sensor data with alerts only filter', async () => {
      const alertsOnlyDto: QuerySensorDataDto = {
        ...mockQueryDto,
        alertsOnly: true,
      };
      const mockResponse = {
        success: true,
        data: mockSensorData,
        metadata: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };
      repository.find.mockResolvedValue(mockSensorData as unknown as ISensorData[]);
      repository.countDocuments.mockResolvedValue(2);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findAllSensorData(alertsOnlyDto);

      expect(repository.find).toHaveBeenCalledWith({
        deviceId: 'device_001',
        isAlert: true,
        timestamp: {
          $gte: new Date('2024-01-01T00:00:00Z'),
          $lte: new Date('2024-12-31T23:59:59Z'),
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should find sensor data with default pagination', async () => {
      const defaultQueryDto: QuerySensorDataDto = {};
      const mockResponse = {
        success: true,
        data: mockSensorData,
        metadata: { total: 2, page: 1, limit: 50, totalPages: 1 },
      };
      repository.find.mockResolvedValue(mockSensorData as unknown as ISensorData[]);
      repository.countDocuments.mockResolvedValue(2);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findAllSensorData(defaultQueryDto);

      expect(repository.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResponse);
    });

    it('should handle query error', async () => {
      const error = new Error('Query failed');
      const mockErrorResponse = { success: false, error: 'Query failed' };
      repository.find.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.findAllSensorData(mockQueryDto);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('findSensorDataById', () => {
    const mockId = 'sensor_id_1';
    const mockSensorData: Partial<ISensorData> = {
      _id: mockId,
      deviceId: 'device_001',
      temperature: 25.5,
      humidity: 65.2,
      powerUsage: 150.5,
    };

    it('should find sensor data by ID successfully', async () => {
      const mockResponse = { success: true, data: mockSensorData };
      repository.findById.mockResolvedValue(mockSensorData as ISensorData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findSensorDataById(mockId);

      expect(repository.findById).toHaveBeenCalledWith(mockId);
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: mockSensorData,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when sensor data not found', async () => {
      repository.findById.mockResolvedValue(null);
      const mockErrorResponse = {
        success: false,
        error: 'Sensor data not found',
      };
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.findSensorDataById(mockId);

      expect(repository.findById).toHaveBeenCalledWith(mockId);
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(NotFoundException));
      expect(result).toEqual(mockErrorResponse);
    });

    it('should handle repository error', async () => {
      const error = new Error('Database error');
      const mockErrorResponse = { success: false, error: 'Database error' };
      repository.findById.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.findSensorDataById(mockId);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('findLatestSensorData', () => {
    const mockSensorData = [
      { _id: '1', deviceId: 'device_001', timestamp: new Date('2024-06-02') },
      { _id: '2', deviceId: 'device_001', timestamp: new Date('2024-06-01') },
      { _id: '3', deviceId: 'device_002', timestamp: new Date('2024-06-03') },
    ];

    it('should find latest sensor data for all devices', async () => {
      const mockResponse = { success: true, data: mockSensorData.slice(0, 10) };
      repository.find.mockResolvedValue(mockSensorData as unknown as ISensorData[]);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findLatestSensorData();

      expect(repository.find).toHaveBeenCalledWith({});
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ _id: '3' }), // Most recent first
          expect.objectContaining({ _id: '1' }),
          expect.objectContaining({ _id: '2' }),
        ]),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should find latest sensor data for specific device', async () => {
      const deviceId = 'device_001';
      const deviceData = mockSensorData.filter(data => data.deviceId === deviceId);
      const mockResponse = { success: true, data: deviceData.slice(0, 10) };
      repository.find.mockResolvedValue(deviceData as unknown as ISensorData[]);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findLatestSensorData(deviceId);

      expect(repository.find).toHaveBeenCalledWith({ deviceId });
      expect(result).toEqual(mockResponse);
    });

    it('should limit results to 10 records', async () => {
      const manyRecords = Array.from({ length: 15 }, (_, i) => ({
        _id: `id_${i}`,
        deviceId: 'device_001',
        timestamp: new Date(2024, 5, i + 1),
      }));
      const mockResponse = { success: true, data: manyRecords.slice(0, 10) };
      repository.find.mockResolvedValue(manyRecords as unknown as ISensorData[]);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.findLatestSensorData();

      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ _id: 'id_14' }), // Most recent
        ]),
      });
      expect(result.data).toHaveLength(10);
    });

    it('should handle repository error', async () => {
      const error = new Error('Database error');
      const mockErrorResponse = { success: false, error: 'Database error' };
      repository.find.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.findLatestSensorData();

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('getSensorDataStats', () => {
    const mockStats = [
      {
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
    ];

    it('should get sensor data stats for all devices', async () => {
      const mockResponse = { success: true, data: mockStats[0] };
      repository.aggregate.mockResolvedValue(mockStats);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.getSensorDataStats();

      expect(repository.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            timestamp: { $gte: expect.any(Date) },
          },
        },
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
      expect(result).toEqual(mockResponse);
    });

    it('should get sensor data stats for specific device', async () => {
      const deviceId = 'device_001';
      const mockResponse = { success: true, data: mockStats[0] };
      repository.aggregate.mockResolvedValue(mockStats);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.getSensorDataStats(deviceId);

      expect(repository.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            deviceId,
            timestamp: { $gte: expect.any(Date) },
          },
        },
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
      expect(result).toEqual(mockResponse);
    });

    it('should get sensor data stats with custom hours', async () => {
      const hours = 48;
      const mockResponse = { success: true, data: mockStats[0] };
      repository.aggregate.mockResolvedValue(mockStats);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.getSensorDataStats(undefined, hours);

      expect(repository.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            timestamp: { $gte: expect.any(Date) },
          },
        },
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
      expect(result).toEqual(mockResponse);
    });

    it('should return default stats when no data found', async () => {
      const defaultStats = {
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
      const mockResponse = { success: true, data: defaultStats };
      repository.aggregate.mockResolvedValue([]);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.getSensorDataStats();

      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: defaultStats,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle aggregation error', async () => {
      const error = new Error('Aggregation failed');
      const mockErrorResponse = { success: false, error: 'Aggregation failed' };
      repository.aggregate.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.getSensorDataStats();

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('getDeviceList', () => {
    const mockDevices = ['device_001', 'device_002', 'device_003'];

    it('should get device list successfully', async () => {
      const mockResponse = { success: true, data: mockDevices };
      repository.distinct.mockResolvedValue(mockDevices);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.getDeviceList();

      expect(repository.distinct).toHaveBeenCalledWith('deviceId');
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        data: mockDevices,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle repository error', async () => {
      const error = new Error('Database error');
      const mockErrorResponse = { success: false, error: 'Database error' };
      repository.distinct.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.getDeviceList();

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('deleteSensorData', () => {
    const mockId = 'sensor_id_1';
    const mockDeletedData = { _id: mockId, deviceId: 'device_001' };

    it('should delete sensor data successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Sensor data deleted successfully',
      };
      repository.findByIdAndDelete.mockResolvedValue(mockDeletedData as ISensorData);
      (ResponseHandler.success as jest.Mock).mockReturnValue(mockResponse);

      const result = await service.deleteSensorData(mockId);

      expect(repository.findByIdAndDelete).toHaveBeenCalledWith(mockId);
      expect(ResponseHandler.success).toHaveBeenCalledWith({
        message: 'Sensor data deleted successfully',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when sensor data not found', async () => {
      repository.findByIdAndDelete.mockResolvedValue(null);
      const mockErrorResponse = {
        success: false,
        error: 'Sensor data not found',
      };
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.deleteSensorData(mockId);

      expect(repository.findByIdAndDelete).toHaveBeenCalledWith(mockId);
      expect(ResponseHandler.transformError).toHaveBeenCalledWith(expect.any(NotFoundException));
      expect(result).toEqual(mockErrorResponse);
    });

    it('should handle repository error', async () => {
      const error = new Error('Database error');
      const mockErrorResponse = { success: false, error: 'Database error' };
      repository.findByIdAndDelete.mockRejectedValue(error);
      (ResponseHandler.transformError as jest.Mock).mockReturnValue(mockErrorResponse);

      const result = await service.deleteSensorData(mockId);

      expect(ResponseHandler.transformError).toHaveBeenCalledWith(error);
      expect(result).toEqual(mockErrorResponse);
    });
  });

  describe('Private methods', () => {
    describe('generateRandomTemperature', () => {
      it('should generate temperature within valid range', () => {
        const serviceAny = service as any;
        const temperature = serviceAny.generateRandomTemperature();

        expect(temperature).toBeGreaterThanOrEqual(-10);
        expect(temperature).toBeLessThanOrEqual(95);
        expect(typeof temperature).toBe('number');
      });
    });

    describe('generateRandomHumidity', () => {
      it('should generate humidity within valid range', () => {
        const serviceAny = service as any;
        const humidity = serviceAny.generateRandomHumidity();

        expect(humidity).toBeGreaterThanOrEqual(15);
        expect(humidity).toBeLessThanOrEqual(95);
        expect(typeof humidity).toBe('number');
      });
    });

    describe('generateRandomPowerUsage', () => {
      it('should generate power usage within valid range', () => {
        const serviceAny = service as any;
        const powerUsage = serviceAny.generateRandomPowerUsage();

        expect(powerUsage).toBeGreaterThanOrEqual(50);
        expect(powerUsage).toBeLessThanOrEqual(1200);
        expect(typeof powerUsage).toBe('number');
      });
    });

    describe('generateRandomTimestamp', () => {
      it('should generate timestamp within last 30 days', () => {
        const serviceAny = service as any;
        const timestamp = serviceAny.generateRandomTimestamp();
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
        expect(timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    describe('detectAlerts', () => {
      it('should detect high temperature alert', () => {
        const serviceAny = service as any;
        const sensorData = { temperature: 85, humidity: 50, powerUsage: 100 };
        const isAlert = serviceAny.detectAlerts(sensorData);

        expect(isAlert).toBe(true);
      });

      it('should detect low temperature alert', () => {
        const serviceAny = service as any;
        const sensorData = { temperature: 5, humidity: 50, powerUsage: 100 };
        const isAlert = serviceAny.detectAlerts(sensorData);

        expect(isAlert).toBe(true);
      });

      it('should detect high humidity alert', () => {
        const serviceAny = service as any;
        const sensorData = { temperature: 25, humidity: 95, powerUsage: 100 };
        const isAlert = serviceAny.detectAlerts(sensorData);

        expect(isAlert).toBe(true);
      });

      it('should detect low humidity alert', () => {
        const serviceAny = service as any;
        const sensorData = { temperature: 25, humidity: 15, powerUsage: 100 };
        const isAlert = serviceAny.detectAlerts(sensorData);

        expect(isAlert).toBe(true);
      });

      it('should detect high power usage alert', () => {
        const serviceAny = service as any;
        const sensorData = { temperature: 25, humidity: 50, powerUsage: 1100 };
        const isAlert = serviceAny.detectAlerts(sensorData);

        expect(isAlert).toBe(true);
      });

      it('should not detect alert for normal values', () => {
        const serviceAny = service as any;
        const sensorData = { temperature: 25, humidity: 50, powerUsage: 100 };
        const isAlert = serviceAny.detectAlerts(sensorData);

        expect(isAlert).toBe(false);
      });
    });

    describe('generateAlertMessage', () => {
      it('should generate high temperature alert message', () => {
        const serviceAny = service as any;
        const sensorData = { temperature: 85, humidity: 50, powerUsage: 100 };
        const alertMessage = serviceAny.generateAlertMessage(sensorData);

        expect(alertMessage).toBe('High temperature');
      });

      it('should generate multiple alert messages', () => {
        const serviceAny = service as any;
        const sensorData = { temperature: 85, humidity: 95, powerUsage: 1100 };
        const alertMessage = serviceAny.generateAlertMessage(sensorData);

        expect(alertMessage).toBe('High temperature, High humidity, High power usage');
      });

      it('should return undefined for no alerts', () => {
        const serviceAny = service as any;
        const sensorData = { temperature: 25, humidity: 50, powerUsage: 100 };
        const alertMessage = serviceAny.generateAlertMessage(sensorData);

        expect(alertMessage).toBeUndefined();
      });
    });
  });
});
