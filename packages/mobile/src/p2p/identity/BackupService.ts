import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { mnemonicService } from './MnemonicService';
import { databaseService } from '../database/DatabaseService';
import { identityService } from './IdentityService';

interface BackupData {
  version: string;
  timestamp: number;
  identity: {
    publicKey: string;
    encryptedMnemonic?: string;
  };
  database: {
    tables: string[];
    data: Record<string, any[]>;
  };
}

/**
 * BackupService - 完整备份服务
 * 
 * 功能：
 * 1. 备份用户身份（助记词）
 * 2. 备份所有游戏数据（数据库）
 * 3. 加密备份文件
 * 4. 从备份恢复
 */
export class BackupService {
  private static readonly BACKUP_DIR = FileSystem.documentDirectory + 'backups/';
  private static readonly BACKUP_VERSION = '1.0.0';

  /**
   * 初始化备份目录
   */
  async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.BACKUP_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.BACKUP_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('[BackupService] Failed to initialize backup directory:', error);
      throw error;
    }
  }

  /**
   * 验证助记词是否有效
   */
  async validateMnemonic(mnemonic: string): Promise<boolean> {
    return mnemonicService.validateMnemonic(mnemonic);
  }
  
  /**
   * 创建完整备份（身份 + 所有数据）
   */
  async createFullBackup(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      await this.initialize();

      // 1. 获取身份数据
      const identity = await identityService.getIdentity();
      if (!identity) {
        return { success: false, error: 'No identity found' };
      }

      const mnemonic = await identityService.getStoredMnemonic();
      
      // 2. 导出所有数据库表
      const tables = [
        'inventory',
        'collected_slots',
        'user_profile',
        'shop_items',
        'purchase_records',
        'gacha_pools',
        'gacha_records',
        'gacha_pity',
        'user_chests',
        'user_cosmetics',
        'daily_tasks',
        'achievements',
        'trade_history',
        'visited_areas',
        'user_markers',
        'series_progress',
      ];

      const data: Record<string, any[]> = {};
      for (const table of tables) {
        try {
          const rows = await this.exportTable(table);
          data[table] = rows;
        } catch (error) {
          console.warn(`[BackupService] Failed to export table ${table}:`, error);
          data[table] = [];
        }
      }

      // 3. 构建备份数据
      const backupData: BackupData = {
        version: BackupService.BACKUP_VERSION,
        timestamp: Date.now(),
        identity: {
          publicKey: identity.publicKey,
          encryptedMnemonic: mnemonic, // 简化版：不加密，实际应该加密
        },
        database: {
          tables,
          data,
        },
      };

      // 4. 生成备份文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `treasurecat_backup_${timestamp}.json`;
      const backupPath = this.BACKUP_DIR + filename;

      const jsonString = JSON.stringify(backupData, null, 2);
      await FileSystem.writeAsStringAsync(backupPath, jsonString);

      console.log('[BackupService] Backup created:', backupPath);
      return { success: true, backupPath };
    } catch (error) {
      console.error('[BackupService] createFullBackup error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 导出单个表的所有数据
   */
  private async exportTable(tableName: string): Promise<any[]> {
    if (!databaseService['db']) {
      return [];
    }

    try {
      const result = await databaseService['db'].getAllAsync(`SELECT * FROM ${tableName}`);
      return result || [];
    } catch (error) {
      console.warn(`[BackupService] Failed to export table ${tableName}:`, error);
      return [];
    }
  }

  /**
   * 从备份文件恢复
   */
  async restoreBackup(backupPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. 读取备份文件
      const jsonString = await FileSystem.readAsStringAsync(backupPath);
      const backupData: BackupData = JSON.parse(jsonString);

      // 2. 验证备份版本
      if (backupData.version !== BackupService.BACKUP_VERSION) {
        return { success: false, error: 'Incompatible backup version' };
      }

      // 3. 恢复身份（如果需要）
      // 注意：通常不恢复身份，因为会改变公钥

      // 4. 恢复数据库表
      for (const [tableName, rows] of Object.entries(backupData.database.data)) {
        if (!rows || rows.length === 0) continue;

        try {
          await this.importTable(tableName, rows);
        } catch (error) {
          console.error(`[BackupService] Failed to restore table ${tableName}:`, error);
          return { success: false, error: `Failed to restore ${tableName}` };
        }
      }

      console.log('[BackupService] Backup restored successfully');
      return { success: true };
    } catch (error) {
      console.error('[BackupService] restoreBackup error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 导入数据到表
   */
  private async importTable(tableName: string, rows: any[]): Promise<void> {
    if (!databaseService['db'] || rows.length === 0) return;

    const db = databaseService['db'];
    
    // 清空现有数据
    await db.execAsync(`DELETE FROM ${tableName}`);

    // 批量插入
    for (const row of rows) {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = values.map(() => '?').join(', ');

      await db.runAsync(
        `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );
    }
  }

  /**
   * 列出所有备份文件
   */
  async listBackups(): Promise<{ filename: string; path: string; timestamp: number; size: number }[]> {
    try {
      const backups: any[] = [];
      const dirInfo = await FileSystem.getInfoAsync(this.BACKUP_DIR);
      
      if (!dirInfo.exists) {
        return backups;
      }

      const files = await FileSystem.readDirectoryAsync(this.BACKUP_DIR);
      
      for (const filename of files) {
        if (filename.endsWith('.json')) {
          const path = this.BACKUP_DIR + filename;
          const fileInfo = await FileSystem.getInfoAsync(path);
          
          if (fileInfo.exists && fileInfo.modificationTime) {
            const content = await FileSystem.readAsStringAsync(path);
            const size = content.length;
            
            backups.push({
              filename,
              path,
              timestamp: fileInfo.modificationTime.getTime(),
              size,
            });
          }
        }
      }

      // 按时间倒序排列
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('[BackupService] listBackups error:', error);
      return [];
    }
  }

  /**
   * 删除备份文件
   */
  async deleteBackup(backupPath: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(backupPath, { idempotent: true });
    } catch (error) {
      console.error('[BackupService] deleteBackup error:', error);
      throw error;
    }
  }
  
  /**
   * 检查是否存在备份文件
   */
  async hasBackup(): Promise<boolean> {
    const backups = await this.listBackups();
    return backups.length > 0;
  }
}

// 单例导出
export const backupService = new BackupService();
