import { Module, DynamicModule } from '@nestjs/common';
import { CurrencyService, getRatesFromCoinbase, GetRatesFunc } from './currency.service';

@Module({})
export class CurrencyModule {
  public static forRoot(dbModule: any, getRatesFunc: GetRatesFunc = getRatesFromCoinbase): DynamicModule {
    return {
      module: CurrencyModule,
      imports: [dbModule],
      providers: [{provide: 'RATES GETTER', useValue: getRatesFunc}, CurrencyService],
      exports: [CurrencyService],
      global: true,
    };
  }

  constructor(private currencyService: CurrencyService) {}

  async onModuleDestroy() {
    this.currencyService.dbConn = undefined;
  }
}
