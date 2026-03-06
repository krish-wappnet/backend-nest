import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../../guards/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { VendorsService } from './vendors.service';
import { ApplyVendorDto } from './dto/apply-vendor.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';

type AuthUser = {
  userId: string;
  role: UserRole;
};

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Apply to become a vendor (USER)' })
  @ApiBody({ type: ApplyVendorDto })
  @ApiOkResponse({ description: 'Vendor application created (PENDING)' })
  @Post('apply')
  apply(@Body() dto: ApplyVendorDto, @Req() req: { user: AuthUser }) {
    return this.vendorsService.applyVendor({ userId: req.user.userId, dto });
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update vendor status (ADMIN)' })
  @ApiBody({ type: UpdateVendorStatusDto })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVendorStatusDto,
  ) {
    await this.vendorsService.adminUpdateVendorStatus({
      vendorId: id,
      status: dto.status,
    });
    return { message: 'Updated' };
  }
}
