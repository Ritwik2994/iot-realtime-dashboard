import * as mqtt from "mqtt";
import { config } from "dotenv";

// Load environment variables
config();

interface SensorData {
  temperature: number;
  humidity: number;
  powerUsage: number;
  location?: string;
  timestamp: Date;
}

interface DeviceConfig {
  deviceId: string;
  location: string;
  baseTemperature: number;
  baseHumidity: number;
  basePowerUsage: number;
  temperatureVariation: number;
  humidityVariation: number;
  powerVariation: number;
}

class MqttSimulator {
  private client: mqtt.MqttClient;
  private devices: DeviceConfig[];
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
    const clientId = `iot-simulator-${Date.now()}`;

    this.client = mqtt.connect(brokerUrl, {
      clientId,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
    });

    this.setupEventHandlers();
    this.initializeDevices();
  }

  private setupEventHandlers(): void {
    this.client.on("connect", () => {
      console.log("✅ Connected to MQTT broker");
      this.startSimulation();
    });

    this.client.on("error", (error) => {
      console.error("❌ MQTT connection error:", error);
    });

    this.client.on("close", () => {
      console.log("🔌 MQTT connection closed");
      this.stopSimulation();
    });

    this.client.on("reconnect", () => {
      console.log("🔄 Reconnecting to MQTT broker...");
    });
  }

  private initializeDevices(): void {
    this.devices = [
      {
        deviceId: "sensor-001",
        location: "Server Room A",
        baseTemperature: 22,
        baseHumidity: 45,
        basePowerUsage: 500,
        temperatureVariation: 5,
        humidityVariation: 10,
        powerVariation: 100,
      },
      {
        deviceId: "sensor-002",
        location: "Data Center B",
        baseTemperature: 18,
        baseHumidity: 40,
        basePowerUsage: 800,
        temperatureVariation: 3,
        humidityVariation: 8,
        powerVariation: 150,
      },
      {
        deviceId: "sensor-003",
        location: "Office Floor 1",
        baseTemperature: 24,
        baseHumidity: 50,
        basePowerUsage: 200,
        temperatureVariation: 4,
        humidityVariation: 15,
        powerVariation: 50,
      },
      {
        deviceId: "sensor-004",
        location: "Warehouse C",
        baseTemperature: 15,
        baseHumidity: 35,
        basePowerUsage: 300,
        temperatureVariation: 8,
        humidityVariation: 20,
        powerVariation: 80,
      },
      {
        deviceId: "sensor-005",
        location: "Lab Room D",
        baseTemperature: 20,
        baseHumidity: 55,
        basePowerUsage: 600,
        temperatureVariation: 6,
        humidityVariation: 12,
        powerVariation: 120,
      },
    ];
  }

  private generateRandomValue(base: number, variation: number): number {
    const min = base - variation;
    const max = base + variation;
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }

  private generateSensorData(device: DeviceConfig): SensorData {
    return {
      temperature: this.generateRandomValue(
        device.baseTemperature,
        device.temperatureVariation
      ),
      humidity: this.generateRandomValue(
        device.baseHumidity,
        device.humidityVariation
      ),
      powerUsage: this.generateRandomValue(
        device.basePowerUsage,
        device.powerVariation
      ),
      location: device.location,
      timestamp: new Date(),
    };
  }

  private publishSensorData(device: DeviceConfig): void {
    const sensorData = this.generateSensorData(device);

    // Publish complete sensor data
    const topic = `iot/sensor/${device.deviceId}/data`;
    const message = JSON.stringify(sensorData);

    this.client.publish(topic, message, (err) => {
      if (err) {
        console.error(`❌ Failed to publish to ${topic}:`, err);
      } else {
        console.log(`📡 Published to ${topic}:`, {
          deviceId: device.deviceId,
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          powerUsage: sensorData.powerUsage,
        });
      }
    });

    // Occasionally publish individual sensor readings
    if (Math.random() < 0.3) {
      this.publishIndividualReadings(device, sensorData);
    }

    // Occasionally publish device status
    if (Math.random() < 0.1) {
      this.publishDeviceStatus(device);
    }
  }

  private publishIndividualReadings(
    device: DeviceConfig,
    sensorData: SensorData
  ): void {
    // Publish temperature
    const tempTopic = `iot/sensor/${device.deviceId}/temperature`;
    const tempMessage = JSON.stringify({
      temperature: sensorData.temperature,
      location: device.location,
      timestamp: sensorData.timestamp,
    });
    this.client.publish(tempTopic, tempMessage);

    // Publish humidity
    const humidityTopic = `iot/sensor/${device.deviceId}/humidity`;
    const humidityMessage = JSON.stringify({
      humidity: sensorData.humidity,
      location: device.location,
      timestamp: sensorData.timestamp,
    });
    this.client.publish(humidityTopic, humidityMessage);

    // Publish power usage
    const powerTopic = `iot/sensor/${device.deviceId}/power`;
    const powerMessage = JSON.stringify({
      powerUsage: sensorData.powerUsage,
      location: device.location,
      timestamp: sensorData.timestamp,
    });
    this.client.publish(powerTopic, powerMessage);
  }

  private publishDeviceStatus(device: DeviceConfig): void {
    const statusTopic = `iot/device/${device.deviceId}/status`;
    const status = {
      status: Math.random() > 0.95 ? "error" : "online",
      battery: Math.round(Math.random() * 100),
      signalStrength: Math.round(Math.random() * 100),
      lastSeen: new Date(),
      location: device.location,
    };

    this.client.publish(statusTopic, JSON.stringify(status));
    console.log(
      `📊 Published device status for ${device.deviceId}:`,
      status.status
    );
  }

  private startSimulation(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("🚀 Starting IoT sensor simulation...");
    console.log(`📱 Simulating ${this.devices.length} devices`);
    console.log("⏰ Publishing data every 5 seconds");
    console.log("Press Ctrl+C to stop the simulation\n");

    this.interval = setInterval(() => {
      this.devices.forEach((device) => {
        this.publishSensorData(device);
      });
    }, 5000);

    // Publish initial data immediately
    this.devices.forEach((device) => {
      this.publishSensorData(device);
    });
  }

  private stopSimulation(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log("🛑 Simulation stopped");
  }

  public disconnect(): void {
    this.stopSimulation();
    this.client.end();
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  if (simulator) {
    simulator.disconnect();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  if (simulator) {
    simulator.disconnect();
  }
  process.exit(0);
});

// Start the simulator
const simulator = new MqttSimulator();
