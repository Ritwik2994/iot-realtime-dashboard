import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cors from 'cors';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly EXCLUDED_CORS_ENV = ['dev', 'development', 'qa', 'prod'];
  private readonly ALLOWED_METHODS = ['GET', 'POST'];
  private readonly EXCLUDED_CORS_ROUTES = [];

  constructor(private readonly configService: ConfigService) {}

  private readonly corsOptions = {
    credentials: true,
    origin: this.EXCLUDED_CORS_ENV.includes(this.configService.get('NODE_ENV'))
      ? '*'
      : (origin, callback) => {
          console.log('🚀 ~ file: cors.middleware.ts ~ origin:', origin);

          if (!origin || !this.isOriginAllowed(origin)) {
            throw new Error('Not allowed by CORS');
          } else {
            callback(null, true);
          }
        },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  use(req: Request, res: Response, next: NextFunction) {
    const isExcludedRoute = this.EXCLUDED_CORS_ROUTES.some(
      route => req['originalUrl'].includes(route) && this.ALLOWED_METHODS.includes(req.method),
    );

    if (isExcludedRoute) {
      // If it's an excluded route, skip CORS handling
      next();
    } else {
      // Apply CORS middleware for other routes
      cors(this.corsOptions)(req, res, next);
    }
  }

  private isOriginAllowed(origin: string): boolean {
    const allowedDomains = this.configService.get('ALLOWED_DOMAINS');
    const whitelist = allowedDomains.split(',');
    return whitelist.includes(origin);
  }
}
