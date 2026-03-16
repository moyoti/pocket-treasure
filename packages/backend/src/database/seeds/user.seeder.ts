import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class UserSeeder implements OnModuleInit {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const count = await this.userRepository.count();
    if (count === 0) {
      await this.seedUsers();
    }
  }

  async seedUsers(): Promise<void> {
    this.logger.log('Seeding test users...');

    const testUsers: Partial<User>[] = [
      {
        email: 'test@test.com',
        password: await bcrypt.hash('123456', 10),
        username: 'testuser',
        isVerified: true,
        coins: 1000,
        experience: 500,
        level: 5,
      },
      {
        email: 'admin@treasure.com',
        password: await bcrypt.hash('admin123', 10),
        username: 'admin',
        isVerified: true,
        coins: 10000,
        experience: 5000,
        level: 20,
      },
      {
        email: 'demo@treasure.com',
        password: await bcrypt.hash('demo123', 10),
        username: 'demo',
        isVerified: true,
        coins: 500,
        experience: 200,
        level: 3,
      },
    ];

    for (const userData of testUsers) {
      const user = this.userRepository.create(userData);
      await this.userRepository.save(user);
    }

    this.logger.log(`Seeded ${testUsers.length} test users`);
  }
}