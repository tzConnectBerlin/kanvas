import { Module, DynamicModule } from '@nestjs/common';
import { CurrencyService, getRatesFromCoinbase, GetRatesFunc } from './currency.service';

@Module({})
export class CurrencyModule {
  public static forRoot(getRatesFunc: GetRatesFunc = getRatesFromCoinbase): DynamicModule {
    return {
      module: CurrencyModule,
      providers: [{provide: 'RATES GETTER', useValue: getRatesFunc}, CurrencyService],
      exports: [CurrencyService],
      global: true,
    };
  }
}
