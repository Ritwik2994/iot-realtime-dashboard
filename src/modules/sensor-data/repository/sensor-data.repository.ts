import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AbstractRepository } from '@/db/abstract.repository';
import { ISensorData } from '../interface/sensor-data.interface';
import { SENSOR_DATA_MONGOOSE_PROVIDER } from '../schemas/sensor-data.schema';

export class SensorDataRepository extends AbstractRepository<ISensorData> {
  protected readonly logger = new Logger(SensorDataRepository.name);

  constructor(
    @InjectModel(SENSOR_DATA_MONGOOSE_PROVIDER)
    private readonly sensorDataModel: Model<ISensorData>,
  ) {
    super(sensorDataModel);
  }
}
