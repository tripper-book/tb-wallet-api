import { Global, Module } from '@nestjs/common';
import { TbBackendService } from './tb-backend.service';

@Global()
@Module({
  providers: [TbBackendService],
  exports: [TbBackendService],
})
export class AuthModule {}
