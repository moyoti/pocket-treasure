import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Req, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { OAuthLoginDto } from './dto/oauth-login.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
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
  async wechatLogin(
    @Body() wechatLoginDto: WechatLoginDto,
    @Req() req: any,
  ) {
    // 打印所有 x-wx 相关请求头用于调试
    const wxHeaders = Object.entries(req.headers)
      .filter(([k]) => k.startsWith('x-wx'))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    this.logger.log(`WeChat login headers: ${JSON.stringify(wxHeaders)}`);

    const cloudOpenId = req.headers['x-wx-openid'];

    // 云托管环境：wx.cloud.callContainer 自动注入 X-WX-OPENID
    if (cloudOpenId) {
      this.logger.log(`Using cloud openid: ${cloudOpenId.slice(0, 6)}...`);
      return this.authService.wechatLoginByOpenId(cloudOpenId);
    }

    // 本地开发环境：通过 code 换取 openid
    this.logger.log('No X-WX-OPENID header, falling back to code exchange');
    try {
      return await this.authService.wechatLogin(wechatLoginDto);
    } catch (error) {
      // 如果 code 换取 openid 失败（如容器无法出网），使用 dev 模式 mock 登录
      this.logger.warn(`WeChat code exchange failed: ${error.message}`);
      if (wechatLoginDto.code) {
        this.logger.log('Falling back to dev mock login with code as mock openid');
        const mockOpenId = `dev_${wechatLoginDto.code}`;
        return this.authService.wechatLoginByOpenId(mockOpenId);
      }
      throw error;
    }
  }
}