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
      this.metadata = nftEntity.metadata;
      this.nftState = nftEntity.nft_state;
      this.nftName = nftEntity.nft_name;
      this.createdBy = nftEntity.created_by;
      this.disabled = nftEntity.disabled;

      this.price = nftEntity.price;
      this.editionsSize = nftEntity.editions_size;
      this.categories = nftEntity.categories;
      this.proposed = nftEntity.proposed;
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
          return typeof value === 'object' ? value : JSON.parse(value);
        } catch (error) {
          return {};
        }
      }),
  )
  metadata: unknown;

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

  @JoiSchema(Joi.number().optional().allow(null))
  price?: number;
  @JoiSchema(Joi.number().optional().allow(null))
  editionsSize?: number;
  @JoiSchema(Joi.array().items(Joi.number()).optional().allow(null))
  categories?: number[];
  @JoiSchema(Joi.boolean().optional().allow(null))
  proposed?: boolean;
}
