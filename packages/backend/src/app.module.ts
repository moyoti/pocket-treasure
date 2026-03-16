import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ItemModule } from './item/item.module';
import { SpawnModule } from './spawn/spawn.module';
import { InventoryModule } from './inventory/inventory.module';
import { PoiModule } from './poi/poi.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AchievementModule } from './achievement/achievement.module';
import { FriendModule } from './friend/friend.module';
import { ChatModule } from './chat/chat.module';
import { TradeModule } from './trade/trade.module';
import { DailyTaskModule } from './daily-task/daily-task.module';
import { EconomyModule } from './economy/economy.module';
import { EventModule } from './event/event.module';
import { appConfig, databaseConfig, jwtConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('database.type', 'sqlite');

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get<string>('database.host', 'localhost'),
            port: configService.get<number>('database.port', 5432),
            username: configService.get<string>('database.username', 'postgres'),
            password: configService.get<string>('database.password', 'postgres'),
            database: configService.get<string>('database.database', 'treasure_hunt'),
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false,
          };
        }

        // SQLite (default for development)
        return {
          type: 'better-sqlite3',
          database: 'treasure_hunt.db',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),

    AuthModule,
    UserModule,
    ItemModule,
    SpawnModule,
    InventoryModule,
    PoiModule,
    LeaderboardModule,
    AchievementModule,
    FriendModule,
    ChatModule,
    TradeModule,
    DailyTaskModule,
    EconomyModule,
    EventModule,
  ],
})
export class AppModule {}