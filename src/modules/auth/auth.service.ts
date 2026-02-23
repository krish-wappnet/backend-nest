import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserStatus } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(params: {
    email: string;
    password: string;
    firstName?: string | null;
    lastName?: string | null;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const passwordHash = await bcrypt.hash(params.password, 12);
    const user = await this.usersService.createUser({
      email: params.email,
      passwordHash,
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
    });

    return this.issueTokens({ userId: user.id, email: user.email });
  }

  async login(params: {
    email: string;
    password: string;
    ip?: string | null;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findByEmail(params.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new ForbiddenException('Account is locked');
    }

    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) {
      await this.usersService.recordFailedLogin({ userId: user.id });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLoginSuccess({
      userId: user.id,
      ip: params.ip ?? null,
    });

    return this.issueTokens({
      userId: user.id,
      email: user.email,
    });
  }

  private async issueTokens(params: {
    userId: string;
    email: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(
      { sub: params.userId, email: params.email },
      {
        secret: this.getRequired('JWT_ACCESS_SECRET'),
        expiresIn: '1d',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: params.userId, email: params.email },
      {
        secret: this.getRequired('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  private getRequired(key: string): string {
    const val = this.configService.get<string>(key);
    if (!val) {
      throw new Error(`${key} is not configured`);
    }
    return val;
  }
}
