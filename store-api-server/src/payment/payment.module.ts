import { Module } from '@nestjs/common';
import { PaymentController } from './controller/payment.controller';
import { DbModule } from 'src/db.module';
import { PaymentService } from './service/payment.service';
import { UserModule } from 'src/user/user.module';
import { NftModule } from 'src/nft/nft.module';

@Module({
  imports: [DbModule, UserModule, NftModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
