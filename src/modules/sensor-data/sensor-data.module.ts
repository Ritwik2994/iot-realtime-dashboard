import { Module } from '@nestjs/common';

import { SensorDataController } from './sensor-data.controller';
import { SensorDataService } from './sensor-data.service';
import { SensorDataResolver } from './graphql/sensor-data.resolver';
import { UsersModule } from '../users/users.module';
import { SensorDataMongooseModel } from './schemas/sensor-data.schema';
import { SensorDataRepository } from './repository/sensor-data.repository';

@Module({
  imports: [UsersModule, SensorDataMongooseModel],
  controllers: [SensorDataController],
  providers: [SensorDataService, SensorDataResolver, SensorDataRepository],
  exports: [SensorDataService],
})
export class IotDataModule {}
