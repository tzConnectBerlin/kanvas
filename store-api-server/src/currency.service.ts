import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { DateTime, Duration } from 'luxon';
import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from 'src/constants';

export const coinbaseRatesProvider = {
  provide: 'RATES GETTER',
  useValue: getRatesFromCoinbase,
};

@Injectable()
export class CurrencyService {
  currencies: string[] = Object.keys(SUPPORTED_CURRENCIES).filter(
    (c) => c != BASE_CURRENCY,
  );

  baseCurrencyDecimals = SUPPORTED_CURRENCIES[BASE_CURRENCY];

  rates: { [key: string]: number };
  lastUpdatedAt: DateTime;
  getNewRatesFunc: any;

  constructor(@Inject('RATES GETTER') getNewRatesFunc: any) {
    this.getNewRatesFunc = getNewRatesFunc;

    this.rates = {};
    this.lastUpdatedAt = DateTime.fromSeconds(0, { zone: 'UTC' });

    this.updateRates();
  }

  convertToCurrency(
    baseUnitAmount: number,
    toCurrency: string,
    inBaseUnit: boolean = false,
    maxAge: Duration = Duration.fromObject({ minutes: 30 }),
  ): string {
    if (inBaseUnit && toCurrency === BASE_CURRENCY) {
      return baseUnitAmount.toFixed(0);
    }

    const decimals = inBaseUnit ? 0 : SUPPORTED_CURRENCIES[toCurrency];
    const res = (baseUnitAmount * this.#getRate(toCurrency, maxAge)).toFixed(
      decimals,
    );
    Logger.log(
      `converted ${baseUnitAmount} to ${toCurrency} (inBaseUnit? ${JSON.stringify(
        inBaseUnit,
      )})`,
    );
    return res;
  }

  convertFromCurrency(
    amount: number,
    fromCurrency: string,
    maxAge: Duration = Duration.fromObject({ minutes: 30 }),
  ): number {
    return amount / this.#getRate(fromCurrency, maxAge);
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
      const errMsg = `cannot convert currency to unsupported ${toCurrency}`;
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
    Logger.log(logMsg);
  }
}

async function getRatesFromCoinbase(
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
      Logger.error(
        `failed to get currency rates from coinbase-api, err: ${error}`,
      );
      throw error;
    });
}
