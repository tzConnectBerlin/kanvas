import {
  Logger,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { NFT_IMAGE_MAX_BYTES } from 'src/constants';
import { NftEntity, NftUpdate } from '../entities/nft.entity';
import { NftService } from '../service/nft.service';
import { CurrentUser } from 'src/decoraters/user.decorator';
import { User } from 'src/user/entities/user.entity';
import { NftPaginationParams, NftFilterParams } from '../params';
import { ParseJSONArrayPipe } from 'src/pipes/ParseJSONArrayPipe';
import { FilterParams } from 'src/types';

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('sort', new ParseJSONArrayPipe())
    sort?: string[],
    @Query('filter', new ParseJSONArrayPipe()) filter?: FilterParams,
    @Query('range', new ParseJSONArrayPipe())
    range?: number[],
  ) {
    const params = this.#queryParamsToNftFilterParams(filter, sort, range);

    this.#validatePaginationParams(params);
    return await this.nftService.findAll({
      sort,
      filter,
      range,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number, @CurrentUser() user: User) {
    return await this.nftService.getNft(user, id);
  }

  @UseInterceptors(
    FileInterceptor('picture', {
      limits: { fileSize: NFT_IMAGE_MAX_BYTES },
    }),
  )
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Body() updateNft: NftUpdate,
    @CurrentUser() user: User,
    @UploadedFile() picture: any,
    @Param('id') nftId?: number,
  ): Promise<NftEntity> {
    const nftUpdates = this.#transformFormDataToNftUpdates(
      typeof updateNft.attribute === 'string'
        ? [updateNft.attribute]
        : updateNft.attribute,
      typeof updateNft.value === 'string' ? [updateNft.value] : updateNft.value,
    );

    return await this.nftService.apply(user, nftId, nftUpdates);
  }

  #validatePaginationParams(params: NftPaginationParams): void {
    if (params.pageOffset < 0 || params.pageSize < 1) {
      throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST);
    }

    if (
      !['nft_id'].some(
        (allowedSortKey: string) => params.orderBy == allowedSortKey,
      )
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

  #transformFormDataToNftUpdates(attrArray: string[], valueArray: any | any[]) {
    if (attrArray.length !== valueArray.length) {
      throw new HttpException(
        'attribute and value should have the same length',
        HttpStatus.BAD_REQUEST,
      );
    }
    const nftUpdates: NftUpdate[] = [];

    for (const index in attrArray) {
      nftUpdates.push({
        attribute: attrArray[index],
        value: valueArray[index],
      });
    }

    return nftUpdates;
  }

  #queryParamsToFilterParams(
    filter?: FilterParams,
    sort?: string[],
    range?: number[],
  ) {
    const res = new NftFilterParams();

    if (typeof sort !== 'undefined' && sort.length > 0) {
      res.orderBy = sort[0];
      if (sort.length > 1) {
        res.orderDirection = sort[1];
      }
    }

    if (typeof range !== 'undefined' && range.length === 2) {
      res.pageOffset = range[0];
      res.pageSize = range[1] - range[0];
    }

    if (typeof filter !== 'undefined') {
      for (const key of Object.keys(filter)) {
        switch (key) {
          case 'nftStates':
            res.nftStates = filter[key];
            break;
          default:
            throw new HttpException(
              `${key} is not one of the allowed filters`,
              HttpStatus.BAD_REQUEST,
            );
        }
      }
    }

    return res;
  }
}
