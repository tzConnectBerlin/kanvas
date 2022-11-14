import { Module } from '@nestjs/common';
import { PaymentController } from './controller/payment.controller.js';
import { DbModule } from '../db.module.js';
import { PaymentService } from './service/payment.service.js';
import { UserModule } from '../user/user.module.js';
import { NftModule } from '../nft/nft.module.js';

@Module({
  imports: [DbModule, UserModule, NftModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
