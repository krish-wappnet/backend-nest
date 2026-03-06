import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt.guard';
import { UserRole } from '../users/user.entity';
import { Roles } from '../../guards/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';

@ApiTags('RBAC')
@Controller('rbac')
export class RbacController {
  @ApiOperation({ summary: 'Public endpoint (no auth)' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @Get('public')
  publicRoute() {
    return { message: 'public' };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'USER-only endpoint' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @Get('user')
  userRoute() {
    return { message: 'user' };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'ADMIN-only endpoint' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @Get('admin')
  adminRoute() {
    return { message: 'admin' };
  }
}
