import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import ReactDOM from 'react-dom';
import reportWebVitals from './reportWebVitals';
import { IntlProvider } from 'react-intl';
import { CurrencyProvider } from './currency';

const locale = 'en';

const setupAndRender = async () => {
    ReactDOM.render(
        <IntlProvider locale={locale} defaultLocale="en">
            <CurrencyProvider>
                <App />
            </CurrencyProvider>
        </IntlProvider>,
        document.getElementById('root'),
    );
};

setupAndRender();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
