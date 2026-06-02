import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import TranslationService from '../services/TranslationService';
import '../i18n/i18n'; // Import i18n config

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n, t: i18nTranslate } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'en');

  // Static translation using i18next
  const t = useCallback((key, options) => {
    return i18nTranslate(key, options);
  }, [i18nTranslate]);

  // Dynamic translation using Gemini
  const translateDynamic = useCallback(async (text) => {
    if (language === 'en') return text;
    return await TranslationService.translate(text, language);
  }, [language]);

  const changeLanguage = useCallback((newLang) => {
    if (newLang === language) return;
    
    // Simple debounce to avoid rapid clicks
    if (window._langTimeout) clearTimeout(window._langTimeout);
    window._langTimeout = setTimeout(() => {
      i18n.changeLanguage(newLang);
      setLanguage(newLang);
      localStorage.setItem('app_language', newLang);
    }, 150);
  }, [i18n, language]);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: changeLanguage, 
      t, 
      translateDynamic 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
