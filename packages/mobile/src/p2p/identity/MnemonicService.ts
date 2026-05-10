import * as bip39 from 'bip39';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';

/**
 * MnemonicService - BIP39 助记词生成和恢复服务
 * 
 * 功能：
 * 1. 生成助记词（12 个单词）
 * 2. 验证助记词有效性
 * 3. 从助记词推导种子
 * 4. 从种子派生 Ed25519 私钥
 * 5. 从助记词派生加密密钥（用于数据库备份）
 */
export class MnemonicService {
  private static readonly MNEMONIC_KEY = 'mnemonic_backup';
  private static readonly ENCRYPTION_KEY_SALT = 'treasure-hunt-db-encryption';
  
  /**
   * 生成新的助记词（12 个单词）
   */
  generateMnemonic(): string {
    // 128 位熵 = 12 个单词
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
   * 从助记词推导种子 (512 位)
   */
  async mnemonicToSeed(mnemonic: string): Promise<Uint8Array> {
    const normalized = mnemonic.trim().toLowerCase();
    // BIP39: PBKDF2-HMAC-SHA512(mnemonic, "mnemonic" + passphrase, 2048, 64)
    // 这里不使用 passphrase，简化实现
    return await this.pbkdf2(
      Buffer.from(normalized, 'utf8'),
      Buffer.from('mnemonic', 'utf8'),
      2048,
      64
    );
  }
  
  /**
   * 从种子派生 Ed25519 私钥
   * 使用 HMAC-SHA512(seed, "ed25519 seed") 的前 32 字节
   */
  async deriveEd25519PrivateKey(seed: Uint8Array): Promise<Uint8Array> {
    const key = await hmac(sha256, Buffer.from('ed25519 seed'), Buffer.from(seed));
    return key.slice(0, 32); // 取前 32 字节作为私钥
  }
  
  /**
   * 从助记词派生数据库加密密钥 (256 位 AES 密钥)
   * 使用 HMAC-SHA256(seed, "treasure-hunt-db-encryption")
   */
  async deriveEncryptionKey(seed: Uint8Array): Promise<Uint8Array> {
    return await hmac(sha256, Buffer.from(MnemonicService.ENCRYPTION_KEY_SALT), Buffer.from(seed));
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
  
  /**
   * 完整的助记词到 Ed25519 私钥流程
   */
  async mnemonicToEd25519Key(mnemonic: string): Promise<{
    privateKey: Uint8Array;
    seed: Uint8Array;
  }> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    
    const seed = await this.mnemonicToSeed(mnemonic);
    const privateKey = await this.deriveEd25519PrivateKey(seed);
    
    return { seed, privateKey };
  }
  
  /**
   * 完整的助记词到加密密钥流程
   */
  async mnemonicToEncryptionKey(mnemonic: string): Promise<Uint8Array> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    
    const seed = await this.mnemonicToSeed(mnemonic);
    return await this.deriveEncryptionKey(seed);
  }
  
  /**
   * PBKDF2 实现（使用 Web Crypto API）
   */
  private async pbkdf2(
    password: Buffer,
    salt: Buffer,
    iterations: number,
    keyLength: number
  ): Promise<Uint8Array> {
    // 使用 crypto 模块（React Native 环境）
    const crypto = require('crypto');
    
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        keyLength,
        'sha512',
        (err: Error, derivedKey: Buffer) => {
          if (err) reject(err);
          else resolve(new Uint8Array(derivedKey));
        }
      );
    });
  }
}

// 单例导出
export const mnemonicService = new MnemonicService();
