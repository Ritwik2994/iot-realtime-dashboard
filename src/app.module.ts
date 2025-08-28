import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { IotDataModule } from './modules/sensor-data/sensor-data.module';
import { MqttModule } from './modules/mqtt/mqtt.module';
import { UsersModule } from './modules/users/users.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './db/database.module';
import { CorsMiddleware } from './middlewares/cors/cors.middleware';
import { UserAgentMiddleware } from './middlewares/user-agent/user-agent.middleware';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './shared/core/custom-throttler.guard';
import { HelperModule } from './helper/helper.module';
import { config } from './shared/config/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => config],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: +config.get<string>('THROTTLE_TTL'),
          limit: +config.get<string>('THROTTLE_LIMIT'),
        },
      ],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      introspection: true,
      context: ({ req }) => {
        console.log('GraphQL Context - Request received:', {
          hasReq: !!req,
          headers: req?.headers,
          authorization: req?.headers?.authorization,
        });
        return { req, user: req?.user };
      },
      formatError: error => {
        const originalError = error.extensions?.originalError;

        // If we have a structured error from our exception filter, use it
        if (originalError && typeof originalError === 'object' && 'success' in originalError) {
          const structuredError = originalError as any;
          return {
            message: structuredError.message || error.message,
            extensions: {
              code: structuredError.statusCode === 401 ? 'UNAUTHENTICATED' : 'INTERNAL_SERVER_ERROR',
              statusCode: structuredError.statusCode,
              timestamp: structuredError.timestamp,
              success: structuredError.success,
              error: structuredError.error,
              metadata: structuredError.metadata,
            },
          };
        }

        // For other errors, provide a clean format
        return {
          message: error.message,
          extensions: {
            code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
            statusCode: 500,
            timestamp: new Date().toISOString(),
            success: false,
            path: 'GraphQL',
          },
        };
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    IotDataModule,
    WebSocketModule,
    MqttModule,
    HealthModule,
    HelperModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware, UserAgentMiddleware).forRoutes('*');
  }
}
