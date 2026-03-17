import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { OAuthLoginDto } from './dto/oauth-login.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { LUCKY_VALUE_CONFIG } from '@treasure-hunt/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: User; token: string }> {
    const { email, password, username } = registerDto;
    this.logger.debug(`Attempting to register user: ${email}`);

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      this.logger.warn(`Registration failed: email or username already exists - ${email}`);
      throw new UnauthorizedException('Email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      username,
      isVerified: false,
      luckyPoints: 0,
      loginStreak: 0,
    });

    await this.userRepository.save(user);
    this.logger.log(`User registered successfully: ${email}`);

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  async validateUser(email: string, password: string): Promise<User> {
    this.logger.debug(`Validating user: ${email}`);

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      this.logger.warn(`Validation failed: user not found - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      this.logger.warn(`Validation failed: OAuth user trying password login - ${email}`);
      throw new UnauthorizedException('Please use OAuth login');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Validation failed: invalid password - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`User validated successfully: ${email}`);
    return user;
  }

  async login(user: User): Promise<{ user: User; token: string }> {
    this.logger.debug(`Generating login token for user: ${user.email}`);

    // Update login streak and lucky points
    await this.updateLoginStreakAndLuckyPoints(user);

    const token = this.generateToken(user);

    // Reload user to get updated values
    const updatedUser = await this.userRepository.findOne({ where: { id: user.id } });
    return { user: updatedUser!, token };
  }

  private async updateLoginStreakAndLuckyPoints(user: User): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;

    let newStreak = user.loginStreak || 0;

    if (!lastLogin) {
      // First login
      newStreak = 1;
    } else {
      const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
      const diffDays = Math.floor((today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, no change to streak
        return;
      } else if (diffDays === 1) {
        // Consecutive day
        newStreak = user.loginStreak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    // Calculate lucky points based on streak
    const luckyPoints = this.calculateLuckyPoints(newStreak);

    await this.userRepository.update(user.id, {
      loginStreak: newStreak,
      luckyPoints,
      lastLoginDate: now,
    });

    this.logger.debug(`Updated user ${user.email}: streak=${newStreak}, luckyPoints=${luckyPoints}`);
  }

  private calculateLuckyPoints(streak: number): number {
    let bonus = 0;

    // Find the highest applicable bonus
    const sortedBonuses = [...LUCKY_VALUE_CONFIG.streakBonuses].sort((a, b) => b.days - a.days);
    for (const streakBonus of sortedBonuses) {
      if (streak >= streakBonus.days) {
        bonus = streakBonus.bonus;
        break;
      }
    }

    return Math.min(bonus, LUCKY_VALUE_CONFIG.maxLuckyValue);
  }

  async oauthLogin(oauthDto: OAuthLoginDto): Promise<{ user: User; token: string }> {
    const { provider, providerId, email, username, avatar } = oauthDto;
    this.logger.debug(`OAuth login attempt: ${provider} - ${providerId}`);

    let user: User | null;

    // Find existing user by provider ID
    if (provider === 'google') {
      user = await this.userRepository.findOne({ where: { googleId: providerId } });
    } else if (provider === 'apple') {
      user = await this.userRepository.findOne({ where: { appleId: providerId } });
    } else {
      this.logger.warn(`Invalid OAuth provider: ${provider}`);
      throw new UnauthorizedException('Invalid OAuth provider');
    }

    if (!user && email) {
      // Try to find by email
      user = await this.userRepository.findOne({ where: { email } });
    }

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        email: email || `${providerId}@${provider}.placeholder`,
        username: username || `${provider}_${providerId.slice(0, 8)}`,
        avatar,
        googleId: provider === 'google' ? providerId : undefined,
        appleId: provider === 'apple' ? providerId : undefined,
        isVerified: true,
        luckyPoints: 0,
        loginStreak: 1,
        lastLoginDate: new Date(),
      });
      await this.userRepository.save(user);
      this.logger.log(`New user created via ${provider} OAuth: ${user.email}`);
    } else {
      // Update provider ID if not set
      if (provider === 'google' && !user.googleId) {
        user.googleId = providerId;
      } else if (provider === 'apple' && !user.appleId) {
        user.appleId = providerId;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }

      // Update login streak
      await this.updateLoginStreakAndLuckyPoints(user);

      await this.userRepository.save(user);
      this.logger.debug(`Existing user logged in via ${provider} OAuth: ${user.email}`);
    }

    const token = this.generateToken(user);

    // Reload user to get updated values
    const updatedUser = await this.userRepository.findOne({ where: { id: user.id } });
    return { user: updatedUser!, token };
  }

  async wechatLogin(wechatLoginDto: WechatLoginDto): Promise<{ user: User; token: string }> {
    const { code } = wechatLoginDto;
    this.logger.debug(`WeChat login attempt with code: ${code.slice(0, 6)}...`);

    const appId = this.configService.get<string>('wechat.appId');
    const secret = this.configService.get<string>('wechat.secret');

    if (!appId || !secret) {
      this.logger.error('WeChat AppID or Secret not configured');
      throw new UnauthorizedException('WeChat login is not configured');
    }

    // Exchange code for openid via WeChat jscode2session API
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    let openid: string;
    try {
      // Use Node.js built-in https module for better compatibility in Docker containers
      const https = await import('https');
      const data: any = await new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let body = '';
          res.on('data', (chunk: string) => body += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(new Error(`Failed to parse response: ${body.slice(0, 200)}`)); }
          });
        }).on('error', (err: Error) => reject(err));
      });

      this.logger.debug(`WeChat API response: ${JSON.stringify(data)}`);

      if (data.errcode) {
        this.logger.warn(`WeChat API error: ${data.errcode} - ${data.errmsg}`);
        throw new UnauthorizedException(`WeChat login failed: ${data.errmsg}`);
      }

      openid = data.openid;
      if (!openid) {
        throw new UnauthorizedException('WeChat login failed: no openid returned');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`WeChat API request failed: ${error}`);
      throw new UnauthorizedException(`WeChat login failed: ${error instanceof Error ? error.message : 'network error'}`);
    }

    // Find or create user by openid
    let user = await this.userRepository.findOne({ where: { wechatOpenId: openid } });

    if (!user) {
      // Generate random username
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const username = `探险家${randomSuffix}`;

      user = this.userRepository.create({
        email: `wx_${openid.slice(0, 12)}@wechat.placeholder`,
        username,
        wechatOpenId: openid,
        isVerified: true,
        luckyPoints: 0,
        loginStreak: 1,
        lastLoginDate: new Date(),
      });
      await this.userRepository.save(user);
      this.logger.log(`New user created via WeChat: ${username}`);
    } else {
      // Update login streak for existing user
      await this.updateLoginStreakAndLuckyPoints(user);
      this.logger.debug(`Existing user logged in via WeChat: ${user.username}`);
    }

    const token = this.generateToken(user);
    const updatedUser = await this.userRepository.findOne({ where: { id: user.id } });
    return { user: updatedUser!, token };
  }

  /**
   * 云托管环境直接通过 openid 登录（X-WX-OPENID 由平台注入）
   */
  async wechatLoginByOpenId(openid: string): Promise<{ user: User; token: string }> {
    this.logger.debug(`WeChat cloud login with openid: ${openid.slice(0, 6)}...`);

    if (!openid) {
      throw new UnauthorizedException('WeChat login failed: no openid');
    }

    let user = await this.userRepository.findOne({ where: { wechatOpenId: openid } });

    if (!user) {
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const username = `探险家${randomSuffix}`;

      user = this.userRepository.create({
        email: `wx_${openid.slice(0, 12)}@wechat.placeholder`,
        username,
        wechatOpenId: openid,
        isVerified: true,
        luckyPoints: 0,
        loginStreak: 1,
        lastLoginDate: new Date(),
      });
      await this.userRepository.save(user);
      this.logger.log(`New user created via WeChat cloud: ${username}`);
    } else {
      await this.updateLoginStreakAndLuckyPoints(user);
      this.logger.debug(`Existing user logged in via WeChat cloud: ${user.username}`);
    }

    const token = this.generateToken(user);
    const updatedUser = await this.userRepository.findOne({ where: { id: user.id } });
    return { user: updatedUser!, token };
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}