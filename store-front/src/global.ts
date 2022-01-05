import { NetworkType } from '@airgap/beacon-sdk';
import { Networks } from 'kukai-embed';

export const RPC_URL =
    process.env.REACT_APP_RPC_URL ?? 'http://hangzhounet.tzconnect.berlin/';
export const NETWORK: keyof typeof NetworkType = 'HANGZHOUNET';
export const KUKAI_NETWORK: keyof typeof Networks = 'hangzhounet';
