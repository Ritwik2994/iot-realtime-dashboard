import { IsOptional, IsString, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QuerySensorDataDto {
  @ApiProperty({
    description: 'Filter by device ID',
    example: 'device_001',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({
    description: 'Start date for data range (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for data range (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Number of records to return (1-100)',
    example: 50,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiProperty({
    description: 'Page number for pagination (minimum 1)',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Filter to show only alert data',
    example: false,
    type: Boolean,
    default: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  alertsOnly?: boolean = false;
}
