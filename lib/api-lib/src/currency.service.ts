import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { DateTime, Duration } from 'luxon';
import { DEFAULT_MAX_RATE_AGE_MINUTES, BASE_CURRENCY, SUPPORTED_CURRENCIES, LOG_CURRENCY_RATES_UPDATES } from './constants';

export type Rates = { [key: string]: number };
export type GetRatesFunc = (currencies: string[]) => Promise<Rates>;

@Injectable()
export class CurrencyService {
  currencies: string[] = Object.keys(SUPPORTED_CURRENCIES).filter(
    (c) => c != BASE_CURRENCY,
  );

  baseCurrencyDecimals = SUPPORTED_CURRENCIES[BASE_CURRENCY];

  rates: Rates;
  lastUpdatedAt: DateTime;
  getNewRatesFunc: GetRatesFunc;
  logUpdates: boolean = LOG_CURRENCY_RATES_UPDATES;

  constructor(@Inject('RATES GETTER') getNewRatesFunc: GetRatesFunc) {
    this.getNewRatesFunc = getNewRatesFunc;

    this.rates = {};
    for (const currency of this.currencies) {
      this.rates[currency] = 1;
    }
    this.lastUpdatedAt = DateTime.fromSeconds(0, { zone: 'UTC' });

    this.updateRates();
  }

  convertToCurrency(
    baseUnitAmount: number,
    toCurrency: string,
    inBaseUnit: boolean = false,
    maxAge: Duration = Duration.fromObject({ minutes: DEFAULT_MAX_RATE_AGE_MINUTES }),
  ): string {
    if (inBaseUnit && toCurrency === BASE_CURRENCY) {
      return baseUnitAmount.toFixed(0);
    }

    const decimals = inBaseUnit ? 0 : SUPPORTED_CURRENCIES[toCurrency];
    return (baseUnitAmount * this.#getRate(toCurrency, maxAge, inBaseUnit)).toFixed(
      decimals,
    );
  }

  convertFromCurrency(
    amount: number,
    fromCurrency: string,
    maxAge: Duration = Duration.fromObject({ minutes: DEFAULT_MAX_RATE_AGE_MINUTES }),
  ): number {
    return Number((amount / this.#getRate(fromCurrency, maxAge)).toFixed(0));
  }

  convertToBaseUnit(
    currency: string,
    amount: number,
  ): number {
      const decimals = SUPPORTED_CURRENCIES[currency];
      const amountUnit = Math.round(amount * Math.pow(10, decimals));
      return amountUnit;
  }

  convertFromBaseUnit(
    currency: string,
    amountUnit: number,
  ): number {
      const decimals = SUPPORTED_CURRENCIES[currency];
      const amount = amountUnit * Math.pow(10, -decimals);
      return amount;
  }

  toFixedDecimals(
    currency: string,
    amount: number,
  ): string {
      const decimals = SUPPORTED_CURRENCIES[currency];
      return amount.toFixed(decimals);
  }

  #getRate(
    toCurrency: string,
    maxAge: Duration,
    inBaseUnit: boolean = false,
  ): number {
    if (toCurrency === BASE_CURRENCY) {
      return inBaseUnit ? 1 : Math.pow(10, -this.baseCurrencyDecimals);
    }

    if (!this.currencies.includes(toCurrency)) {
      throw `cannot convert currency to unsupported ${toCurrency}`;
    }

    const ratesAge = DateTime.utc().diff(this.lastUpdatedAt);
    if (maxAge > Duration.fromObject({minutes: 0}) && ratesAge > maxAge) {
      throw `currency rates' last update is too long ago, cannot safely convert currencies (rates update age is ${ratesAge})`;
    }

    return (
      this.rates[toCurrency] *
      Math.pow(
        10,
        -this.baseCurrencyDecimals +
          (inBaseUnit ? SUPPORTED_CURRENCIES[toCurrency] : 0),
      )
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateRates() {
    let ratesData;
    try {
      ratesData = await this.getNewRatesFunc(this.currencies);
    } catch (err: any) {
      Logger.error(err);
      return;
    }

    let logMsg = 'new rates:';
    for (const curr of this.currencies) {
      this.rates[curr] = Number(ratesData[curr]);

      logMsg += `  ${this.rates[curr].toFixed(3)} ${curr}/${BASE_CURRENCY}`;
    }
    this.lastUpdatedAt = DateTime.utc();
    if (this.logUpdates) {
      Logger.log(logMsg);
    }
  }
}

export async function getRatesFromCoinbase(
  currencies: string[],
): Promise<{ [key: string]: number }> {
  return await axios
    .get('https://api.coinbase.com/v2/exchange-rates', {
      params: {
        currency: BASE_CURRENCY,
      },
    })
    .then((resp: any) => {
      const res: { [key: string]: number } = {};
      for (const curr of currencies) {
        res[curr] = resp.data.data.rates[curr];
      }
      return res;
    })
    .catch((error: any) => {
      throw `failed to get currency rates from coinbase-api, err: ${error}`;
    });
}
