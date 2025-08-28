import { Module } from '@nestjs/common';

import { IoWebSocketGateway } from './websocket.gateway';

@Module({
  providers: [IoWebSocketGateway],
  exports: [IoWebSocketGateway],
})
export class WebSocketModule {}
