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
import { NftEntity } from './entities/nft.entity';
import { NftService } from './nft.service';
import { CurrentUser } from '../decoraters/user.decorator';
import { User } from 'src/user/entities/user.entity';
import { NftPaginationParams, NftFilterParams } from './params';
import { ParseJSONArrayPipe } from 'src/pipes/ParseJSONArrayPipe';
import { FilterParams } from 'src/types';

export interface UpdateNft {
  attributes: string;
  value?: string;
}

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('sort', new ParseJSONArrayPipe())
    sort?: string[],
    @Query('filter', new ParseJSONArrayPipe()) filter?: FilterParams,
    @Query('range', new ParseJSONArrayPipe())
    range?: number[],
  ) {
    // this.#validatePaginationParams(params);
    return this.nftService.findAll({
      sort,
      filter,
      range
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
    @Body() updateNft: UpdateNft,
    @CurrentUser() user: User,
    @UploadedFile() picture: any,
    @Param('id') nftId?: number,
  ): Promise<NftEntity> {
    console.log(updateNft)
   const updatablaNft = this.nftService.transformFormDataToUpdatableNft(
      typeof updateNft.attributes === 'string' ? [updateNft.attributes] : updateNft.attributes,
      typeof updateNft.value === 'string' ? [updateNft.value] : updateNft.value
    )

    return await this.nftService.apply(
      user,
      nftId,
      updatablaNft,
    );
  }

  #validatePaginationParams(params: NftPaginationParams): void {
    if (params.page < 1 || params.pageSize < 1) {
      throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST);
    }
  }
}