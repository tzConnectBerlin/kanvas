import { Module } from '@nestjs/common';
import { coinbaseRatesProvider, CurrencyService } from './currency.service';

@Module({
  providers: [coinbaseRatesProvider, CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
