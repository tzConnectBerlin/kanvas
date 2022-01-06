import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { NftService } from 'src/nft/service/nft.service';
import { DbModule } from 'src/db.module';
import { MintService } from 'src/nft/service/mint.service';
import { S3Service } from 'src/s3.service';
import { CategoryService } from 'src/category/service/category.service';

@Module({
  imports: [DbModule],
  controllers: [UserController],
  providers: [CategoryService, NftService, UserService, S3Service, MintService],
})
export class UserModule {}
