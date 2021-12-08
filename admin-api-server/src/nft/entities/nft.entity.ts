export class Nft {
  id: number;
  nft_state: string;
  nft_name: string;
  metadata: unknown;
  data_uri: string;
  created_at: Date;
  updated_at: Date;
  ipfs_hash?: string;
  nft_contract?: string;
  token_id?: string;
}
