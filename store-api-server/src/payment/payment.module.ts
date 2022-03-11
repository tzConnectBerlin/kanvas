import { Module } from '@nestjs/common';
import { PaymentController } from './controller/payment.controller';
import { DbModule } from 'src/db.module';
import { PaymentService } from './service/payment.service';
import { UserService } from 'src/user/service/user.service';
import { S3Service } from 'src/s3.service';
import { NftService } from 'src/nft/service/nft.service';
import { MintService } from 'src/nft/service/mint.service';
import { CategoryService } from 'src/category/service/category.service';
import { IpfsService } from 'src/nft/service/ipfs.service';

@Module({
  imports: [DbModule],
  controllers: [PaymentController],
  providers: [
    CategoryService,
    MintService,
    PaymentService,
    UserService,
    S3Service,
    NftService,
    IpfsService,
  ],
})
export class PaymentModule {}
