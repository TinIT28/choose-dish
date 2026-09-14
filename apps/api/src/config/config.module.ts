import { Global, Module } from '@nestjs/common';
import { AppConfig, appConfig } from './app-config';

@Global()
@Module({
  providers: [{ provide: AppConfig, useFactory: () => appConfig() }],
  exports: [AppConfig],
})
export class AppConfigModule {}
