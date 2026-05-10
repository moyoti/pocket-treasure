import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { mnemonicService } from './MnemonicService';

/**
 * BackupService - 数据库加密备份服务
 * 
 * 功能：
 * 1. 导出并加密整个数据库
 * 2. 解密并导入数据库备份
 * 3. 自动备份管理
 * 
 * 加密流程：
 * 助记词 → 种子 → 加密密钥 (256 位) → AES-GCM 加密数据库
 */
export class BackupService {
  private static readonly BACKUP_FILENAME = 'treasure_hunt_backup.enc';
  private static readonly BACKUP_VERSION = 1;
  
  /**
   * 创建数据库备份
   * 导出所有数据并使用助记词派生的密钥加密
   */
  async createBackup(mnemonic: string): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      // 1. 验证助记词
      if (!mnemonicService.validateMnemonic(mnemonic)) {
        return { success: false, error: 'Invalid mnemonic' };
      }
      
      // 2. 获取数据库服务并导出数据
      const { databaseService } = await import('../database/DatabaseService');
      const dbDump = await databaseService.exportAllData();
      
      // 3. 从助记词派生加密密钥
      const encryptionKey = await mnemonicService.mnemonicToEncryptionKey(mnemonic);
      
      // 4. 加密数据
      const encrypted = await this.encryptData(dbDump, encryptionKey);
      
      // 5. 保存到文件系统
      const filePath = await this.saveBackupFile(encrypted);
      
      return { success: true, filePath };
    } catch (error) {
      console.error('Backup failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Backup failed' 
      };
    }
  }
  
  /**
   * 从备份恢复数据库
   * 使用助记词派生的密钥解密并导入数据
   */
  async restoreBackup(mnemonic: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // 1. 验证助记词
      if (!mnemonicService.validateMnemonic(mnemonic)) {
        return { success: false, error: 'Invalid mnemonic' };
      }
      
      // 2. 读取备份文件
      const encrypted = await this.loadBackupFile();
      if (!encrypted) {
        return { success: false, error: 'No backup file found' };
      }
      
      // 3. 从助记词派生加密密钥
      const encryptionKey = await mnemonicService.mnemonicToEncryptionKey(mnemonic);
      
      // 4. 解密数据
      const dbDump = await this.decryptData(encrypted, encryptionKey);
      
      // 5. 导入数据库
      const { databaseService } = await import('../database/DatabaseService');
      await databaseService.importAllData(dbDump);
      
      return { success: true };
    } catch (error) {
      console.error('Restore failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Restore failed' 
      };
    }
  }
  
  /**
   * 检查是否存在备份文件
   */
  async hasBackup(): Promise<boolean> {
    try {
      const filePath = this.getBackupFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists ?? false;
    } catch {
      return false;
    }
  }
  
  /**
   * 删除备份文件
   */
  async deleteBackup(): Promise<void> {
    try {
      const filePath = this.getBackupFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
    }
  }
  
  /**
   * 获取备份文件路径
   */
  private getBackupFilePath(): string {
    if (Platform.OS === 'ios') {
      return `${FileSystem.documentDirectory}${BackupService.BACKUP_FILENAME}`;
    } else {
      // Android: 使用缓存目录
      return `${FileSystem.cacheDirectory}${BackupService.BACKUP_FILENAME}`;
    }
  }
  
  /**
   * 保存备份文件
   */
  private async saveBackupFile(encrypted: Uint8Array): Promise<string> {
    const filePath = this.getBackupFilePath();
    
    // 转换为 Base64
    const base64 = this.uint8ArrayToBase64(encrypted);
    
    // 写入文件
    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    return filePath;
  }
  
  /**
   * 读取备份文件
   */
  private async loadBackupFile(): Promise<Uint8Array | null> {
    const filePath = this.getBackupFilePath();
    
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      return null;
    }
    
    // 读取 Base64
    const base64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    // 转换为 Uint8Array
    return this.base64ToUint8Array(base64);
  }
  
  /**
   * 加密数据（使用 AES-GCM）
   */
  private async encryptData(data: any, key: Uint8Array): Promise<Uint8Array> {
    const crypto = require('crypto');
    
    // 将数据转换为 JSON 字符串
    const jsonString = JSON.stringify({
      version: BackupService.BACKUP_VERSION,
      timestamp: Date.now(),
      data,
    });
    
    // 生成随机 IV (12 字节 for GCM)
    const iv = crypto.randomBytes(12);
    
    // 创建加密器
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
    
    // 加密
    let encrypted = cipher.update(jsonString, 'utf8', 'binary');
    encrypted += cipher.final('binary');
    
    // 获取认证标签
    const authTag = cipher.getAuthTag();
    
    // 组合：IV + AuthTag + EncryptedData
    const result = new Uint8Array(iv.length + authTag.length + encrypted.length);
    result.set(iv, 0);
    result.set(authTag, iv.length);
    result.set(Buffer.from(encrypted, 'binary'), iv.length + authTag.length);
    
    return result;
  }
  
  /**
   * 解密数据（使用 AES-GCM）
   */
  private async decryptData(encrypted: Uint8Array, key: Uint8Array): Promise<any> {
    const crypto = require('crypto');
    
    // 提取 IV, AuthTag, 和加密数据
    const iv = encrypted.slice(0, 12);
    const authTag = encrypted.slice(12, 28);
    const data = encrypted.slice(28);
    
    // 创建解密器
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(iv));
    decipher.setAuthTag(Buffer.from(authTag));
    
    // 解密
    let decrypted = decipher.update(Buffer.from(data), 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    
    // 解析 JSON
    const parsed = JSON.parse(decrypted);
    
    // 验证版本
    if (parsed.version !== BackupService.BACKUP_VERSION) {
      throw new Error(`Unsupported backup version: ${parsed.version}`);
    }
    
    return parsed.data;
  }
  
  /**
   * Uint8Array 转 Base64
   */
  private uint8ArrayToBase64(arr: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < arr.length; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
  }
  
  /**
   * Base64 转 Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      arr[i] = binary.charCodeAt(i);
    }
    return arr;
  }
}

// 单例导出
export const backupService = new BackupService();
