import { NftDto } from '../dto/nft.dto';

export class Nft {
  constructor(nftDto?: NftDto) {
    if (nftDto) {
      this.id = nftDto.id;
      this.metadata = nftDto.metadata;
      this.nft_contract = nftDto.nftContract;
      this.token_id = nftDto.tokenId;
      this.nft_state = nftDto.nftState;
      this.nft_name = nftDto.nftName;
      this.created_at = nftDto.createdAt;
      this.updated_at = nftDto.updatedAt;
      this.data_uri = nftDto.dataUri;
      this.ipfs_hash = nftDto.ipfsHash;
      this.created_by = nftDto.createdBy;
      this.disabled = nftDto.disabled || false;
    }
  }

  id: number;
  created_by: number;
  nft_state: string;
  nft_name: string;
  metadata: unknown;
  data_uri: string;
  created_at: Date;
  updated_at: Date;
  ipfs_hash?: string;
  nft_contract?: string;
  token_id?: string;
  disabled?: boolean;

  getFieldsWithValues() {
    return Object.keys(this).filter((key: string) => {
      if (typeof this[key] !== 'undefined' || typeof this[key] !== null) {
        if (key === 'disabled') {
          return true;
        }
        return Boolean(this[key]);
      }
      return false;
    });
  }

  filterDefinedValues() {
    return Object.values(this).filter((value: any) => {
      if (typeof value === 'boolean') {
        return true;
      }
      return Boolean(value);
    });
  }
}
