import type { NftEntity } from '../../nft/entity/nft.entity.js';

export interface PaymentIntent {
  amount: string;
  currency: string;
  clientSecret: string;
  id: string;
  receiverAddress?: string;
  nfts?: NftEntity[];
  expiresAt?: number;
  other?: any;
}
