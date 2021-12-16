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

  @JoiSchema(Joi.string().optional().allow(null))
  nftState: string;

  @JoiSchema(Joi.string().required())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.string().optional())
  nftName: string;

  @JoiSchema(
    Joi.any()
      .optional()
      .custom((value) => {
        try {
          JSON.parse(value);
          return true;
        } catch (error) {
          return false;
        }
      }),
  )
  metadata: unknown;

  @JoiSchema(Joi.string().optional().allow(null))
  ipfsHash?: string;

  @JoiSchema(Joi.string().optional().allow(null))
  nftContract?: string;

  @JoiSchema(Joi.string().optional().allow(null))
  tokenId?: string;

  @JoiSchema(Joi.boolean().optional().allow(null))
  disabled?: boolean;

  @JoiSchema(Joi.string().uri().optional().allow(null))
  dataUri: string;

  @JoiSchema(Joi.date().optional().allow(null))
  createdAt: Date;

  @JoiSchema(Joi.date().optional().allow(null))
  updatedAt: Date;

  @JoiSchema(Joi.number().optional().allow(null))
  createdBy: number;

  @JoiSchema(Joi.any().optional().allow(null))
  image?: any;
}
