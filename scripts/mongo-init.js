// MongoDB initialization script
db = db.getSiblingDB('iot-dashboard');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('sensordata');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.sensordata.createIndex({ "deviceId": 1, "timestamp": -1 });
db.sensordata.createIndex({ "timestamp": -1 });
db.sensordata.createIndex({ "isAlert": 1 });
db.sensordata.createIndex({ "location": 1 });

// Create admin user
db.users.insertOne({
  email: "admin@iot-dashboard.com",
  username: "admin",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8e", // password: admin123
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create regular user
db.users.insertOne({
  email: "user@iot-dashboard.com",
  username: "user",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8e", // password: user123
  role: "user",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("MongoDB initialization completed successfully!");
