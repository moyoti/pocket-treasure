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
   * 检查是否存在备份文件（暂不支持）
   */
  async hasBackup(): Promise<boolean> {
    return false;
  }
}

// 单例导出
export const backupService = new BackupService();
