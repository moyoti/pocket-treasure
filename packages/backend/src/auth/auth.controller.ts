import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { OAuthLoginDto } from './dto/oauth-login.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  async oauthLogin(@Body() oauthDto: OAuthLoginDto) {
    return this.authService.oauthLogin(oauthDto);
  }

  @Post('wechat-login')
  @HttpCode(HttpStatus.OK)
  async wechatLogin(@Body() wechatLoginDto: WechatLoginDto) {
    return this.authService.wechatLogin(wechatLoginDto);
  }
}