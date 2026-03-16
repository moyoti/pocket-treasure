/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    avatar: 'avatar.png',
    coins: 100,
    experience: 50,
    level: 1,
    loginStreak: 5,
  } as User;

  const mockUserService = {
    findById: jest.fn(),
    getUserStats: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return the current user', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser({ user: { id: 'user-1' } });

      expect(userService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserStats', () => {
    it('should return user stats', async () => {
      const stats = {
        coins: 100,
        experience: 50,
        level: 1,
        loginStreak: 5,
        collectionCount: 20,
      };
      mockUserService.getUserStats.mockResolvedValue(stats);

      const result = await controller.getUserStats({ user: { id: 'user-1' } });

      expect(userService.getUserStats).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(stats);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { username: 'newname' };
      const updatedUser = { ...mockUser, username: 'newname' };
      mockUserService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(
        { user: { id: 'user-1' } },
        updateDto,
      );

      expect(userService.updateProfile).toHaveBeenCalledWith('user-1', updateDto);
      expect(result.username).toBe('newname');
    });
  });
});
