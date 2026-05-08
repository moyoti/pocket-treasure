import {
  LocalIdentity,
  TradeSession,
  TradeOffer,
  NearbyTrader,
} from '../types';
import {
  TradeMessage,
} from './TradeProtocol';
import { identityService } from '../identity/IdentityService';
import { databaseService } from '../database';

export class TradeService {
  private isScanning: boolean = false;
  private currentSession: TradeSession | null = null;
  private nearbyTraders: NearbyTrader[] = [];
  private onTraderFound?: (trader: NearbyTrader) => void;
  private onMessageReceived?: (message: TradeMessage) => void;
  private onConnectionStateChanged?: (state: 'connected' | 'disconnected') => void;

  async startDiscovery(
    onTraderFound: (trader: NearbyTrader) => void,
    onMessageReceived: (message: TradeMessage) => void
  ): Promise<void> {
    this.onTraderFound = onTraderFound;
    this.onMessageReceived = onMessageReceived;
    this.isScanning = true;
  }

  stopDiscovery(): void {
    this.isScanning = false;
    this.nearbyTraders = [];
  }

  async connectToDevice(deviceId: string, identity: LocalIdentity): Promise<TradeSession | null> {
    return null;
  }

  async sendOffer(offer: TradeOffer): Promise<void> {
  }

  async acceptOffer(): Promise<void> {
  }

  async rejectOffer(): Promise<void> {
  }

  async completeTrade(): Promise<void> {
    this.currentSession = null;
  }

  async cancelTrade(): Promise<void> {
    this.currentSession = null;
  }

  async disconnect(): Promise<void> {
    this.currentSession = null;
    this.nearbyTraders = [];
  }

  async sendMessage(message: TradeMessage): Promise<void> {
  }

  getCurrentSession(): TradeSession | null {
    return this.currentSession;
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }
}

export const tradeService = new TradeService();