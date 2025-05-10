import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ collapsed }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className={`flex items-center ${collapsed ? 'flex-col space-y-2 space-x-0' : 'flex-row space-x-2'}`}>
      <button
        className={`px-3 py-1 rounded ${i18n.language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => changeLanguage('en')}
      >
        EN
      </button>
      <button
        className={`px-3 py-1 rounded ${i18n.language === 'lv' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => changeLanguage('lv')}
      >
        LV
      </button>
    </div>
  );
};

export default LanguageSwitcher; 