import { Module } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { RbacController } from './rbac.controller';

@Module({
  controllers: [RbacController],
  providers: [JwtGuard, RolesGuard],
})
export class RbacModule {}
