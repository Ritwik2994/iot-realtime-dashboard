import { NestFactory } from '@nestjs/core';
import { HttpStatus, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import * as hpp from 'hpp';
import * as xssClean from 'xss-clean';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import * as bodyParser from 'body-parser';

import { AppModule } from './app.module';
import { swaggerMiddleware } from './shared/swagger/swagger';
import { HttpExceptionFilter } from './shared/core/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    bodyParser: true,
    logger: ['error', 'fatal', 'log', 'verbose', 'warn', 'debug'],
  });

  const configService = app.get<ConfigService>(ConfigService);
  const envApp = configService.get<string>('NODE_ENV');
  const port = configService.get<string>('PORT') || 3000;
  const wsPort = configService.get<string>('WS_PORT') || 3001;
  app.setGlobalPrefix('/api');

  const isExcludedEnv: boolean = ['development', 'staging'].includes(envApp);

  app.use(bodyParser.json());
  app.use(bodyParser.text({ type: 'text/plain' }));

  /**
   * helmet middleware to set various security headers in a production environment.
   * It also sets a content security policy with custom directives to control which resources are allowed to be loaded.
   * Helmet will not work with playground, so if the env = production then playground should get disabled
   */
  if (envApp === 'prod') {
    app.use(
      helmet({
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'", 'https://polyfill.io', 'https://*.cloudflare.com'],
            scriptSrc: ["'self'", 'https://polyfill.io', 'https://*.cloudflare.com'],
            styleSrc: ["'self'", 'https:'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            fontSrc: ["'self'", 'https:', 'data:'],
            childSrc: ["'self'", 'blob:'],
            frameSrc: ["'self'"],
            frameAncestors: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: true,
        crossOriginOpenerPolicy: true,
        crossOriginResourcePolicy: true,
        dnsPrefetchControl: true,
        // hsts: true,
        hidePoweredBy: true,
        ieNoOpen: true,
        noSniff: true,
        originAgentCluster: true,
        permittedCrossDomainPolicies: {
          permittedPolicies: 'by-content-type',
        },
        referrerPolicy: {
          policy: 'same-origin',
        },
        xssFilter: true,
        // xFrameOptions: { action: 'deny' },
        frameguard: { action: 'deny' },
        hsts: {
          maxAge: 31536000, // 1 year in seconds
          includeSubDomains: true,
          preload: true,
        },
      }),
    );
  }

  app.use(compression()); // Compression Settings
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.getHttpAdapter().getInstance().disable('Server');
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: HttpStatus.PRECONDITION_FAILED,
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });

  app.use(cookieParser());
  app.use(compression());
  app.use(json({ limit: '500kb' }));
  app.use(urlencoded({ extended: true, limit: '500kb' }));
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const ignoreMethods = isExcludedEnv
    ? ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'POST', 'PATCH', 'PUT'] // for development we ignoring all
    : ['GET', 'HEAD', 'OPTIONS', 'DELETE'];
  app.use(
    csurf({
      cookie: { httpOnly: true, secure: true },
      ignoreMethods,
    }),
  );

  app.use(xssClean()); // XSS Filter
  app.use(hpp()); // Prevent http Parameter pollution
  app.useGlobalFilters(new HttpExceptionFilter()); // global try catch

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  // swagger middleware
  if (envApp !== 'prod') {
    swaggerMiddleware(app);
  }

  app.listen(port, () => {
    Logger.log(`${envApp} Server is running on: http://localhost:${port}`, `Application Server`);
    Logger.log(`WebSocket server is running on: ws://localhost:${wsPort}`, 'Websocket Server');
    Logger.log(`http://localhost:${port}/docs`, `Swagger API Docs`);
  });
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
