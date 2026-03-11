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
    storeAddress: string;
    latitude: number;
    longitude: number;
    status?: VendorStatus;
  }): Promise<Vendor> {
    const entity = this.repo.create({
      userId: params.userId,
      storeName: params.storeName,
      storeSlug: params.storeSlug,
      businessEmail: params.businessEmail,
      phone: params.phone,
      storeAddress: params.storeAddress,
      latitude: params.latitude,
      longitude: params.longitude,
      status: params.status ?? VendorStatus.PENDING,
    });
    return this.repo.save(entity);
  }

  async find() {
    return this.repo.find();
  }

  async list(params?: {
    search?: string;
    status?: VendorStatus;
  }): Promise<Vendor[]> {
    const qb = this.repo.createQueryBuilder('vendor');

    if (params?.search) {
      const search = params.search.trim();
      if (search.length > 0) {
        qb.andWhere('vendor.storeName ILIKE :search', {
          search: `%${search}%`,
        });
      }
    }

    if (params?.status !== undefined) {
      qb.andWhere('vendor.status = :status', { status: params.status });
    }

    qb.orderBy('vendor.createdAt', 'DESC');

    return qb.getMany();
  }
}
