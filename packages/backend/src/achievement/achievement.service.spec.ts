import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementService, AchievementProgress } from './achievement.service';
import { User } from '../user/entities/user.entity';
import {
  AchievementDefinition,
  AchievementType,
} from './entities/achievement-definition.entity';
import {
  UserAchievement,
  AchievementStatus,
} from './entities/user-achievement.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { ItemRarity } from '../item/entities/item.entity';

describe('AchievementService', () => {
  let service: AchievementService;
  let userRepository: jest.Mocked<Repository<User>>;
  let achievementDefinitionRepository: jest.Mocked<Repository<AchievementDefinition>>;
  let userAchievementRepository: jest.Mocked<Repository<UserAchievement>>;
  let inventoryItemRepository: jest.Mocked<Repository<InventoryItem>>;

  const mockUserId = 'test-user-id';
  const mockAchievementId = 'test-achievement-id';

  // Create separate mock functions for each repository
  const mockQueryBuilder = () => ({
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
  });

  beforeEach(async () => {
    // Create separate mock objects for each repository
    const mockManager = {
      transaction: jest.fn().mockImplementation((cb: any) => cb(mockManager)),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const userMockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder()),
      manager: mockManager,
    };

    const achievementDefMockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder()),
    };

    const userAchievementMockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder()),
    };

    const inventoryMockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        {
          provide: getRepositoryToken(User),
          useValue: userMockRepo,
        },
        {
          provide: getRepositoryToken(AchievementDefinition),
          useValue: achievementDefMockRepo,
        },
        {
          provide: getRepositoryToken(UserAchievement),
          useValue: userAchievementMockRepo,
        },
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: inventoryMockRepo,
        },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
    userRepository = module.get(getRepositoryToken(User));
    achievementDefinitionRepository = module.get(getRepositoryToken(AchievementDefinition));
    userAchievementRepository = module.get(getRepositoryToken(UserAchievement));
    inventoryItemRepository = module.get(getRepositoryToken(InventoryItem));
  });

  describe('getAllAchievements', () => {
    it('should return all achievements', async () => {
      const mockAchievements = [
        {
          id: mockAchievementId,
          name: 'Test Achievement',
          description: 'Test Description',
          icon: '🎯',
          type: AchievementType.COLLECTION,
          requirement: 1,
          tier: 1,
          rewards: { coins: 10, experience: 5 },
          isActive: true,
        },
      ] as AchievementDefinition[];

      achievementDefinitionRepository.count.mockResolvedValue(1);
      achievementDefinitionRepository.find.mockResolvedValue(mockAchievements);

      const result = await service.getAllAchievements();

      expect(result).toEqual(mockAchievements);
    });
  });

  describe('getUserAchievements', () => {
    it('should return user achievement progress', async () => {
      const mockAchievements = [
        {
          id: mockAchievementId,
          name: 'First Collect',
          description: 'Collect first treasure',
          icon: '🎯',
          type: AchievementType.COLLECTION,
          requirement: 1,
          tier: 1,
          rewards: { coins: 10, experience: 5 },
          isActive: true,
        },
      ] as AchievementDefinition[];

      // Mock count to return 1 for all calls
      achievementDefinitionRepository.count.mockResolvedValue(1);
      // Mock find to return achievements
      achievementDefinitionRepository.find.mockResolvedValue(mockAchievements);
      // Mock userAchievementRepository.find
      userAchievementRepository.find.mockResolvedValue([]);
      // Mock inventory count
      inventoryItemRepository.count.mockResolvedValue(5);

      const mockUser = {
        id: mockUserId,
        loginStreak: 3,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserAchievements(mockUserId);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].progress).toBe(5);
      expect(result[0].canClaim).toBe(true);
    });
  });

  describe('claimAchievement', () => {
    it('should throw NotFoundException when achievement not found', async () => {
      achievementDefinitionRepository.count.mockResolvedValue(1);
      achievementDefinitionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.claimAchievement(mockUserId, mockAchievementId),
      ).rejects.toThrow('成就不存在');
    });
  });
});