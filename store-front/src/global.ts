import { NetworkType } from '@airgap/beacon-sdk';
import { Networks } from 'kukai-embed';

export const RPC_URL =
    process.env.REACT_APP_RPC_URL ?? 'https://hangzhounet.smartpy.io/';
export const NETWORK: keyof typeof NetworkType = 'HANGZHOUNET';
export const KUKAI_NETWORK: keyof typeof Networks = 'hangzhounet';
export const INSTAGRAM_CLIENT_ID = 627037085341084;

export const DART_REDIRECT_URI =
    process.env.REACT_APP_API_SERVER_BASE_URL + '/account';
