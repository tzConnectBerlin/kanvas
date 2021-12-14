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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
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
  create(@Request() req, @Body() createNftDto: NftDto) {
    return this.nftService.create(req.user, createNftDto);
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
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateNftDto: NftDto) {
    return this.nftService.update(id, updateNftDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: number) {
    return this.nftService.remove(id);
  }
}
