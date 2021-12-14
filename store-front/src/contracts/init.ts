import { DAppClientOptions, NetworkType } from '@airgap/beacon-sdk';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { TezosToolkit, MichelCodecPacker } from '@taquito/taquito';
import { NETWORK, RPC_URL } from '../global';

let tezos: TezosToolkit;

export const initTezos = (url = RPC_URL): void => {
    tezos = new TezosToolkit(url);
    tezos.setPackerProvider(new MichelCodecPacker());
};

export const initWallet = (): BeaconWallet => {
    const options: DAppClientOptions = {
        name: 'D /a:rt/',
        iconUrl: 'https://tezostaquito.io/img/favicon.png',
        preferredNetwork: NetworkType[NETWORK],
    };

    return new BeaconWallet(options);
};

export const setWalletProvider = (wallet: BeaconWallet): void => {
    tezos && tezos.setProvider({ wallet });
};
