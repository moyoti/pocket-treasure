import {
  BLE_SERVICE_UUID,
  BLE_CHARACTERISTIC_OFFER,
  BLE_CHARACTERISTIC_RESPONSE,
  BLE_CHARACTERISTIC_SIGNATURE,
  TradeOffer,
} from '../types';

export const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
export const CHAR_UUID_OFFER = '0000fff1-0000-1000-8000-00805f9b34fb';
export const CHAR_UUID_RESPONSE = '0000fff2-0000-1000-8000-00805f9b34fb';
export const CHAR_UUID_SIGNATURE = '0000fff3-0000-1000-8000-00805f9b34fb';

export type MessageType =
  | 'discover'
  | 'offer'
  | 'accept'
  | 'reject'
  | 'counter'
  | 'confirm'
  | 'cancel'
  | 'complete';

export interface TradeMessage {
  type: MessageType;
  sessionId: string;
  senderPublicKey: string;
  senderDisplayName: string;
  timestamp: number;
  payload?: TradeOffer | TradeOffer[] | string;
}

export interface DiscoveryPayload {
  publicKey: string;
  displayName: string;
  deviceName: string;
}

export const encodeMessage = (message: TradeMessage): string => {
  return JSON.stringify(message);
};

export const decodeMessage = (data: string): TradeMessage | null => {
  try {
    const parsed = JSON.parse(data);
    if (!parsed.type || !parsed.sessionId || !parsed.senderPublicKey) {
      return null;
    }
    return parsed as TradeMessage;
  } catch {
    return null;
  }
};

export const createDiscoveryMessage = (
  publicKey: string,
  displayName: string,
  deviceName: string
): string => {
  const payload: DiscoveryPayload = {
    publicKey,
    displayName,
    deviceName,
  };
  return JSON.stringify({
    type: 'discover',
    publicKey,
    displayName,
    deviceName,
    timestamp: Date.now(),
  });
};

export const createOfferMessage = (
  sessionId: string,
  senderPublicKey: string,
  senderDisplayName: string,
  offer: TradeOffer
): TradeMessage => {
  return {
    type: 'offer',
    sessionId,
    senderPublicKey,
    senderDisplayName,
    timestamp: Date.now(),
    payload: offer,
  };
};

export const createAcceptMessage = (
  sessionId: string,
  senderPublicKey: string,
  senderDisplayName: string
): TradeMessage => {
  return {
    type: 'accept',
    sessionId,
    senderPublicKey,
    senderDisplayName,
    timestamp: Date.now(),
  };
};

export const createRejectMessage = (
  sessionId: string,
  senderPublicKey: string,
  senderDisplayName: string
): TradeMessage => {
  return {
    type: 'reject',
    sessionId,
    senderPublicKey,
    senderDisplayName,
    timestamp: Date.now(),
  };
};

export const createCounterMessage = (
  sessionId: string,
  senderPublicKey: string,
  senderDisplayName: string,
  counterOffer: TradeOffer
): TradeMessage => {
  return {
    type: 'counter',
    sessionId,
    senderPublicKey,
    senderDisplayName,
    timestamp: Date.now(),
    payload: counterOffer,
  };
};

export const createConfirmMessage = (
  sessionId: string,
  senderPublicKey: string,
  senderDisplayName: string,
  signature: string
): TradeMessage => {
  return {
    type: 'confirm',
    sessionId,
    senderPublicKey,
    senderDisplayName,
    timestamp: Date.now(),
    payload: signature,
  };
};

export const createCompleteMessage = (
  sessionId: string,
  senderPublicKey: string,
  senderDisplayName: string
): TradeMessage => {
  return {
    type: 'complete',
    sessionId,
    senderPublicKey,
    senderDisplayName,
    timestamp: Date.now(),
  };
};

export const createCancelMessage = (
  sessionId: string,
  senderPublicKey: string,
  senderDisplayName: string
): TradeMessage => {
  return {
    type: 'cancel',
    sessionId,
    senderPublicKey,
    senderDisplayName,
    timestamp: Date.now(),
  };
};

export { BLE_SERVICE_UUID, BLE_CHARACTERISTIC_OFFER, BLE_CHARACTERISTIC_RESPONSE, BLE_CHARACTERISTIC_SIGNATURE };