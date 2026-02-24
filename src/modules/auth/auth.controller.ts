import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { JwtGuard } from './jwt.guard';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

type AuthUser = {
  userId: string;
  email: string;
};

type RequestWithIp = {
  ip?: string;
};

type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({
    description: 'Registration created; OTP sent to email',
    schema: {
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Verify email OTP' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiOkResponse({
    schema: {
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    await this.authService.verifyOtp(dto);
    return { message: 'Email verified successfully' };
  }

  @ApiOperation({ summary: 'Resend email OTP' })
  @ApiBody({ type: ResendOtpDto })
  @ApiOkResponse({
    schema: {
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    await this.authService.resendOtp(dto.email);
    return { message: 'OTP sent to email' };
  }

  @ApiOperation({ summary: 'Login and get tokens' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Access and refresh tokens',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: RequestWithIp) {
    const result: Promise<AuthTokensResponse> = this.authService.login({
      ...dto,
      ip: req.ip ?? null,
    });
    return result;
  }

  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user from access token' })
  @ApiOkResponse({
    schema: {
      properties: {
        userId: { type: 'string' },
        email: { type: 'string' },
      },
    },
  })
  @Get('profile')
  me(@Req() req: { user: AuthUser }) {
    return req.user;
  }
}
