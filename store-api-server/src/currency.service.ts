import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { DateTime, Duration } from 'luxon';
import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from 'src/constants';

@Injectable()
export class CurrencyService {
  currencies: string[] = SUPPORTED_CURRENCIES.filter((c) => c != BASE_CURRENCY);

  rates: { [key: string]: number };
  lastUpdatedAt: DateTime;

  constructor() {
    this.rates = {};
    this.lastUpdatedAt = DateTime.fromSeconds(0, { zone: 'UTC' });

    this.updateRates();
  }

  convertToCurrency(
    amount: number,
    toCurrency: string,
    maxAge: Duration = Duration.fromObject({ minutes: 30 }),
  ): number {
    if (toCurrency === BASE_CURRENCY) {
      return amount;
    }
    return amount * this.#getRate(toCurrency, maxAge);
  }

  convertFromCurrency(
    amount: number,
    fromCurrency: string,
    maxAge: Duration = Duration.fromObject({ minutes: 30 }),
  ): number {
    if (fromCurrency === BASE_CURRENCY) {
      return amount;
    }
    return amount / this.#getRate(fromCurrency, maxAge);
  }

  #getRate(toCurrency: string, maxAge: Duration) {
    if (!this.currencies.includes(toCurrency)) {
      const errMsg = `cannot convert currency to ${toCurrency}, it's not supported`;
      Logger.error(errMsg);
      throw errMsg;
    }

    const ratesAge = DateTime.utc().diff(this.lastUpdatedAt);
    if (ratesAge > maxAge) {
      const errMsg =
        "currency rates' last update is too long ago, cannot safely convert currencies";
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
          currency: BASE_CURRENCY,
        },
      })
      .then((resp: any) => {
        let logMsg = 'new rates:';
        for (const curr of this.currencies) {
          this.rates[curr] = Number(resp.data.data.rates[curr]);

          logMsg += `  ${this.rates[curr].toFixed(3)} ${curr}/${BASE_CURRENCY}`;
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
