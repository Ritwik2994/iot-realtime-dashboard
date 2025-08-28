import { Injectable, NestMiddleware } from '@nestjs/common';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class UserAgentMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const parser = new UAParser();
    const userAgent = req.headers['user-agent'];
    req.userAgent = parser.setUA(userAgent).getResult();
    req.clientIp = req.headers['x-real-ip'];
    next();
  }
}
