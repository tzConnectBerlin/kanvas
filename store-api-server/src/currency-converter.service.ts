import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class CurrencyConverter {
  rates: { [key: string]: number };
  baseCurrency: string;
  currencies: string[];

  constructor() {
    // todo, make configurable
    this.rates = {};
    this.baseCurrency = 'EUR';
    this.currencies = ['USD', 'GBP', 'XTZ'];
  }

  getConversionRate(toCurrency: string): number {
    return this.rates[toCurrency];
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateRates() {
    await axios
      .get('https://api.coinbase.com/v2/exchange-rates', {
        params: {
          currency: this.baseCurrency,
        },
      })
      .then((resp: any) => {
        let logMsg = 'new rates:';
        for (const curr of this.currencies) {
          this.rates[curr] = Number(resp.data.data.rates[curr]);

          logMsg += `  ${this.rates[curr].toFixed(3)} ${curr}/${
            this.baseCurrency
          }`;
        }
        Logger.log(logMsg);
      })
      .catch(function (error: any) {
        Logger.error(
          `failed to get currency rates from coinbase-api, err: ${error}`,
        );
        throw error;
      });
  }
}
