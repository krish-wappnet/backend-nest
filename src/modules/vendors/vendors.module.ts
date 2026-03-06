import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from './vendor.entity';
import { VendorsRepository } from './vendors.repository';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor]), UsersModule],
  controllers: [VendorsController],
  providers: [VendorsRepository, VendorsService],
  exports: [VendorsService, VendorsRepository],
})
export class VendorsModule {}
