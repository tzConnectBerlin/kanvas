import { NftDto } from '../dto/nft.dto';

export class Nft {
  constructor(nftDto?: NftDto) {
    if (nftDto) {
      this.id = nftDto.id;
      this.metadata = nftDto.metadata;
      this.nft_state = nftDto.nftState;
      this.nft_name = nftDto.nftName;
      this.created_at = nftDto.createdAt;
      this.updated_at = nftDto.updatedAt;
      this.data_uri = nftDto.dataUri;
      this.created_by = nftDto.createdBy;
      this.disabled = nftDto.disabled || false;

      this.price = nftDto.price;
      this.editions_size = nftDto.editionsSize;
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
  disabled?: boolean;

  price?: number;
  editions_size?: number;

  getFieldsWithValues() {
    return Object.keys(this).filter((key: string) =>
      this.#valueDefined(this[key]),
    );
    /*{
      if (typeof this[key] !== 'undefined' || typeof this[key] !== null) {
        if (key === 'disabled') {
          return true;
        }
        return Boolean(this[key]);
      }
      return false;
    });*/
  }

  filterDefinedValues(): any {
    return Object.values(this).filter((v: any) => this.#valueDefined(v));
  }

  #valueDefined(v: any): boolean {
    if (v === null) {
      return true;
    }
    if (typeof v === 'boolean') {
      return true;
    }
    return Boolean(v);
  }
}
