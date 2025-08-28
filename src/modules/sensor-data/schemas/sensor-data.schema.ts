import { MongooseModule } from '@nestjs/mongoose';
import { Schema } from 'mongoose';

import { extendBaseSchema } from '../../../db/base.schema';
import { ISensorData } from '../interface/sensor-data.interface';

export const SENSOR_DATA_MONGOOSE_PROVIDER = 'sensor_data_mongoose_module';
export const SENSOR_DATA_COLLECTION_NAME = 'sensor-datas';

const SensorDataSchema = extendBaseSchema(
  new Schema<ISensorData>(
    {
      deviceId: { type: String, required: true },
      temperature: { type: Number, required: true },
      humidity: { type: Number, required: true },
      powerUsage: { type: Number, required: true },
      timestamp: { type: Date, required: true },
      location: { type: String },
      isAlert: { type: Boolean, default: false },
      alertMessage: { type: String },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  ),
);

SensorDataSchema.index({ deviceId: 1 });
SensorDataSchema.index({ deviceId: 1, timestamp: -1 });
SensorDataSchema.index({ timestamp: -1 });
SensorDataSchema.index({ isAlert: 1 });
SensorDataSchema.index({ location: 1 });

export { SensorDataSchema };

export const SensorDataMongooseModel = MongooseModule.forFeature([
  {
    name: SENSOR_DATA_MONGOOSE_PROVIDER,
    schema: SensorDataSchema,
    collection: SENSOR_DATA_COLLECTION_NAME,
  },
]);
