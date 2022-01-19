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

interface UpdateNft {
  attribute: string;
  value?: string;
}

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User) {
    return this.nftService.create(user);
  }

  @Get()
  async findAll(@Query() params: NftFilterParams) {
    this.#validatePaginationParams(params);
    return this.nftService.findAll(params);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number, @CurrentUser() user: User) {
    return await this.nftService.getNft(user, id);
  }

  @UseInterceptors(
    FileInterceptor('data', {
      limits: { fileSize: NFT_IMAGE_MAX_BYTES },
    }),
  )
  @Patch(':id/setContent')
  @UseGuards(JwtAuthGuard)
  async setContent(
    @Param('id') nftId: number,
    @CurrentUser() user: User,
    @UploadedFile() picture: any,
  ): Promise<NftEntity> {
    if (typeof picture === 'undefined') {
      throw new HttpException(`expected file upload`, HttpStatus.BAD_REQUEST);
    }
    return await this.nftService.setContent(user, nftId, picture);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') nftId: number,
    @Body() updateNft: UpdateNft,
    @CurrentUser() user: User,
  ): Promise<NftEntity> {
    if (updateNft.attribute === this.nftService.CONTENT_KEYWORD) {
      throw new HttpException(
        `attribute=${this.nftService.CONTENT_KEYWORD} is a reserved attribute that is not allowed to be set through this endpoint`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.nftService.apply(
      user,
      nftId,
      updateNft.attribute,
      updateNft.value,
    );
  }

  #validatePaginationParams(params: NftPaginationParams): void {
    if (params.page < 1 || params.pageSize < 1) {
      throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST);
    }
  }
}
