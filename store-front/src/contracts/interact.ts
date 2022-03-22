import axios from 'axios';
import { WalletParamsWithKind, TezosToolkit, OpKind } from '@taquito/taquito';

const getSharesFromIPFS = (ipfsMeta: any) => {
    const shares : {amount: number, recipient: string}[] = [];
    ipfsMeta.shares?.map((share: any) => {
        const keys = Object.keys(share)
        shares.push({
            amount: Number(share[keys[0]]) * Math.pow(10, -ipfsMeta.decimals) * 1000,
            recipient: keys[0]
        })
    })

    return shares
}

// We excpet to ipfs://Q...
export const listTokenOnObjkt = async (editionsNumber: number, tokenId: number, price: number, ipfsHash: string, toolkit?: TezosToolkit) => {

    if (!toolkit) return;
    if (!ipfsHash) return
    if (price < 0) return;
    if (tokenId < 0) return;
    if (editionsNumber < 0 || editionsNumber === 0) return;

    const fa2Contract = await toolkit.contract.at(process.env.REACT_APP_FA2_ADDRESS!)
    const objktMarketplaceContract = await toolkit.contract.at(process.env.REACT_APP_OBJKT_MARKETPLACE!)

    const updateOperatorsParam = [{ add_operator: { owner: await toolkit.wallet.pkh(), token_id: tokenId, operator: objktMarketplaceContract.address } }]


    const ipfsMeta = await axios.get(`https://ipfs.io/ipfs/${ipfsHash.replace('ipfs://', '')}`)
    if (!ipfsMeta.data) return;

    const askParam = {
        token: {
            token_id: tokenId,
            address: fa2Contract.address
        }, currency: {
            tez: null
        },
        editions: editionsNumber,
        amount: price * 1000000,
        shares: getSharesFromIPFS(ipfsMeta.data),
        expiry_time: undefined,
        target: undefined
    }

    debugger
    let transactions: WalletParamsWithKind[] = [
        {
            kind: OpKind.TRANSACTION,
            ...fa2Contract.methods.update_operators(updateOperatorsParam).toTransferParams(),
            amount: 0
        },
        {
            kind: OpKind.TRANSACTION,
            ...objktMarketplaceContract.methods.ask(askParam).toTransferParams(),
            amount: 0
        }
    ]


    const batch = await toolkit.wallet.batch(transactions)

    const batchOp = await batch.send()
    const confirmation = await batchOp.confirmation()

}



