import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './vendor.entity';
import { VendorStatus } from '../users/vendor-status.enum';

@Injectable()
export class VendorsRepository {
  constructor(
    @InjectRepository(Vendor)
    private readonly repo: Repository<Vendor>,
  ) {}

  findByUserId(userId: string): Promise<Vendor | null> {
    return this.repo.findOne({ where: { userId } });
  }

  findById(id: string): Promise<Vendor | null> {
    return this.repo.findOne({ where: { id } });
  }

  async updateStatus(params: { vendorId: string; status: VendorStatus }) {
    await this.repo.update({ id: params.vendorId }, { status: params.status });
  }

  async createVendor(params: {
    userId: string;
    storeName: string;
    storeSlug: string;
    businessEmail: string;
    phone: string;
    status?: VendorStatus;
  }): Promise<Vendor> {
    const entity = this.repo.create({
      userId: params.userId,
      storeName: params.storeName,
      storeSlug: params.storeSlug,
      businessEmail: params.businessEmail,
      phone: params.phone,
      status: params.status ?? VendorStatus.PENDING,
    });
    return this.repo.save(entity);
  }
}
