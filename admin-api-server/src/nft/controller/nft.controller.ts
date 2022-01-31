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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  FILE_MAX_BYTES,
  MAX_FILE_UPLOADS_PER_CALL,
  ALLOWED_FILE_MIMETYPES,
} from 'src/constants';
import { NftEntity, NftUpdate } from '../entities/nft.entity';
import { NftService } from '../service/nft.service';
import { CurrentUser } from 'src/decoraters/user.decorator';
import { User } from 'src/user/entities/user.entity';
import { NftFilterParams, NftFilters } from '../params';
import { ParseJSONArrayPipe } from 'src/pipes/ParseJSONArrayPipe';
import { PaginationParams, queryParamsToPaginationParams, validatePaginationParams } from 'src/utils';

function pngFileFilter(req: any, file: any, callback: any) {
  if (
    !ALLOWED_FILE_MIMETYPES.some(
      (mimeAllowed: string) => file.mimetype === mimeAllowed,
    )
  ) {
    req.fileValidationError = 'Invalid file type';
    return callback(new Error('Invalid file type'), false);
  }

  return callback(null, true);
}

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) { }

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

    return { data: await this.nftService.findAll(params) };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number, @CurrentUser() user: User) {
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
  @Patch(':id')
  async update(
    @Body() nftUpdatesBody: any,
    @CurrentUser() user: User,
    @UploadedFiles() filesArray?: any[],
    @Param('id') nftId?: number,
  ): Promise<NftEntity> {

    const nftUpdates = this.#transformFormDataToNftUpdates(
      nftUpdatesBody,
      filesArray,
    );

    return await this.nftService.applyNftUpdates(user, nftId, nftUpdates);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@CurrentUser() user: User, @Param('id') nftId?: number) {
    return await this.nftService.deleteNft(user, nftId);
  }

  #validatePaginationParams(params: PaginationParams): void {
    if (params.pageOffset < 0 || params.pageSize < 1) {
      throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST);
    }

    if (
      !this.nftService
        .getSortableFields()
        .some((allowedSortKey: string) => params.orderBy == allowedSortKey)
    ) {
      throw new HttpException(
        `${params.orderBy} is not one of the allowed sort keys`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      !['asc', 'desc'].some(
        (allowedOrderDir: string) => params.orderDirection == allowedOrderDir,
      )
    ) {
      throw new HttpException(
        `${params.orderDirection} is not one of the allowed sort directions`,
        HttpStatus.BAD_REQUEST,
      );
    }
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
      filters: filters
    }
  }
}
