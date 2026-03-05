/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 'test-uuid-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    username: 'testuser',
    avatar: undefined,
    googleId: undefined,
    appleId: undefined,
    isVerified: false,
    role: 'user',
    inventoryItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'UserRepository',
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideProvider('UserRepository')
      .useValue(mockRepository)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>('UserRepository');
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
    };

    it('should register a new user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = await authService.register(registerDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: registerDto.email }, { username: registerDto.username }],
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: expect.any(String),
        username: registerDto.username,
        isVerified: false,
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ user: mockUser, token: 'test-jwt-token' });
    });

    it('should throw UnauthorizedException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.register(registerDto)).rejects.toThrow(
        'Email or username already exists',
      );
    });

    it('should throw UnauthorizedException if username already exists', async () => {
      const existingUser = { ...mockUser, email: 'other@example.com' } as User;
      mockRepository.findOne.mockResolvedValue(existingUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should hash password before saving', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const bcryptSpy = jest.spyOn(bcrypt, 'hash');
      await authService.register(registerDto);

      expect(bcryptSpy).toHaveBeenCalledWith(registerDto.password, 10);
      bcryptSpy.mockRestore();
    });
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should return user if credentials are valid', async () => {
      const userWithPassword = { ...mockUser, password: 'hashedPassword123' } as User;
      mockRepository.findOne.mockResolvedValue(userWithPassword);

      const result = await authService.validateUser(email, password);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(userWithPassword);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.validateUser(email, password)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if user has no password (OAuth user)', async () => {
      const oauthUser = { ...mockUser, password: undefined } as User;
      mockRepository.findOne.mockResolvedValue(oauthUser);

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.validateUser(email, password)).rejects.toThrow(
        'Please use OAuth login',
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const userWithWrongPassword = {
        ...mockUser,
        password: 'wrongHashedPassword',
      } as User;
      mockRepository.findOne.mockResolvedValue(userWithWrongPassword);
      (bcrypt.compare as jest.Mock).mockReturnValue(false);

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.validateUser(email, password)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('login', () => {
    it('should return user and token on successful login', async () => {
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = await authService.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({ user: mockUser, token: 'test-jwt-token' });
    });
  });

  describe('oauthLogin', () => {
    const oauthDto = {
      provider: 'google' as const,
      providerId: 'google-123456',
      email: 'oauth@example.com',
      username: 'oauthuser',
      avatar: 'https://example.com/avatar.jpg',
    };

    it('should login with Google OAuth and create new user', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const newUser = {
        ...mockUser,
        googleId: oauthDto.providerId,
        email: oauthDto.email,
        username: oauthDto.username,
        avatar: oauthDto.avatar,
        isVerified: true,
      } as User;
      mockRepository.create.mockReturnValue(newUser);
      mockRepository.save.mockResolvedValue(newUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = await authService.oauthLogin(oauthDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { googleId: oauthDto.providerId },
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        email: oauthDto.email,
        username: oauthDto.username,
        avatar: oauthDto.avatar,
        googleId: oauthDto.providerId,
        appleId: undefined,
        isVerified: true,
      });
      expect(result).toEqual({ user: newUser, token: 'test-jwt-token' });
    });

    it('should login with Apple OAuth and create new user', async () => {
      const appleDto = {
        provider: 'apple' as const,
        providerId: 'apple-123456',
        email: 'oauth@example.com',
        username: 'oauthuser',
        avatar: 'https://example.com/avatar.jpg',
      };

      mockRepository.findOne.mockResolvedValue(null);
      const newUser = {
        ...mockUser,
        appleId: appleDto.providerId,
        email: appleDto.email,
        username: appleDto.username,
        avatar: appleDto.avatar,
        isVerified: true,
      } as User;
      mockRepository.create.mockReturnValue(newUser);
      mockRepository.save.mockResolvedValue(newUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = await authService.oauthLogin(appleDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { appleId: appleDto.providerId },
      });
      expect(result).toEqual({ user: newUser, token: 'test-jwt-token' });
    });

    it('should throw UnauthorizedException for invalid OAuth provider', async () => {
      const invalidDto = {
        provider: 'facebook' as any,
        providerId: 'facebook-123',
      };

      await expect(authService.oauthLogin(invalidDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.oauthLogin(invalidDto)).rejects.toThrow(
        'Invalid OAuth provider',
      );
    });

    it('should find existing user by OAuth provider ID', async () => {
      const existingOauthUser = {
        ...mockUser,
        googleId: oauthDto.providerId,
        email: oauthDto.email,
        avatar: undefined,
      } as User;
      mockRepository.findOne.mockResolvedValue(existingOauthUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = await authService.oauthLogin(oauthDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { googleId: oauthDto.providerId },
      });
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ user: existingOauthUser, token: 'test-jwt-token' });
    });

    it('should find existing user by email if no OAuth ID match', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      const result = await authService.oauthLogin(oauthDto);

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ user: mockUser, token: 'test-jwt-token' });
    });

    it('should update user OAuth ID if not set', async () => {
      const userWithoutOAuthId = {
        ...mockUser,
        googleId: undefined,
        email: oauthDto.email,
      } as User;
      const updatedUser = {
        ...userWithoutOAuthId,
        googleId: oauthDto.providerId,
      } as User;

      mockRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(userWithoutOAuthId);
      mockRepository.save.mockResolvedValue(updatedUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      await authService.oauthLogin(oauthDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: oauthDto.providerId,
        }),
      );
    });

    it('should update user avatar if not set', async () => {
      const userWithoutAvatar = {
        ...mockUser,
        googleId: oauthDto.providerId,
        avatar: undefined,
        email: oauthDto.email,
      } as User;

      mockRepository.findOne.mockResolvedValue(userWithoutAvatar);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      await authService.oauthLogin(oauthDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar: oauthDto.avatar,
        }),
      );
    });

    it('should create placeholder email if email is not provided', async () => {
      const oauthDtoNoEmail = {
        provider: 'google' as const,
        providerId: 'google-123456',
      };

      mockRepository.findOne.mockResolvedValue(null);
      const newUser = {
        ...mockUser,
        googleId: oauthDtoNoEmail.providerId,
        email: `${oauthDtoNoEmail.providerId}@google.placeholder`,
        username: `google_${oauthDtoNoEmail.providerId.slice(0, 8)}`,
        isVerified: true,
      } as User;
      mockRepository.create.mockReturnValue(newUser);
      mockRepository.save.mockResolvedValue(newUser);
      mockJwtService.sign.mockReturnValue('test-jwt-token');

      await authService.oauthLogin(oauthDtoNoEmail);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: `${oauthDtoNoEmail.providerId}@google.placeholder`,
        }),
      );
    });
  });

  describe('validateUserById', () => {
    it('should return user if found by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.validateUserById(mockUser.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by ID', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await authService.validateUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
