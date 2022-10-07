import { useEffect, useState } from 'react';
import {
  Currency,
  CurrencySymbol,
  CurrencySymbolData,
  SupportedCurrency,
} from '../types/currency';
import { useNotify } from 'react-admin';
import axios from 'axios';

interface GetBaseCurrencyFromAPI {
  notify: (value: string) => void;
}

const getBaseCurrencyFromAPI = async ({
  notify,
}: GetBaseCurrencyFromAPI): Promise<SupportedCurrency> => {
  try {
    const response = await axios.get(
      process.env.REACT_APP_STORE_BASE_URL + 'api/constants',
    );

    const { baseCurrency } = response.data;

    return baseCurrency;
  } catch (e) {
    notify('An error occurred while fetching the base currencies');
  }

  return '';
};

const getCurrencySymbolDataForCurrency = (
  currency: SupportedCurrency,
): CurrencySymbolData | undefined => {
  switch (currency) {
    case Currency.EUR:
      return { symbol: CurrencySymbol.EUR, position: 'after' };
    case Currency.XTZ:
      return { symbol: CurrencySymbol.XTZ, position: 'after' };
    case Currency.USD:
      return { symbol: CurrencySymbol.USD, position: 'before' };
    case Currency.GBP:
      return { symbol: CurrencySymbol.GBP, position: 'before' };
    default:
      return undefined;
  }
};

const UseGetPriceWithCurrency = () => {
  const [baseCurrency, setBaseCurrency] = useState<SupportedCurrency>('');
  const notify = useNotify();

  useEffect(() => {
    getBaseCurrencyFromAPI({ notify }).then((baseCurrency) => {
      setBaseCurrency(baseCurrency);
    });
  }, []);

  const getPriceWithCurrency = (price: string) => {
    const currencySymbolData = getCurrencySymbolDataForCurrency(baseCurrency);

    if (currencySymbolData && currencySymbolData.position === 'before') {
      return `${currencySymbolData.symbol}${price}`;
    }

    if (currencySymbolData && currencySymbolData.position === 'after') {
      return `${price}${currencySymbolData.symbol}`;
    }

    return price;
  };

  return {
    getPriceWithCurrency,
  };
};

export default UseGetPriceWithCurrency;
