import { createContext, useContext, useState, FC } from 'react';

const SUPPORTED_CURRENCIES: { [key: string]: number } = {
    USD: 2,
    GBP: 2,
    EUR: 2,
    XTZ: 6,
};

const BASE_CURRENCY: string = process.env['BASE_CURRENCY'] || 'EUR';

const CurrencyContext = createContext<any | null>(null);

const useCurrency = () => {
    const [currency, setCurrency] = useContext(CurrencyContext);

    const handleCurrency = (value: any) => {
        console.log(`Currency changed to ${value}`);
        setCurrency(value);
    };

    return { value: currency, onChange: handleCurrency };
};

const CurrencyProvider: FC<{}> = ({ children }) => {
    const [currency, setCurrency] = useState(BASE_CURRENCY);

    console.log(`CurrencyProvider: ${currency}`);

    return (
        <CurrencyContext.Provider value={[currency, setCurrency]}>
            {children}
        </CurrencyContext.Provider>
    );
};

export {
    CurrencyProvider,
    CurrencyContext,
    useCurrency,
    SUPPORTED_CURRENCIES,
    BASE_CURRENCY,
};
