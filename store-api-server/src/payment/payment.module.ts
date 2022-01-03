import { Module } from '@nestjs/common';
import { PaymentController } from './controller/payment.controller';
import { DbModule } from 'src/db.module';
import { PaymentService } from './service/payment.service';
import { UserService } from 'src/user/service/user.service';
import { S3Service } from 'src/s3.service';
import { NftService } from 'src/nft/service/nft.service';

@Module({
  imports: [DbModule],
  controllers: [PaymentController],
  providers: [PaymentService, UserService, S3Service, NftService],
})
export class PaymentModule {}
