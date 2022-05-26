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
        localStorage.setItem('Kanvas - currency', value);
        setCurrency(value);
    };

    return { value: currency, onChange: handleCurrency };
};

const CurrencyProvider: FC<{}> = ({ children }) => {
    const base = localStorage.getItem('Kanvas - currency') ? localStorage.getItem('Kanvas - currency') : BASE_CURRENCY;
    const [currency, setCurrency] = useState(base);

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
