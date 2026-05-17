import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { mnemonicService } from './MnemonicService';

/**
 * BackupService - 简化版本（仅身份恢复）
 * 
 * 注意：完整的数据库加密备份需要原生模块支持
 * 当前版本仅支持助记词验证
 */
export class BackupService {
  /**
   * 验证助记词是否有效
   */
  async validateMnemonic(mnemonic: string): Promise<boolean> {
    return mnemonicService.validateMnemonic(mnemonic);
  }
  
  /**
   * 创建备份（简化版 - 只验证助记词）
   */
  async createBackup(mnemonic: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isValid = await this.validateMnemonic(mnemonic);
      if (!isValid) {
        return { success: false, error: 'Invalid mnemonic' };
      }
      // 简化版：只验证，不实际保存文件
      return { success: true };
    } catch (error) {
      console.error('[BackupService] createBackup error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * 检查是否存在备份文件（暂不支持）
   */
  async hasBackup(): Promise<boolean> {
    return false;
  }
}

// 单例导出
export const backupService = new BackupService();
