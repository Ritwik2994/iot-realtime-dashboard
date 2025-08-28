import { Module } from '@nestjs/common';

import { MqttService } from './mqtt.service';
import { IotDataModule } from '../sensor-data/sensor-data.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [IotDataModule, WebSocketModule],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
