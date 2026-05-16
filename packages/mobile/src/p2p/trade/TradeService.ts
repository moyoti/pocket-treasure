import { BleManager, Device, Characteristic, BleError } from 'react-native-ble-plx';
import {
  LocalIdentity,
  TradeSession,
  TradeOffer,
  BLE_SCAN_TIMEOUT_MS,
  BLE_CONNECTION_TIMEOUT_MS,
  NearbyTrader,
} from '../types';
import {
  SERVICE_UUID,
  CHAR_UUID_OFFER,
  CHAR_UUID_RESPONSE,
  CHAR_UUID_SIGNATURE,
  encodeMessage,
  decodeMessage,
  TradeMessage,
  createDiscoveryMessage,
  createOfferMessage,
  createAcceptMessage,
  createRejectMessage,
  createConfirmMessage,
  createCompleteMessage,
  createCancelMessage,
} from './TradeProtocol';
import { identityService } from '../identity/IdentityService';
import { databaseService } from '../database/DatabaseService';

interface NearbyTraderInternal {
  device: Device;
  publicKey: string;
  displayName: string;
}

export class TradeService {
  private manager: BleManager;
  private isScanning: boolean = false;
  private connectedDevice: Device | null = null;
  private currentSession: TradeSession | null = null;
  private nearbyTraders: NearbyTraderInternal[] = [];
  private onTraderFound?: (trader: NearbyTrader) => void;
  private onMessageReceived?: (message: TradeMessage) => void;
  private onConnectionStateChanged?: (state: 'connected' | 'disconnected') => void;

  constructor() {
    this.manager = new BleManager();
  }

  async startDiscovery(
    onTraderFound: (trader: NearbyTrader) => void,
    onMessageReceived?: (message: TradeMessage) => void
  ): Promise<void> {
    this.onTraderFound = onTraderFound;
    this.onMessageReceived = onMessageReceived;
    this.nearbyTraders = [];
    this.isScanning = true;

    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity found');
    }

    // Start scanning and handle errors
    try {
      await this.manager.startDeviceScan(null, {
        allowDuplicates: false,
      }, (error: BleError | null, device: Device | null) => {
        if (error) {
          console.error('[TradeService] BLE scan error:', error);
          this.isScanning = false;
          
          // Check for specific Bluetooth errors
          if (error.errorCode === 1 || error.reason === 'BluetoothUnauthorized' || error.reason === 'BluetoothUnsupported') {
            throw new Error('Bluetooth is not enabled or authorized. Please enable Bluetooth in your device settings.');
          }
          return;
        }
        if (!device) return;
        this.handleDeviceDiscovered(device, identity);
      });

      console.log('[TradeService] Started BLE scanning');

      setTimeout(() => {
        this.stopDiscovery();
      }, BLE_SCAN_TIMEOUT_MS);
    } catch (err) {
      console.error('[TradeService] Failed to start discovery:', err);
      this.isScanning = false;
      throw err;
    }
  }

  private handleDeviceDiscovered(device: Device, identity: LocalIdentity): void {
    const discoveryData = device.name;
    if (!discoveryData) return;

    try {
      const parsed = JSON.parse(discoveryData);
      if (parsed.type !== 'discover' || parsed.publicKey === identity.publicKey) {
        return;
      }

      const trader: NearbyTraderInternal = {
        device,
        publicKey: parsed.publicKey,
        displayName: parsed.displayName || 'Unknown Trader',
      };

      this.nearbyTraders.push(trader);

      if (this.onTraderFound) {
        this.onTraderFound({
          publicKey: trader.publicKey,
          displayName: trader.displayName,
          deviceId: device.id,
        });
      }
    } catch {
      // Invalid discovery data, ignore
    }
  }

  stopDiscovery(): void {
    if (this.isScanning) {
      this.manager.stopDeviceScan();
      this.isScanning = false;
    }
  }

  async startAdvertising(identity: LocalIdentity): Promise<void> {
    const discoveryMessage = createDiscoveryMessage(
      identity.publicKey,
      identity.displayName,
      'TreasureCat'
    );

    // BLE advertising is handled by the device's advertising payload
    // In react-native-ble-plx, we set the device name which is used for discovery
  }

  stopAdvertising(): void {
    // Stop BLE advertising
  }

  async connectToDevice(deviceId: string, identity: LocalIdentity): Promise<TradeSession> {
    const trader = this.nearbyTraders.find(t => t.device.id === deviceId);
    if (!trader) {
      throw new Error('Trader not found in discovery list');
    }

    const sessionId = `${identity.publicKey}_${trader.publicKey}_${Date.now()}`;

    this.currentSession = {
      sessionId,
      partnerPublicKey: trader.publicKey,
      partnerDisplayName: trader.displayName,
      status: 'connecting',
      startedAt: Date.now(),
    };

    try {
      this.connectedDevice = await trader.device.connect();
      
      await this.connectedDevice.discoverAllServicesAndCharacteristics();

      await this.setupCharacteristicListeners();

      this.currentSession.status = 'negotiating';

      if (this.onConnectionStateChanged) {
        this.onConnectionStateChanged('connected');
      }

      return this.currentSession;
    } catch (error) {
      this.currentSession.status = 'failed';
      throw error;
    }
  }

  private async setupCharacteristicListeners(): Promise<void> {
    if (!this.connectedDevice) return;

    const offerChar = await this.findCharacteristic(CHAR_UUID_OFFER);
    const responseChar = await this.findCharacteristic(CHAR_UUID_RESPONSE);
    const signatureChar = await this.findCharacteristic(CHAR_UUID_SIGNATURE);

    if (responseChar) {
      responseChar.monitor((error: Error | null, characteristic: Characteristic | null) => {
        if (error || !characteristic?.value) return;
        this.handleCharacteristicUpdate(characteristic);
      });
    }

    if (signatureChar) {
      signatureChar.monitor((error: Error | null, characteristic: Characteristic | null) => {
        if (error || !characteristic?.value) return;
        this.handleCharacteristicUpdate(characteristic);
      });
    }
  }

  private async findCharacteristic(uuid: string): Promise<Characteristic | null> {
    if (!this.connectedDevice) return null;

    try {
      const services = await this.connectedDevice.services();
      if (!services) return null;
      
      for (const service of services) {
        const characteristics = await service.characteristics();
        if (!characteristics) continue;
        
        for (const char of characteristics) {
          if (char.uuid.toLowerCase() === uuid.toLowerCase()) {
            return char;
          }
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  private handleCharacteristicUpdate(characteristic: Characteristic): void {
    if (!characteristic.value) return;

    const decodedValue = this.base64Decode(characteristic.value);
    const message = decodeMessage(decodedValue);

    if (message && this.onMessageReceived) {
      this.onMessageReceived(message);
    }
  }

  async sendMessage(message: TradeMessage): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No connected device');
    }

    const encoded = encodeMessage(message);
    const base64Value = this.base64Encode(encoded);

    const targetUuid = message.type === 'offer' || message.type === 'counter'
      ? CHAR_UUID_OFFER
      : message.type === 'confirm'
        ? CHAR_UUID_SIGNATURE
        : CHAR_UUID_RESPONSE;

    const characteristic = await this.findCharacteristic(targetUuid);
    if (!characteristic) {
      throw new Error('Characteristic not found');
    }

    await characteristic.writeWithResponse(base64Value);
  }

  async sendOffer(offer: TradeOffer): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity');
    }

    this.currentSession.myOffer = offer;

    const message = createOfferMessage(
      this.currentSession.sessionId,
      identity.publicKey,
      identity.displayName,
      offer
    );

    await this.sendMessage(message);
  }

  async acceptOffer(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity');
    }

    const message = createAcceptMessage(
      this.currentSession.sessionId,
      identity.publicKey,
      identity.displayName
    );

    await this.sendMessage(message);
    this.currentSession.status = 'exchanging';
  }

  async rejectOffer(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity');
    }

    const message = createRejectMessage(
      this.currentSession.sessionId,
      identity.publicKey,
      identity.displayName
    );

    await this.sendMessage(message);
  }

  async sendConfirm(signature: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity');
    }

    const message = createConfirmMessage(
      this.currentSession.sessionId,
      identity.publicKey,
      identity.displayName,
      signature
    );

    await this.sendMessage(message);
  }

  async completeTrade(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity');
    }

    const message = createCompleteMessage(
      this.currentSession.sessionId,
      identity.publicKey,
      identity.displayName
    );

    await this.sendMessage(message);
    this.currentSession.status = 'completed';
  }

  async cancelTrade(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const identity = await identityService.getIdentity();
    if (!identity) {
      throw new Error('No local identity');
    }

    const message = createCancelMessage(
      this.currentSession.sessionId,
      identity.publicKey,
      identity.displayName
    );

    await this.sendMessage(message);
    this.currentSession.status = 'cancelled';
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
      this.currentSession = null;

      if (this.onConnectionStateChanged) {
        this.onConnectionStateChanged('disconnected');
      }
    }
  }

  getCurrentSession(): TradeSession | null {
    return this.currentSession;
  }

  getNearbyTraders(): NearbyTraderInternal[] {
    return this.nearbyTraders;
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  private base64Encode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    const buffer = new Uint8Array(str.length);
    for (let j = 0; j < str.length; j++) {
      buffer[j] = str.charCodeAt(j);
    }
    while (i < buffer.length) {
      const a = i < buffer.length ? buffer[i++] : 0;
      const b = i < buffer.length ? buffer[i++] : 0;
      const c = i < buffer.length ? buffer[i++] : 0;
      const b1 = (a >> 2) & 0x3F;
      const b2 = ((a & 0x3) << 4) | ((b >> 4) & 0xF);
      const b3 = ((b & 0xF) << 2) | ((c >> 6) & 0x3);
      const b4 = c & 0x3F;
      result += chars[b1] + chars[b2] + chars[b3] + chars[b4];
    }
    const padding = result.length % 4;
    if (padding) {
      result += '='.repeat(4 - padding);
    }
    return result;
  }

  private base64Decode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const lookup: Record<string, number> = {};
    for (let i = 0; i < chars.length; i++) {
      lookup[chars[i]] = i;
    }
    const buffer: number[] = [];
    let i = 0;
    str = str.replace(/=/g, '');
    while (i < str.length) {
      const b1 = lookup[str[i++]];
      const b2 = lookup[str[i++]];
      const b3 = lookup[str[i++]];
      const b4 = lookup[str[i++]];
      const a = (b1 << 2) | (b2 >> 4);
      const b = ((b2 & 0xF) << 4) | (b3 >> 2);
      const c = ((b3 & 0x3) << 6) | b4;
      buffer.push(a);
      if (b3 !== undefined) buffer.push(b);
      if (b4 !== undefined) buffer.push(c);
    }
    return buffer.map(b => String.fromCharCode(b)).join('');
  }

  destroy(): void {
    this.stopDiscovery();
    this.disconnect();
    this.manager.destroy();
  }
}

export const tradeService = new TradeService();