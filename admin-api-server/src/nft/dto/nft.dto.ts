import { JoiSchema, JoiSchemaOptions, CREATE, UPDATE } from 'nestjs-joi';
import * as Joi from 'joi';
import { Nft } from '../entities/nft.entity';

@JoiSchemaOptions({
  allowUnknown: false,
})
export class NftDto {
  constructor(nftEntity?: Nft) {
    if (nftEntity) {
      this.id = nftEntity.id;
      this.createdAt = nftEntity.created_at;
      this.updatedAt = nftEntity.updated_at;
      this.dataUri = nftEntity.data_uri;
      this.ipfsHash = nftEntity.ipfs_hash;
      this.metadata = nftEntity.metadata;
      this.nftContract = nftEntity.nft_contract;
      this.tokenId = nftEntity.token_id;
      this.nftState = nftEntity.nft_state;
      this.nftName = nftEntity.nft_name;
      this.createdBy = nftEntity.created_by;
      this.disabled = nftEntity.disabled;
    }
  }

  @JoiSchema(Joi.number().optional())
  id: number;

  @JoiSchema(Joi.string().required())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.string().optional())
  nftState: string;

  @JoiSchema(Joi.string().required())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.string().optional())
  nftName: string;

  @JoiSchema(Joi.object().required())
  @JoiSchema([CREATE], Joi.object().required())
  @JoiSchema([UPDATE], Joi.object().optional())
  metadata: unknown;

  @JoiSchema(Joi.string().uri().required())
  @JoiSchema([CREATE], Joi.string().uri().required())
  @JoiSchema([UPDATE], Joi.string().uri().optional())
  dataUri: string;

  @JoiSchema(Joi.date().forbidden())
  createdAt: Date;

  @JoiSchema(Joi.date().forbidden())
  updatedAt: Date;

  @JoiSchema(Joi.string().optional())
  ipfsHash?: string;

  @JoiSchema(Joi.string().optional())
  nftContract?: string;

  @JoiSchema(Joi.number().forbidden())
  createdBy: number;

  @JoiSchema(Joi.string().optional())
  tokenId?: string;

  @JoiSchema(Joi.boolean().optional())
  disabled?: boolean;
}
