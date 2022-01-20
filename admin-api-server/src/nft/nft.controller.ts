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
  attribute: string;
  value?: string;
}

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: User) {
    return await this.nftService.create(user);
  }

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
    @Param('id') nftId: number,
    @Body() updateNft: UpdateNft,
    @CurrentUser() user: User,
    @UploadedFile() picture: any
  ): Promise<NftEntity> {

    if (updateNft.attribute === this.nftService.CONTENT_KEYWORD) {
      await this.nftService.setContent(user, nftId, updateNft.value);
    }

    const updatablaNft = this.nftService.transformFormDataToUpdatableNft(
      typeof updateNft.attribute === 'string' ? [updateNft.attribute] : updateNft.attribute,
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
