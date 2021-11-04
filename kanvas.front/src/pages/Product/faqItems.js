/**
 * Constant that contains the content of the faq component (title & question)
 * @type {function}
 * @param {func} i18n - i18n function for translating the content
 * @param {string} cidkUrl - the link to cidk portal
 * @return {array} - an array with the faq questions and answers
 */
export const faqItems = (i18n, cidkUrl) => [
  {
    question: i18n('FAQ_fda_01_request'),
    answer: i18n('FAQ_fda_01_response'),
    id: 'faq-item-1'
  },
  {
    question: i18n('FAQ_fda_02_request'),
    answer: i18n('FAQ_fda_02_response'),
    id: 'faq-item-2'
  },
  {
    question: i18n('FAQ_fda_03_request'),
    answer: i18n('FAQ_fda_03_response'),
    id: i18n('faq-item-3')
  },
  {
    question: i18n('FAQ_fda_04_request'),
    answer: i18n('FAQ_fda_04_response'),
    id: 'faq-item-4'
  },
  {
    question: i18n('FAQ_fda_05_request'),
    answer: i18n('FAQ_fda_05_response'),
    id: 'faq-item-5'
  },
  {
    question: i18n('FAQ_fda_06_request'),
    answer: i18n('FAQ_fda_06_response').replace('{cidkUrl}', cidkUrl),
    id: 'faq-item-6'
  },
  {
    question: i18n('FAQ_fda_07_request'),
    answer: i18n('FAQ_fda_07_response'),
    id: 'faq-item-7'
  },
  {
    question: i18n('FAQ_fda_08_request'),
    answer: i18n('FAQ_fda_08_response'),
    id: 'faq-item-8'
  },
  {
    question: i18n('FAQ_fda_09_request'),
    answer: i18n('FAQ_fda_09_response'),
    id: 'faq-item-9'
  },
  {
    question: i18n('FAQ_fda_10_request'),
    answer: i18n('FAQ_fda_10_response'),
    id: 'faq-item-10'
  }
];
