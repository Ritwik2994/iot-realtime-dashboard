import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSensorDataDto {
  @ApiProperty({
    description: 'Unique identifier for the IoT device',
    example: 'device_001',
    type: String,
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    description: 'Temperature reading in Celsius (-50 to 100)',
    example: 25.5,
    type: Number,
    minimum: -50,
    maximum: 100,
  })
  @IsNumber()
  @Min(-50)
  @Max(100)
  temperature: number;

  @ApiProperty({
    description: 'Humidity percentage (0 to 100)',
    example: 65.2,
    type: Number,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  humidity: number;

  @ApiProperty({
    description: 'Power usage in watts (minimum 0)',
    example: 150.5,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  powerUsage: number;

  @ApiProperty({
    description: 'Device location (optional)',
    example: 'Living Room',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;
}
