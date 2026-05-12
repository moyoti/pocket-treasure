import * as bip39 from 'bip39';

/**
 * MnemonicService - BIP39 助记词生成和恢复服务
 * 
 * 功能：
 * 1. 生成助记词（12 个单词）
 * 2. 验证助记词有效性
 */
export class MnemonicService {
  private static readonly MNEMONIC_KEY = 'mnemonic_backup';
  
  /**
   * 生成新的助记词（12 个单词）
   */
  generateMnemonic(): string {
    return bip39.generateMnemonic(128);
  }
  
  /**
   * 验证助记词是否有效
   */
  validateMnemonic(mnemonic: string): boolean {
    try {
      return bip39.validateMnemonic(mnemonic.trim().toLowerCase());
    } catch {
      return false;
    }
  }
  
  /**
   * 保存助记词到 SecureStore
   */
  async saveMnemonic(mnemonic: string): Promise<void> {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(MnemonicService.MNEMONIC_KEY, mnemonic);
  }
  
  /**
   * 从 SecureStore 读取助记词
   */
  async getMnemonic(): Promise<string | null> {
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.getItemAsync(MnemonicService.MNEMONIC_KEY);
  }
  
  /**
   * 删除助记词
   */
  async deleteMnemonic(): Promise<void> {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(MnemonicService.MNEMONIC_KEY);
  }
}

// 单例导出
export const mnemonicService = new MnemonicService();
