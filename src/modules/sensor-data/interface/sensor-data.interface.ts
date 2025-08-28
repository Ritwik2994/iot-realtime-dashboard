import { Document } from 'mongoose';
import { AbstractSchema } from '@/db/abstract.schema';

export interface ISensorData extends Document, AbstractSchema {
  deviceId: string;
  temperature: Number;
  humidity: Number;
  powerUsage: Number;
  timestamp: Date;
  location: String;
  isAlert: boolean;
  alertMessage: string;
}
