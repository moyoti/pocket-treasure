import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateProfile(id: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    return this.findById(id);
  }

  async updateAvatar(id: string, avatar: string): Promise<User> {
    await this.userRepository.update(id, { avatar });
    return this.findById(id);
  }

  async getUserStats(id: string): Promise<{
    coins: number;
    experience: number;
    level: number;
    loginStreak: number;
    collectionCount: number;
  }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.inventoryItems', 'inventory')
      .select('user.id', 'userId')
      .addSelect('user.coins', 'coins')
      .addSelect('user.experience', 'experience')
      .addSelect('user.level', 'level')
      .addSelect('user.loginStreak', 'loginStreak')
      .addSelect('COUNT(inventory.id)', 'collectionCount')
      .where('user.id = :id', { id })
      .groupBy('user.id')
      .getRawOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      coins: user.coins || 0,
      experience: user.experience || 0,
      level: user.level || 1,
      loginStreak: user.loginStreak || 0,
      collectionCount: parseInt(user.collectionCount) || 0,
    };
  }
}