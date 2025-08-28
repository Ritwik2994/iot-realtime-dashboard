import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

import { WebSocketMessage } from '@/shared/types';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class IoWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(IoWebSocketGateway.name);
  private connectedClients: Map<string, Socket> = new Map();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const clientId = client.id;
    this.connectedClients.set(clientId, client);
    this.logger.log(`Client connected: ${clientId}`);

    // Send welcome message
    client.emit('connected', {
      message: 'Connected to IoT Dashboard WebSocket',
      clientId,
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.connectedClients.delete(clientId);
    this.logger.log(`Client disconnected: ${clientId}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    client.emit('room-joined', { room, timestamp: new Date() });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    client.emit('room-left', { room, timestamp: new Date() });
  }

  @SubscribeMessage('subscribe-device')
  handleSubscribeDevice(client: Socket, deviceId: string) {
    const room = `device-${deviceId}`;
    console.log('room', room);
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to device: ${deviceId}`);
    client.emit('device-subscribed', { deviceId, timestamp: new Date() });
  }

  @SubscribeMessage('unsubscribe-device')
  handleUnsubscribeDevice(client: Socket, deviceId: string) {
    const room = `device-${deviceId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from device: ${deviceId}`);
    client.emit('device-unsubscribed', { deviceId, timestamp: new Date() });
  }

  // Method to broadcast sensor data updates
  broadcastSensorData(sensorData: any) {
    const message: WebSocketMessage = {
      type: 'sensor_data',
      payload: sensorData,
      timestamp: new Date(),
    };

    // Broadcast to all connected clients
    this.server.emit('sensor-data-update', message);

    // Broadcast to specific device room
    if (sensorData.deviceId) {
      this.server.to(`device-${sensorData.deviceId}`).emit('device-data-update', message);
    }

    // Broadcast alert if it's an alert
    if (sensorData.isAlert) {
      this.server.emit('alert', {
        type: 'alert',
        payload: {
          deviceId: sensorData.deviceId,
          message: sensorData.alertMessage,
          severity: 'warning',
        },
        timestamp: new Date(),
      });
    }

    this.logger.log(`Broadcasted sensor data for device: ${sensorData.deviceId}`);
  }

  // Method to broadcast system status
  broadcastSystemStatus(status: any) {
    const message: WebSocketMessage = {
      type: 'status',
      payload: status,
      timestamp: new Date(),
    };

    this.server.emit('system-status', message);
    this.logger.log('Broadcasted system status');
  }

  // Method to send message to specific client
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  // Method to get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Method to get all connected client IDs
  getConnectedClientIds(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
