/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';

describe('AchievementController', () => {
  let controller: AchievementController;
  let achievementService: AchievementService;

  const mockAchievementService = {
    getAllAchievements: jest.fn(),
    getUserAchievements: jest.fn(),
    claimAchievement: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AchievementController],
      providers: [
        {
          provide: AchievementService,
          useValue: mockAchievementService,
        },
      ],
    }).compile();

    controller = module.get<AchievementController>(AchievementController);
    achievementService = module.get<AchievementService>(AchievementService);

    jest.clearAllMocks();
  });

  describe('getAllAchievements', () => {
    it('should return all achievements', async () => {
      const achievements = [{ id: 'ach-1', name: 'First Collect' }];
      mockAchievementService.getAllAchievements.mockResolvedValue(achievements);

      const result = await controller.getAllAchievements();

      expect(achievementService.getAllAchievements).toHaveBeenCalled();
      expect(result).toEqual(achievements);
    });
  });

  describe('getUserAchievements', () => {
    it('should return user achievements', async () => {
      const progress = [{ achievement: { id: 'ach-1' }, progress: 5 }];
      mockAchievementService.getUserAchievements.mockResolvedValue(progress);

      const result = await controller.getUserAchievements({ user: { id: 'user-1' } });

      expect(achievementService.getUserAchievements).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(progress);
    });
  });

  describe('claimAchievement', () => {
    it('should claim achievement reward', async () => {
      const claimResult = {
        success: true,
        rewards: { coins: 10, experience: 5 },
        newCoins: 110,
        newExperience: 55,
        newLevel: 1,
      };
      mockAchievementService.claimAchievement.mockResolvedValue(claimResult);

      const result = await controller.claimAchievement(
        { user: { id: 'user-1' } },
        'ach-1',
      );

      expect(achievementService.claimAchievement).toHaveBeenCalledWith('user-1', 'ach-1');
      expect(result).toEqual(claimResult);
    });
  });
});
