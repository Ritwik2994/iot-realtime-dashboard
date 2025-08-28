export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface SensorData {
  deviceId: string;
  temperature: number;
  humidity: number;
  powerUsage: number;
  timestamp: Date;
  location?: string;
}

export interface CreateSensorDataDto {
  deviceId: string;
  temperature: number;
  humidity: number;
  powerUsage: number;
  location?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WebSocketMessage {
  type: 'sensor_data' | 'alert' | 'status';
  payload: any;
  timestamp: Date;
}

export interface ISort {
  [key: string]: 1 | -1;
}
