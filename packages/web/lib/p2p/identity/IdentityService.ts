import * as ed from '@noble/ed25519';
import { LocalIdentity, KeyPair } from '../types';

const PRIVATE_KEY_KEY = 'treasure_hunt_private_key';
const PUBLIC_KEY_KEY = 'treasure_hunt_public_key';
const DISPLAY_NAME_KEY = 'treasure_hunt_display_name';
const CREATED_AT_KEY = 'treasure_hunt_created_at';

const secureStore = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

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
    const privateKeyHex = await secureStore.getItem(PRIVATE_KEY_KEY);
    const publicKeyHex = await secureStore.getItem(PUBLIC_KEY_KEY);
    const displayName = await secureStore.getItem(DISPLAY_NAME_KEY);
    const createdAtStr = await secureStore.getItem(CREATED_AT_KEY);

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
    const keyPair = await this.generateKeyPair();
    this.privateKey = keyPair.privateKey;
    this.publicKey = keyPair.publicKey;

    const publicKeyHex = this.bytesToHex(keyPair.publicKey);
    const privateKeyHex = this.bytesToHex(keyPair.privateKey);
    const createdAt = Date.now();

    await secureStore.setItem(PRIVATE_KEY_KEY, privateKeyHex);
    await secureStore.setItem(PUBLIC_KEY_KEY, publicKeyHex);
    await secureStore.setItem(DISPLAY_NAME_KEY, 'Explorer');
    await secureStore.setItem(CREATED_AT_KEY, createdAt.toString());

    this.identity = {
      publicKey: publicKeyHex,
      displayName: 'Explorer',
      createdAt,
    };

    return this.identity;
  }

  private async generateKeyPair(): Promise<KeyPair> {
    const privateKey = ed.utils.randomSecretKey();
    const publicKey = await ed.getPublicKeyAsync(privateKey);
    return { privateKey, publicKey };
  }

  async signMessage(message: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('No private key available');
    }
    const messageBytes = new TextEncoder().encode(message);
    const signature = await ed.signAsync(messageBytes, this.privateKey);
    return this.bytesToHex(signature);
  }

  async verifySignature(message: string, signature: string, publicKey: string): Promise<boolean> {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = this.hexToBytes(signature);
    const publicKeyBytes = this.hexToBytes(publicKey);
    return await ed.verifyAsync(signatureBytes, messageBytes, publicKeyBytes);
  }

  getIdentity(): LocalIdentity | null {
    return this.identity;
  }

  getPublicKey(): string | null {
    return this.identity?.publicKey || null;
  }

  getPublicKeyHex(): string {
    return this.identity?.publicKey || '';
  }

  async getPrivateKey(): Promise<Uint8Array | null> {
    if (this.privateKey) return this.privateKey;
    const privateKeyHex = await secureStore.getItem(PRIVATE_KEY_KEY);
    if (!privateKeyHex) return null;
    this.privateKey = this.hexToBytes(privateKeyHex);
    return this.privateKey;
  }

  async updateDisplayName(name: string): Promise<void> {
    if (!this.identity) return;
    this.identity.displayName = name;
    await secureStore.setItem(DISPLAY_NAME_KEY, name);
  }

  async resetIdentity(): Promise<void> {
    await secureStore.deleteItem(PRIVATE_KEY_KEY);
    await secureStore.deleteItem(PUBLIC_KEY_KEY);
    await secureStore.deleteItem(DISPLAY_NAME_KEY);
    await secureStore.deleteItem(CREATED_AT_KEY);
    this.privateKey = null;
    this.publicKey = null;
    this.identity = null;
  }

  async signObject(obj: object): Promise<string> {
    const canonicalJson = JSON.stringify(obj, Object.keys(obj).sort());
    return await this.signMessage(canonicalJson);
  }

  async verifyObject(obj: object, signature: string, publicKey: string): Promise<boolean> {
    const canonicalJson = JSON.stringify(obj, Object.keys(obj).sort());
    return await this.verifySignature(canonicalJson, signature, publicKey);
  }

  generateIdFromSignature(signature: string): string {
    return signature.slice(0, 16);
  }

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
}

export const identityService = new IdentityService();
