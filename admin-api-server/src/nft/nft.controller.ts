import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NftService } from './nft.service';
import { CreateNftDto } from './dto/create-nft.dto';
import { UpdateNftDto } from './dto/update-nft.dto';
import { CurrentUser } from '../decoraters/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface UpdateNft {
  attribute: string
  value?: string
}

@Controller('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Post()
  create(@Body() createNftDto: CreateNftDto) {
    return this.nftService.create(createNftDto);
  }

  @Get()
  findAll() {
    return this.nftService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nftService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user?: UserEntity,@Param('id') nftId: number, @Body() updateNft: UpdateNft) {
    try {
      const stmRes = await this.nftService.update(nftId, updateNft.attribute, updateNft.value);
      switch (stmRes.status) {
        case STMStatusResult.NotAllowed:
          throw new HttpException(
            stmRes.message || '',
            HttpStatus.NOT_AUTHORIZED,
          );
      }
    } catch (err: any) {
      logger.error(`failed to update nft state, err: ${err}`)
        throw new HttpException(
          'failed to update nft state,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
  }

  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nftService.remove(+id);
  }
}
