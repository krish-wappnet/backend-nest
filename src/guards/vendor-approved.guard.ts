import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { UserRole } from '../modules/users/user.entity';
import { VendorStatus } from '../modules/users/vendor-status.enum';

type JwtUser = {
  userId?: string;
  role?: UserRole;
};

@Injectable()
export class VendorApprovedGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const userId = request.user?.userId;
    const role = request.user?.role;

    if (!userId) {
      throw new ForbiddenException('User is missing');
    }

    if (role !== UserRole.USER) {
      throw new ForbiddenException('Vendor access requires USER role');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.isVendor) {
      throw new ForbiddenException('Vendor access required');
    }

    if (user.vendorStatus !== VendorStatus.APPROVED) {
      throw new ForbiddenException('Vendor is not approved');
    }

    return true;
  }
}
