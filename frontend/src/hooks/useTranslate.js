import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Custom hook for hybrid translation.
 * 1. Checks if the text matches a static i18n key.
 * 2. If not, uses AI to translate dynamically only if requested and visible.
 * 3. Shows "Translating..." state for dynamic content while loading.
 */
const useTranslate = (text, options = {}) => {
  const { language, t, translateDynamic } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  // Default visible to true unless explicitly provided
  const isVisible = options.visible !== undefined ? options.visible : true;

  useEffect(() => {
    let isMounted = true;

    const handleTranslation = async () => {
      if (!text) {
        setTranslatedText('');
        return;
      }
      
      if (language === 'en') {
        setTranslatedText(text);
        setIsTranslating(false);
        return;
      }

      // 1. Check if it's a valid i18n key (e.g. "nav.home")
      const staticResult = t(text);
      if (staticResult !== text) {
        setTranslatedText(staticResult);
        setIsTranslating(false);
        return;
      }

      // 2. If it's explicitly marked as static but not found in JSON, don't use AI
      if (options.isStatic) {
        setTranslatedText(text);
        setIsTranslating(false);
        return;
      }

      // 3. Only use AI for dynamic content if visible
      if (!isVisible) {
        return;
      }

      const isDynamic = options.dynamic || text.length > 40;

      if (isDynamic) {
        // 1. Check persistent cache FIRST
        const cacheKey = `${language}_${text}`;
        const cached = localStorage.getItem("dynamic_translation_cache");
        if (cached) {
          const cache = JSON.parse(cached);
          if (cache[cacheKey]) {
            setTranslatedText(cache[cacheKey]);
            setIsTranslating(false);
            return;
          }
        }

        // 2. If not in cache, set loading state and fetch
        setIsTranslating(true);
        try {
          // TranslationService handles queueing, retries, and sequential processing
          const dynamicResult = await translateDynamic(text);
          if (isMounted) {
            setTranslatedText(dynamicResult || text);
            setIsTranslating(false);
          }
        } catch (error) {
          console.error("[i18n] Hook error:", error);
          if (isMounted) {
            setTranslatedText(text);
            setIsTranslating(false);
          }
        }
      } else {
        if (isMounted) {
          setTranslatedText(text);
          setIsTranslating(false);
        }
      }
    };

    handleTranslation();

    return () => {
      isMounted = false;
    };
  }, [text, language, t, translateDynamic, options.isStatic, options.dynamic, isVisible]);

  // Return "Translating..." for dynamic content if in progress
  if (isTranslating && language !== 'en') {
    return t('common.translating', 'Translating...');
  }

  return translatedText;
};

export default useTranslate;
