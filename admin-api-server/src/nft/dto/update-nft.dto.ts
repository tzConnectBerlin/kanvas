import { PartialType } from '@nestjs/mapped-types';
import { CreateNftDto } from './create-nft.dto';

export class UpdateNftDto extends PartialType(CreateNftDto) {}
