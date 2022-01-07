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
import { ParseJSONArrayPipe } from 'src/pipes/ParseJSONArrayPipe';
import { FilterParams } from 'src/types';
import { NftDto } from './dto/nft.dto';
import { NftService } from './nft.service';
import { UpdateNftGuard } from './update-nft.guard';
import { CurrentUser } from '../decoraters/user.decorator';
import { User } from 'src/user/entities/user.entity';

interface UpdateNft {
  attribute: string;
  value?: string;
}

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: NFT_IMAGE_MAX_BYTES },
    }),
  )
  create(
    @CurrentUser() user: User,
    @Body(new ParseJSONArrayPipe()) createNftDto: NftDto,
    @UploadedFile() image: any,
  ) {
    /*
     * TODO
    if (!image) {
      throw new HttpException(
        'NFT image required when creating an NFT',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    */
    return this.nftService.create(
      user,
      { ...createNftDto, nftState: 'setup_nft' },
      image,
    );
  }

  @Get()
  findAll(
    @Query('sort', new ParseJSONArrayPipe())
    sort?: string[],
    @Query('filter', new ParseJSONArrayPipe()) filter?: FilterParams,
    @Query('range', new ParseJSONArrayPipe())
    range?: number[],
  ) {
    return this.nftService.findAll({ sort, filter, range });
  }

  @UseGuards(JwtAuthGuard, UpdateNftGuard)
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: number, @CurrentUser() user: User) {
    return this.nftService.getNft(user, id);
  }

  @UseGuards(JwtAuthGuard, UpdateNftGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: NFT_IMAGE_MAX_BYTES },
    }),
  )
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') nftId: number,
    @Body() updateNft: UpdateNft,
    @CurrentUser() user: User,
  ): Promise<NftDto> {
    return await this.nftService.apply(
      user,
      nftId,
      updateNft.attribute,
      updateNft.value,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: number) {
    return this.nftService.remove(id);
  }
}
