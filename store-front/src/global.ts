import { NetworkType } from '@airgap/beacon-sdk';
import { Networks } from 'kukai-embed';

export const RPC_URL =
    process.env.REACT_APP_RPC_URL ?? 'https://ithaca-archive.tzconnect.berlin/';
export const NETWORK: keyof typeof NetworkType = 'ITHACANET';
export const KUKAI_NETWORK: string = 'ithacanet';
