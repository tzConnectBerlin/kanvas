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
    const options: any = {
        name: 'Kanvas',
        iconUrl: 'https://tezostaquito.io/img/favicon.png',
        preferredNetwork: NetworkType[NETWORK],
    };

    return new BeaconWallet(options);
};

export const setWalletProvider = (wallet: BeaconWallet): void => {
    tezos && tezos.setProvider({ wallet });
};

export const transfer = async (
    amount: any,
    receiverAddress: any,
    message: any,
): Promise<void> => {


    let paypoint_contract = await tezos.contract.at(receiverAddress);
    let transfer = paypoint_contract.methods
        .default(message)
        .toTransferParams();
    transfer.mutez = true;
    transfer.amount = amount;


    let result = await tezos.wallet
        .transfer(transfer)
        .send()
        .then((op: { confirmation: () => Promise<any> }) => {
            op.confirmation()
                .then((result: { completed: any }) => {
                    console.log(result);
                    if (result.completed) {
                        console.log('Transaction correctly processed!');
                    } else {
                        console.log('An error has occurred');
                    }
                })
                .catch((err: any) => console.log(err));
        });

    console.log(result);
    return result;
};
