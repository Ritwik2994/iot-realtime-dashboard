import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GraphQLThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // For GraphQL context, try to get IP from headers
    if (req.headers && req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for'].split(',')[0].trim();
    }

    if (req.headers && req.headers['x-real-ip']) {
      return req.headers['x-real-ip'];
    }

    if (req.ip) {
      return req.ip;
    }

    // Fallback to a default tracker if IP is not available
    return 'unknown';
  }

  protected getRequestResponse(context: ExecutionContext) {
    try {
      const gqlContext = GqlExecutionContext.create(context);
      const { req, res } = gqlContext.getContext();
      return { req, res };
    } catch (error) {
      // If GraphQL context fails, fall back to HTTP context
      const req = context.switchToHttp().getRequest();
      const res = context.switchToHttp().getResponse();
      return { req, res };
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      return true;
    }
  }
}
