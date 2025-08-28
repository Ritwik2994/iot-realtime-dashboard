import { Global, Module } from '@nestjs/common';
import { HelperService } from './helper.service';
import { ResponseHandler } from './response-handler/response-handler.service';

@Global()
@Module({
  providers: [HelperService, ResponseHandler],
  exports: [HelperService, ResponseHandler],
})
export class HelperModule {}
