import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard.js';
import { MAX_FILE_UPLOADS_PER_CALL } from '../../constants.js';
import { NftEntity, NftUpdate } from '../entities/nft.entity.js';
import { NftService } from '../service/nft.service.js';
import { CurrentUser } from '../../decoraters/user.decorator.js';
import { UserEntity } from '../../user/entities/user.entity.js';
import { NftFilterParams, NftFilters } from '../params.js';
import { ParseJSONArrayPipe } from '../../pipes/ParseJSONArrayPipe.js';
import {
  queryParamsToPaginationParams,
  validatePaginationParams,
} from '../../utils.js';
import { ContentRestrictions } from 'kanvas-stm-lib';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const filesizeHuman = require('filesize').partial({ standard: 'jedec' });

let getContentRestrictions: (
  attrName: string,
) => ContentRestrictions | undefined;
function contentFilter(req: any, file: any, callback: any) {
  if (typeof getContentRestrictions === 'undefined') {
    return callback(null, true);
  }

  const restrictions = getContentRestrictions(file.originalname);
  if (typeof restrictions === 'undefined') {
    return callback(null, true);
  }

  const mimetypes = restrictions.mimetypes;
  if (
    typeof mimetypes !== 'undefined' &&
    !mimetypes.some((mimeAllowed: string) => file.mimetype === mimeAllowed)
  ) {
    const err = `Invalid file type (${
      file.mimetype
    }), allowed types: ${JSON.stringify(mimetypes)}`;
    req.fileValidationError = err;
    return callback(new HttpException(err, HttpStatus.BAD_REQUEST), false);
  }

  return callback(null, true);
}

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {
    getContentRestrictions = (
      attrName: string,
    ): ContentRestrictions | undefined => {
      return this.nftService.getContentRestrictions(attrName);
    };
  }

  @Get('/attributes')
  @UseGuards(JwtAuthGuard)
  getAttributes() {
    return this.nftService.getAttributes();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() filters: NftFilters,
    @Query('sort', new ParseJSONArrayPipe())
    sort?: string[],
    @Query('range', new ParseJSONArrayPipe())
    range?: number[],
  ) {
    const params = this.#queryParamsToFilterParams(filters, sort, range);

    validatePaginationParams(params, this.nftService.getSortableFields());

    return await this.nftService.findAll(params);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number, @CurrentUser() user: UserEntity) {
    return await this.nftService.getNft(user, id);
  }

  @UseInterceptors(
    FilesInterceptor('files[]', MAX_FILE_UPLOADS_PER_CALL, {
      fileFilter: contentFilter,
    }),
  )
  @UseGuards(JwtAuthGuard)
  @Patch(':id?')
  async update(
    @Body() nftUpdatesBody: any,
    @CurrentUser() user: UserEntity,
    @Param() urlParams: any,
    @UploadedFiles() filesArray?: any[],
  ): Promise<NftEntity> {
    let nftId = urlParams.id;

    if (typeof nftId === 'undefined') {
      nftId = (await this.nftService.createNft(user)).id;
    }
    const nftUpdates = this.#transformFormDataToNftUpdates(
      nftUpdatesBody,
      filesArray,
    );

    return await this.nftService.applyNftUpdates(user, nftId, nftUpdates);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@CurrentUser() user: UserEntity, @Param('id') nftId: number) {
    return await this.nftService.deleteNft(user, nftId);
  }

  #transformFormDataToNftUpdates(nftUpdatesBody: any, filesArray?: any[]) {
    const res: NftUpdate[] = [];

    for (const attr of Object.keys(nftUpdatesBody)) {
      res.push(<NftUpdate>{
        attribute: attr,
        value: nftUpdatesBody[attr],
      });
    }

    if (typeof filesArray === 'undefined') {
      return res;
    }

    for (const file of filesArray) {
      const attrName = file.originalname;

      const restrictions = this.nftService.getContentRestrictions(attrName);
      if (
        typeof restrictions?.maxBytes !== 'undefined' &&
        file.size > restrictions.maxBytes
      ) {
        throw new HttpException(
          `${attrName} too big (file size=${filesizeHuman(
            file.size,
          )}), max allowed size is ${filesizeHuman(restrictions.maxBytes)}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      res.push(<NftUpdate>{
        attribute: file.originalname,
        file: file,
      });
    }

    return res;
  }

  #queryParamsToFilterParams(
    filters?: NftFilters,
    sort?: string[],
    range?: number[],
  ): NftFilterParams {
    return {
      ...new NftFilterParams(),
      ...queryParamsToPaginationParams(sort, range),
      filters: filters,
    };
  }
}
