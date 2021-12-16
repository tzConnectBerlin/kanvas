import {
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
    @Request() req,
    @Body(new ParseJSONArrayPipe()) createNftDto: NftDto,
    @UploadedFile() image: any,
  ) {
    if (!image) {
      throw new HttpException(
        'NFT image required when creating an NFT',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this.nftService.create(
      req.user,
      { ...createNftDto, nftState: 'proposal' },
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

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.nftService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, UpdateNftGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: NFT_IMAGE_MAX_BYTES },
    }),
  )
  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body(new ParseJSONArrayPipe()) updateNftDto: NftDto,
    @UploadedFile() image,
  ) {
    return this.nftService.update(id, updateNftDto, image);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: number) {
    return this.nftService.remove(id);
  }
}
