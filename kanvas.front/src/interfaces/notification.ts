import { IUser } from './user';
import { IArtwork } from './artwork';

export enum NotificationEnum {
    FOLLOWING = 'following',
    NFT_CREATION= 'nft_creation',
    NFT_GOT_SOLD = 'nft_got_sold',
    NFT_RECEIVE_BID = 'nft_received_bid',
    NEW_NFT_FROM_FOLLOWING = 'new_nft_from_following',
    FOLLOWING_CREATED_AUCTION = 'following_created_auction',
    FOLLOWING_CREATED_DROP = 'following_created_drop',
    FOLLOWING_CREATED_FIXED_PRICE = 'following_created_fixed_price',
    OUTBID = 'outbid',
    WON_AUCTION = 'won_auction',
    NEW_NFT = 'new_nft'
}   

export enum CurrencyEnum {
    TEZ = 'ꜩ',
    DOLLAR = '$'
}

export interface ISaleInfo {
    type: 'auction' | 'drop' | 'fixedPrice',
    price: number,
    sellerPrice: number,
    currency: CurrencyEnum
}

export interface INotification {
    date: Date;
    description: string;
    concernedUser: IUser;
    concernedNft?: IArtwork;
    saleInfo?: ISaleInfo;
    read: boolean;
    type: NotificationEnum;
}
