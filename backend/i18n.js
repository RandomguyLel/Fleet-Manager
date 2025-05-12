const i18next = require('i18next');
const fs = require('fs');
const path = require('path');

// Load translation files
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../frontend/src/i18n/translations/en.json'), 'utf8'));
const lv = JSON.parse(fs.readFileSync(path.join(__dirname, '../frontend/src/i18n/translations/lv.json'), 'utf8'));

i18next.init({
  resources: {
    en: { translation: en },
    lv: { translation: lv },
  },
  lng: 'en', // default language, can be changed dynamically
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

module.exports = i18next; 