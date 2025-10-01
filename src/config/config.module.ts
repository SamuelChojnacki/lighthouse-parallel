import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Import AuthModule for TokenGuard and JwtService
  controllers: [ConfigController],
})
export class ConfigurationModule {}
