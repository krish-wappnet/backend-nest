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
    description: 'Access and refresh tokens',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
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
  @Get('me')
  me(@Req() req: { user: AuthUser }) {
    return req.user;
  }
}
