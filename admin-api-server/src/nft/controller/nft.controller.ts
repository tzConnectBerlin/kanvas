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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import {
  FILE_MAX_BYTES,
  MAX_FILE_UPLOADS_PER_CALL,
  ALLOWED_FILE_MIMETYPES,
} from 'src/constants';
import { NftEntity, NftUpdate } from '../entities/nft.entity';
import { NftService } from '../service/nft.service';
import { CurrentUser } from 'src/decoraters/user.decorator';
import { UserEntity } from 'src/user/entities/user.entity';
import { NftFilterParams, NftFilters } from '../params';
import { ParseJSONArrayPipe } from 'src/pipes/ParseJSONArrayPipe';
import {
  queryParamsToPaginationParams,
  validatePaginationParams,
} from 'src/utils';

function pngFileFilter(req: any, file: any, callback: any) {
  if (
    !ALLOWED_FILE_MIMETYPES.some(
      (mimeAllowed: string) => file.mimetype === mimeAllowed,
    )
  ) {
    req.fileValidationError = 'Invalid file type';
    return callback(new Error(`Invalid file type: ${file.mimetype}`), false);
  }

  return callback(null, true);
}

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

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

    /*
    return resp
      .set({
        'Access-Control-Expose-Headers': 'Content-Range',
        'Content-range': result.total,
      })
      .json({ data: result.nfts });
    */
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number, @CurrentUser() user: UserEntity) {
    return await this.nftService.getNft(user, id);
  }

  @UseInterceptors(
    FilesInterceptor('files[]', MAX_FILE_UPLOADS_PER_CALL, {
      fileFilter: pngFileFilter,
      limits: {
        fileSize: FILE_MAX_BYTES,
      },
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

    if (typeof filesArray !== 'undefined') {
      for (const file of filesArray) {
        res.push(<NftUpdate>{
          attribute: file.originalname,
          file: file,
        });
      }
    }

    return res;
  }

  #queryParamsToFilterParams(
    filters?: NftFilters,
    sort?: string[],
    range?: number[],
  ) {
    return {
      ...new NftFilterParams(),
      ...queryParamsToPaginationParams(sort, range),
      filters: filters,
    };
  }
}
