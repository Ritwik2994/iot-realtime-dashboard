import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';

import { SensorDataService } from '../sensor-data/sensor-data.service';
import { IoWebSocketGateway } from '../websocket/websocket.gateway';
import { CreateSensorDataDto } from '../sensor-data/dto/create-sensor-data.dto';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly sensorDataService: SensorDataService,
    private readonly webSocketGateway: IoWebSocketGateway,
  ) {}

  async onModuleInit() {
    await this.connectToMqttBroker();
  }

  async onModuleDestroy() {
    await this.disconnectFromMqttBroker();
  }

  private async disconnectFromMqttBroker(): Promise<void> {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      this.logger.log('Disconnected from MQTT broker');
    }
  }

  private async connectToMqttBroker(): Promise<void> {
    const brokerUrl = this.configService.get('MQTT_BROKER_URL', 'mqtt://localhost:1883');
    const clientId = this.configService.get('MQTT_CLIENT_ID', 'iot-dashboard-backend');
    const username = this.configService.get('MQTT_USERNAME');
    const password = this.configService.get('MQTT_PASSWORD');

    const options: mqtt.IClientOptions = {
      clientId,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
    };

    if (username && password) {
      options.username = username;
      options.password = password;
    }

    try {
      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to MQTT broker');
        this.subscribeToTopics();
        this.broadcastSystemStatus();
      });

      this.client.on('message', (topic, message) => {
        this.handleMqttMessage(topic, message);
      });

      this.client.on('error', error => {
        this.logger.error('MQTT connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.logger.log('MQTT connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        this.logger.log('Reconnecting to MQTT broker...');
      });
    } catch (error) {
      this.logger.error('Failed to connect to MQTT broker:', error);
    }
  }

  private subscribeToTopics(): void {
    const topics = [
      'iot/sensor/+/data',
      'iot/sensor/+/temperature',
      'iot/sensor/+/humidity',
      'iot/sensor/+/power',
      'iot/device/+/status',
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, err => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          this.logger.log(`Subscribed to ${topic}`);
        }
      });
    });
  }

  private async handleMqttMessage(topic: string, message: Buffer): Promise<void> {
    try {
      const messageStr = message.toString();
      this.logger.log(`Received MQTT message on ${topic}: ${messageStr}`);

      // Parse the message
      let sensorData: any;
      try {
        sensorData = JSON.parse(messageStr);
      } catch (parseError) {
        this.logger.error('Failed to parse MQTT message:', parseError);
        return;
      }

      // Extract device ID from topic
      const topicParts = topic.split('/');
      const deviceId = topicParts[2]; // iot/sensor/{deviceId}/data

      // Handle different topic patterns
      if (topic.includes('/data')) {
        await this.handleSensorData(deviceId, sensorData);
      } else if (topic.includes('/temperature')) {
        await this.handleTemperatureData(deviceId, sensorData);
      } else if (topic.includes('/humidity')) {
        await this.handleHumidityData(deviceId, sensorData);
      } else if (topic.includes('/power')) {
        await this.handlePowerData(deviceId, sensorData);
      } else if (topic.includes('/status')) {
        await this.handleDeviceStatus(deviceId, sensorData);
      }
    } catch (error) {
      this.logger.error('Error handling MQTT message:', error);
    }
  }

  private async handleSensorData(deviceId: string, data: any): Promise<void> {
    const sensorDataDto: CreateSensorDataDto = {
      deviceId,
      temperature: data.temperature || 0,
      humidity: data.humidity || 0,
      powerUsage: data.powerUsage || 0,
      location: data.location,
    };

    try {
      const result = await this.sensorDataService.createSensorData(sensorDataDto);
      this.webSocketGateway.broadcastSensorData(result.data);
      this.logger.log(`Processed sensor data for device ${deviceId}`);
    } catch (error) {
      this.logger.error(`Failed to save sensor data for device ${deviceId}:`, error);
    }
  }

  private async handleTemperatureData(deviceId: string, data: any): Promise<void> {
    // Handle temperature-only updates
    const sensorDataDto: CreateSensorDataDto = {
      deviceId,
      temperature: data.temperature || data.value || 0,
      humidity: 0, // Default value
      powerUsage: 0, // Default value
      location: data.location,
    };

    await this.handleSensorData(deviceId, sensorDataDto);
  }

  private async handleHumidityData(deviceId: string, data: any): Promise<void> {
    // Handle humidity-only updates
    const sensorDataDto: CreateSensorDataDto = {
      deviceId,
      temperature: 0, // Default value
      humidity: data.humidity || data.value || 0,
      powerUsage: 0, // Default value
      location: data.location,
    };

    await this.handleSensorData(deviceId, sensorDataDto);
  }

  private async handlePowerData(deviceId: string, data: any): Promise<void> {
    // Handle power-only updates
    const sensorDataDto: CreateSensorDataDto = {
      deviceId,
      temperature: 0, // Default value
      humidity: 0, // Default value
      powerUsage: data.powerUsage || data.value || 0,
      location: data.location,
    };

    await this.handleSensorData(deviceId, sensorDataDto);
  }

  private async handleDeviceStatus(deviceId: string, status: any): Promise<void> {
    // Broadcast device status update
    this.webSocketGateway.broadcastSystemStatus({
      deviceId,
      status: status.status || 'unknown',
      timestamp: new Date(),
      ...status,
    });

    this.logger.log(`Device ${deviceId} status: ${status.status}`);
  }

  private broadcastSystemStatus(): void {
    this.webSocketGateway.broadcastSystemStatus({
      mqttConnected: this.isConnected,
      timestamp: new Date(),
    });
  }

  async publishMessage(topic: string, message: any): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('MQTT client not connected');
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      this.client.publish(topic, messageStr, err => {
        if (err) {
          this.logger.error(`Failed to publish to ${topic}:`, err);
        } else {
          this.logger.log(`Published to ${topic}: ${messageStr}`);
        }
      });
    } catch (error) {
      this.logger.error('Error publishing MQTT message:', error);
    }
  }

  isMqttConnected(): boolean {
    return this.isConnected;
  }

  getConnectionStatus(): any {
    return {
      connected: this.isConnected,
      clientId: this.configService.get('MQTT_CLIENT_ID'),
      brokerUrl: this.configService.get('MQTT_BROKER_URL'),
    };
  }
}
