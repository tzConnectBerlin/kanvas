import { JoiSchema, JoiSchemaOptions, CREATE, UPDATE } from 'nestjs-joi';
import * as Joi from 'joi';

@JoiSchemaOptions({
  allowUnknown: false,
})
export class NftDto {
  @JoiSchema(Joi.number().optional())
  id: number;

  @JoiSchema(Joi.string().required())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.string().optional())
  nft_state: string;

  @JoiSchema(Joi.string().required())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.string().optional())
  nft_name: string;

  @JoiSchema(Joi.object().required())
  @JoiSchema([CREATE], Joi.object().required())
  @JoiSchema([UPDATE], Joi.object().optional())
  metadata: unknown;

  @JoiSchema(Joi.string().uri().required())
  @JoiSchema([CREATE], Joi.string().uri().required())
  @JoiSchema([UPDATE], Joi.string().uri().optional())
  data_uri: string;

  @JoiSchema(Joi.date().forbidden())
  created_at: Date;

  @JoiSchema(Joi.date().forbidden())
  updated_at: Date;

  @JoiSchema(Joi.string().optional())
  ipfs_hash?: string;

  @JoiSchema(Joi.string().optional())
  nft_contract?: string;

  @JoiSchema(Joi.string().optional())
  token_id?: string;
}
