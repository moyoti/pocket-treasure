import * as ed from '@noble/ed25519';
import { sha256, sha512 } from '@noble/hashes/sha2';
import * as SecureStore from 'expo-secure-store';
import { LocalIdentity, KeyPair } from '../types';
import { mnemonicService } from './MnemonicService';

ed.hashes.sha512 = sha512;

const PRIVATE_KEY_KEY = 'treasure_hunt_private_key';
const PUBLIC_KEY_KEY = 'treasure_hunt_public_key';
const DISPLAY_NAME_KEY = 'treasure_hunt_display_name';
const CREATED_AT_KEY = 'treasure_hunt_created_at';
const MNEMONIC_BACKED_UP_KEY = 'treasure_hunt_mnemonic_backed_up';

export class IdentityService {
  private privateKey: Uint8Array | null = null;
  private publicKey: Uint8Array | null = null;
  private identity: LocalIdentity | null = null;

  async initialize(): Promise<LocalIdentity> {
    try {
      const existing = await this.loadExistingIdentity();
      if (existing) {
        this.identity = existing;
        return existing;
      }
    } catch (error) {
      console.log('No existing identity found, creating new one');
    }

    return await this.createNewIdentity();
  }

  private async loadExistingIdentity(): Promise<LocalIdentity | null> {
    const privateKeyHex = await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
    const publicKeyHex = await SecureStore.getItemAsync(PUBLIC_KEY_KEY);
    const displayName = await SecureStore.getItemAsync(DISPLAY_NAME_KEY);
    const createdAtStr = await SecureStore.getItemAsync(CREATED_AT_KEY);

    if (!privateKeyHex || !publicKeyHex) {
      return null;
    }

    this.privateKey = this.hexToBytes(privateKeyHex);
    this.publicKey = this.hexToBytes(publicKeyHex);

    this.identity = {
      publicKey: publicKeyHex,
      displayName: displayName || 'Explorer',
      createdAt: parseInt(createdAtStr || '0'),
    };

    return this.identity;
  }

  private async createNewIdentity(): Promise<LocalIdentity> {
    this.privateKey = ed.utils.randomSecretKey();
    this.publicKey = ed.getPublicKey(this.privateKey);

    const privateKeyHex = this.bytesToHex(this.privateKey);
    const publicKeyHex = this.bytesToHex(this.publicKey);
    const createdAt = Date.now();

    await SecureStore.setItemAsync(PRIVATE_KEY_KEY, privateKeyHex);
    await SecureStore.setItemAsync(PUBLIC_KEY_KEY, publicKeyHex);
    await SecureStore.setItemAsync(DISPLAY_NAME_KEY, 'Explorer');
    await SecureStore.setItemAsync(CREATED_AT_KEY, createdAt.toString());

    this.identity = {
      publicKey: publicKeyHex,
      displayName: 'Explorer',
      createdAt,
    };

    return this.identity;
  }

  getIdentity(): LocalIdentity | null {
    return this.identity;
  }

  getPrivateKey(): Uint8Array | null {
    return this.privateKey;
  }

  getPublicKeyHex(): string {
    return this.identity?.publicKey || '';
  }

  async updateDisplayName(name: string): Promise<void> {
    if (!this.identity) {
      throw new Error('Identity not initialized');
    }

    await SecureStore.setItemAsync(DISPLAY_NAME_KEY, name);
    this.identity.displayName = name;
  }

  async sign(message: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Private key not loaded');
    }

    const messageBytes = new TextEncoder().encode(message);
    const signature = ed.sign(messageBytes, this.privateKey);
    return this.bytesToHex(signature);
  }

  async signObject(obj: object): Promise<string> {
    const canonicalJson = JSON.stringify(obj, Object.keys(obj).sort());
    return await this.sign(canonicalJson);
  }

  async verify(message: string, signature: string, publicKey: string): Promise<boolean> {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = this.hexToBytes(signature);
      const publicKeyBytes = this.hexToBytes(publicKey);
      return ed.verify(signatureBytes, messageBytes, publicKeyBytes);
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  async verifyObject(obj: object, signature: string, publicKey: string): Promise<boolean> {
    const canonicalJson = JSON.stringify(obj, Object.keys(obj).sort());
    return await this.verify(canonicalJson, signature, publicKey);
  }

  /**
   * Generate a deterministic ID from a signature
   */
  generateIdFromSignature(signature: string): string {
    const sigBytes = this.hexToBytes(signature);
    const hash = sha256(sigBytes);
    return this.bytesToHex(hash).slice(0, 16);
  }

  /**
   * Generate hash ID from data
   */
  generateId(data: string): string {
    const bytes = new TextEncoder().encode(data);
    const hash = sha256(bytes);
    return this.bytesToHex(hash).slice(0, 16);
  }

  /**
   * Create collection signature
   */
  async createCollectionSignature(
    itemId: string,
    poiId: string,
    timeSlot: number,
    timestamp: number
  ): Promise<{ signature: string; instanceId: string }> {
    const signData = {
      itemId,
      poiId,
      timeSlot,
      timestamp,
      publicKey: this.getPublicKeyHex(),
    };

    const signature = await this.signObject(signData);
    const instanceId = this.generateIdFromSignature(signature);

    return { signature, instanceId };
  }

  /**
   * Verify collection signature
   */
  async verifyCollectionSignature(
    signature: string,
    itemId: string,
    poiId: string,
    timeSlot: number,
    timestamp: number,
    publicKey: string
  ): Promise<boolean> {
    const signData = {
      itemId,
      poiId,
      timeSlot,
      timestamp,
      publicKey,
    };
    return await this.verifyObject(signData, signature, publicKey);
  }

  // ============================================
  // Utility methods
  // ============================================

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  }

  /**
   * Check if identity exists
   */
  async hasIdentity(): Promise<boolean> {
    try {
      const publicKey = await SecureStore.getItemAsync(PUBLIC_KEY_KEY);
      return publicKey !== null;
    } catch {
      return false;
    }
  }

  /**
   * Reset identity (delete and create new)
   * WARNING: This will make all previous items untradeable!
   */
  async resetIdentity(): Promise<LocalIdentity> {
    await SecureStore.deleteItemAsync(PRIVATE_KEY_KEY);
    await SecureStore.deleteItemAsync(PUBLIC_KEY_KEY);
    await SecureStore.deleteItemAsync(DISPLAY_NAME_KEY);
    await SecureStore.deleteItemAsync(CREATED_AT_KEY);

    this.privateKey = null;
    this.publicKey = null;
    this.identity = null;

    return await this.createNewIdentity();
  }

  /**
   * Create identity from mnemonic
   * @param mnemonic - 12-word mnemonic phrase
   */
  async createIdentityFromMnemonic(mnemonic: string): Promise<LocalIdentity> {
    // 1. Validate mnemonic
    if (!mnemonicService.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // 2. Derive seed and private key
    const { privateKey } = await mnemonicService.mnemonicToEd25519Key(mnemonic);

    // 3. Generate public key
    const publicKey = ed.getPublicKey(privateKey);

    // 4. Store to SecureStore
    const privateKeyHex = this.bytesToHex(privateKey);
    const publicKeyHex = this.bytesToHex(publicKey);

    await SecureStore.setItemAsync(PRIVATE_KEY_KEY, privateKeyHex);
    await SecureStore.setItemAsync(PUBLIC_KEY_KEY, publicKeyHex);
    await SecureStore.setItemAsync(DISPLAY_NAME_KEY, 'Explorer');
    await SecureStore.setItemAsync(CREATED_AT_KEY, Date.now().toString());

    // 5. Update local state
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.identity = {
      publicKey: publicKeyHex,
      displayName: 'Explorer',
      createdAt: Date.now(),
    };

    return this.identity;
  }

  /**
   * Generate and save new mnemonic
   * @returns The generated mnemonic phrase
   */
  async generateAndSaveMnemonic(): Promise<string> {
    const mnemonic = mnemonicService.generateMnemonic();
    await mnemonicService.saveMnemonic(mnemonic);
    return mnemonic;
  }

  /**
   * Check if mnemonic is backed up
   */
  async isMnemonicBackedUp(): Promise<boolean> {
    try {
      const backedUp = await SecureStore.getItemAsync(MNEMONIC_BACKED_UP_KEY);
      return backedUp === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark mnemonic as backed up
   */
  async markMnemonicBackedUp(): Promise<void> {
    await SecureStore.setItemAsync(MNEMONIC_BACKED_UP_KEY, 'true');
  }

  /**
   * Get stored mnemonic (for backup purposes)
   */
  async getStoredMnemonic(): Promise<string | null> {
    return await mnemonicService.getMnemonic();
  }
}

// Singleton instance
export const identityService = new IdentityService();