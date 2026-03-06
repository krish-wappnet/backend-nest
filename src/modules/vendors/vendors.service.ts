import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VendorsRepository } from './vendors.repository';
import { Vendor } from './vendor.entity';
import { UsersService } from '../users/users.service';
import { ApplyVendorDto } from './dto/apply-vendor.dto';
import { VendorStatus } from '../users/vendor-status.enum';
import { slugify } from '../products/utils/slugify';

@Injectable()
export class VendorsService {
  constructor(
    private readonly vendorsRepository: VendorsRepository,
    private readonly usersService: UsersService,
  ) {}

  async getByUserIdOrThrow(userId: string): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async applyVendor(params: { userId: string; dto: ApplyVendorDto }) {
    const existing = await this.vendorsRepository.findByUserId(params.userId);

    if (existing) {
      throw new ConflictException('Vendor profile already exists');
    }

    const vendor = await this.vendorsRepository.createVendor({
      userId: params.userId,
      storeName: params.dto.storeName,
      storeSlug: slugify(params.dto.storeSlug),
      businessEmail: params.dto.businessEmail,
      phone: params.dto.phone,
      status: VendorStatus.PENDING,
    });

    await this.usersService.updateVendorFlags({
      userId: params.userId,
      isVendor: true,
      vendorStatus: VendorStatus.PENDING,
    });

    return vendor;
  }

  async adminUpdateVendorStatus(params: {
    vendorId: string;
    status: VendorStatus;
  }): Promise<void> {
    const vendor = await this.vendorsRepository.findById(params.vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await this.vendorsRepository.updateStatus({
      vendorId: params.vendorId,
      status: params.status,
    });

    await this.usersService.updateVendorFlags({
      userId: vendor.userId,
      isVendor: params.status === VendorStatus.APPROVED,
      vendorStatus: params.status,
    });
  }
}
