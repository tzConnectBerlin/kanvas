import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import {DateTime, Duration} from 'luxon';

@Injectable()
export class CurrencyConverter {
  rates: { [key: string]: number };
  lastUpdatedAt: DateTime;
  baseCurrency: string;
  currencies: string[];

  constructor() {
    this.rates = {};

    // todo, make configurable
    this.baseCurrency = 'EUR';
    this.currencies = ['USD', 'GBP', 'XTZ'];
  }

  getConversionRate(toCurrency: string, maxAge: Duration = Duration.fromObject({ minutes: 30 })): number {
    const ratesAge = DateTime.utc().diff(this.lastUpdatedAt);
    if (ratesAge > maxAge) {
      const errMsg = "currency rates' last update is too long ago, cannot safely convert currencies";
      Logger.error(`${errMsg} (rates update age is ${ratesAge}`);
      throw errMsg;
    }
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
        this.lastUpdatedAt = DateTime.utc();
        Logger.log(logMsg);
      })
      .catch((error: any) => {
        Logger.error(
          `failed to get currency rates from coinbase-api, err: ${error}`,
        );
        throw error;
      });
  }
}
