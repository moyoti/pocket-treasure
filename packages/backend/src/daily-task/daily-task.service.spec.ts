/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DailyTaskService } from './daily-task.service';
import { DailyTask, TaskType, TaskStatus } from './entities/daily-task.entity';
import { TaskTemplate } from './entities/task-template.entity';
import { UserService } from '../user/user.service';
import { InventoryService } from '../inventory/inventory.service';
import { ItemService } from '../item/item.service';

describe('DailyTaskService', () => {
  let service: DailyTaskService;

  const mockTask: DailyTask = {
    id: 'task-1',
    userId: 'user-1',
    taskType: TaskType.COLLECT,
    taskDate: '2024-01-15',
    currentProgress: 0,
    targetProgress: 3,
    status: TaskStatus.IN_PROGRESS,
    rewards: { coins: 150, experience: 100 },
    rarityRequirement: null,
    completedAt: null,
    claimedAt: null,
    createdAt: new Date(),
  } as unknown as DailyTask;

  const mockTemplate: TaskTemplate = {
    id: 'template-1',
    taskType: TaskType.COLLECT,
    name: '宝藏猎人',
    description: '收集任意3个宝藏',
    rewards: { coins: 150, experience: 100 },
    targetProgress: 3,
    weight: 2,
    isActive: true,
  } as unknown as TaskTemplate;

  const mockDailyTaskRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTemplateRepo = {
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
    updateProfile: jest.fn(),
  };

  const mockInventoryService = {
    addItemToInventory: jest.fn(),
  };

  const mockItemService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyTaskService,
        {
          provide: getRepositoryToken(DailyTask),
          useValue: mockDailyTaskRepo,
        },
        {
          provide: getRepositoryToken(TaskTemplate),
          useValue: mockTemplateRepo,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
        {
          provide: ItemService,
          useValue: mockItemService,
        },
      ],
    }).compile();

    service = module.get<DailyTaskService>(DailyTaskService);

    jest.clearAllMocks();
  });

  describe('getUserDailyTasks', () => {
    it('should return existing daily tasks', async () => {
      mockDailyTaskRepo.find.mockResolvedValue([mockTask]);

      const result = await service.getUserDailyTasks('user-1');

      expect(result).toEqual([mockTask]);
    });

    it('should generate new tasks when none exist', async () => {
      // First call returns empty (no tasks today)
      mockDailyTaskRepo.find.mockResolvedValueOnce([]);

      // Templates for generation
      mockTemplateRepo.find.mockResolvedValue([mockTemplate, { ...mockTemplate, id: 'template-2', taskType: TaskType.LOGIN }, { ...mockTemplate, id: 'template-3', taskType: TaskType.VISIT_POI }]);
      mockDailyTaskRepo.create.mockImplementation((data) => data);
      mockDailyTaskRepo.save.mockImplementation((data) => Promise.resolve({ ...data, id: 'new-task' }));

      const result = await service.getUserDailyTasks('user-1');

      expect(result.length).toBe(3);
    });
  });

  describe('claimTaskReward', () => {
    it('should claim reward for completed task', async () => {
      const completedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
        currentProgress: 3,
      };
      mockDailyTaskRepo.findOne.mockResolvedValue(completedTask);
      mockDailyTaskRepo.save.mockImplementation((t) => Promise.resolve(t));
      mockUserService.findById.mockResolvedValue({
        id: 'user-1',
        coins: 100,
        experience: 50,
      });
      mockUserService.updateProfile.mockResolvedValue({});

      const result = await service.claimTaskReward('user-1', 'task-1');

      expect(result.status).toBe(TaskStatus.CLAIMED);
      expect(result.claimedAt).toBeDefined();
    });

    it('should throw NotFoundException when task not found', async () => {
      mockDailyTaskRepo.findOne.mockResolvedValue(null);

      await expect(
        service.claimTaskReward('user-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when task does not belong to user', async () => {
      mockDailyTaskRepo.findOne.mockResolvedValue({
        ...mockTask,
        userId: 'other-user',
      });

      await expect(
        service.claimTaskReward('user-1', 'task-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when task not completed', async () => {
      mockDailyTaskRepo.findOne.mockResolvedValue(mockTask); // IN_PROGRESS

      await expect(
        service.claimTaskReward('user-1', 'task-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTaskProgress', () => {
    it('should increment task progress', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ ...mockTask, currentProgress: 1 }]),
      };
      mockDailyTaskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockDailyTaskRepo.save.mockImplementation((t) => Promise.resolve(t));

      await service.updateTaskProgress('user-1', TaskType.COLLECT, 1);

      expect(mockDailyTaskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ currentProgress: 2 }),
      );
    });

    it('should mark task as completed when target reached', async () => {
      const almostDone = { ...mockTask, currentProgress: 2, targetProgress: 3 };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([almostDone]),
      };
      mockDailyTaskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockDailyTaskRepo.save.mockImplementation((t) => Promise.resolve(t));

      await service.updateTaskProgress('user-1', TaskType.COLLECT, 1);

      expect(mockDailyTaskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          currentProgress: 3,
          status: TaskStatus.COMPLETED,
        }),
      );
    });

    it('should not exceed target progress', async () => {
      const almostDone = { ...mockTask, currentProgress: 2, targetProgress: 3 };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([almostDone]),
      };
      mockDailyTaskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockDailyTaskRepo.save.mockImplementation((t) => Promise.resolve(t));

      await service.updateTaskProgress('user-1', TaskType.COLLECT, 5);

      expect(mockDailyTaskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ currentProgress: 3 }),
      );
    });

    it('should check rarity requirement for COLLECT_RARITY tasks', async () => {
      const rarityTask = {
        ...mockTask,
        taskType: TaskType.COLLECT_RARITY,
        rarityRequirement: 'rare',
        currentProgress: 0,
      };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([rarityTask]),
      };
      mockDailyTaskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockDailyTaskRepo.save.mockImplementation((t) => Promise.resolve(t));

      // common does not meet 'rare' requirement
      await service.updateTaskProgress('user-1', TaskType.COLLECT_RARITY, 1, 'common');

      expect(mockDailyTaskRepo.save).not.toHaveBeenCalled();
    });

    it('should accept higher rarity for COLLECT_RARITY tasks', async () => {
      const rarityTask = {
        ...mockTask,
        taskType: TaskType.COLLECT_RARITY,
        rarityRequirement: 'rare',
        currentProgress: 0,
        targetProgress: 1,
      };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([rarityTask]),
      };
      mockDailyTaskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockDailyTaskRepo.save.mockImplementation((t) => Promise.resolve(t));

      // epic meets 'rare' requirement (higher rarity)
      await service.updateTaskProgress('user-1', TaskType.COLLECT_RARITY, 1, 'epic');

      expect(mockDailyTaskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ currentProgress: 1, status: TaskStatus.COMPLETED }),
      );
    });
  });

  describe('refreshTasks', () => {
    it('should delete in-progress tasks and generate new ones', async () => {
      mockDailyTaskRepo.delete.mockResolvedValue({ affected: 2 });
      mockTemplateRepo.find.mockResolvedValue([mockTemplate, { ...mockTemplate, id: 't2' }, { ...mockTemplate, id: 't3' }]);
      mockDailyTaskRepo.create.mockImplementation((data) => data);
      mockDailyTaskRepo.save.mockImplementation((data) => Promise.resolve({ ...data, id: 'new' }));

      const result = await service.refreshTasks('user-1');

      expect(mockDailyTaskRepo.delete).toHaveBeenCalled();
      expect(result.length).toBe(3);
    });
  });

  describe('getTaskStats', () => {
    it('should return correct task statistics', async () => {
      const tasks = [
        { ...mockTask, status: TaskStatus.COMPLETED },
        { ...mockTask, id: 'task-2', status: TaskStatus.IN_PROGRESS },
        { ...mockTask, id: 'task-3', status: TaskStatus.CLAIMED },
      ];
      mockDailyTaskRepo.find.mockResolvedValue(tasks);

      const result = await service.getTaskStats('user-1');

      expect(result).toEqual({
        todayCompleted: 1,
        todayTotal: 3,
        todayClaimed: 1,
      });
    });

    it('should return zeros when no tasks', async () => {
      mockDailyTaskRepo.find.mockResolvedValue([]);

      const result = await service.getTaskStats('user-1');

      expect(result).toEqual({
        todayCompleted: 0,
        todayTotal: 0,
        todayClaimed: 0,
      });
    });
  });

  describe('handleUserLogin', () => {
    it('should ensure tasks exist and update login progress', async () => {
      mockDailyTaskRepo.find.mockResolvedValue([mockTask]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockDailyTaskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.handleUserLogin('user-1');

      // Should have called find to get daily tasks
      expect(mockDailyTaskRepo.find).toHaveBeenCalled();
    });
  });

  describe('handleItemCollected', () => {
    it('should update both collect and rarity tasks', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockDailyTaskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.handleItemCollected('user-1', 'rare');

      // Should have called createQueryBuilder twice (once for COLLECT, once for COLLECT_RARITY)
      expect(mockDailyTaskRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });
});
