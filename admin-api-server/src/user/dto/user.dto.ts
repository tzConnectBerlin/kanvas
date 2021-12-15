import { JoiSchema, JoiSchemaOptions, CREATE, UPDATE } from 'nestjs-joi';
import * as Joi from 'joi';

@JoiSchemaOptions({
  allowUnknown: false,
})
export class UserDto {
  @JoiSchema(Joi.number().optional())
  @JoiSchema([UPDATE], Joi.number().required())
  id: number;

  @JoiSchema(Joi.string().required().email())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.string().optional())
  email: string;

  @JoiSchema(Joi.string().required())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.string().optional())
  userName: string;

  @JoiSchema(Joi.string().required())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.string().optional())
  address: string;

  @JoiSchema(Joi.string().required())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.forbidden())
  password?: string;

  @JoiSchema(Joi.array().items(Joi.number()))
  @JoiSchema([CREATE], Joi.array().items(Joi.number()).required())
  @JoiSchema([UPDATE], Joi.array().items(Joi.number()).optional())
  roles: number[];
}
