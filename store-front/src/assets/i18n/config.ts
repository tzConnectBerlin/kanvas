import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// import Backend from 'i18next-http-backend';
import German from './de/translation.json';
import English from './en/translation.json';
import French from './fr/translation.json';
import Arabic from './ab/translation.json';

const resources = {
    '': {
        translation: English,
    },
    en: {
        translation: English,
    },
    fr: {
        translation: French,
    },
    de: {
        translation: German,
    },
    ab: {
        translation: Arabic,
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources,
    });

// export default i18n.changeLanguage('fr');
