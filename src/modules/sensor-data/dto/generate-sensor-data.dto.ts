import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSensorDataDto {
  @ApiProperty({
    description: 'Number of sensor data records to generate',
    example: 100,
    type: Number,
    minimum: 1,
    maximum: 10000,
  })
  @IsNumber()
  @Min(1)
  @Max(10000)
  count: number;

  @ApiProperty({
    description: 'Optional device ID prefix for generated data',
    example: 'device_',
    type: String,
    required: false,
  })
  @IsOptional()
  deviceIdPrefix?: string;

  @ApiProperty({
    description: 'Optional location for generated data',
    example: 'Living Room',
    type: String,
    required: false,
  })
  @IsOptional()
  location?: string;
}
