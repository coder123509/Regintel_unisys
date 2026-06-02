import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Custom hook for hybrid translation.
 * 1. Checks if the text matches a static i18n key.
 * 2. If not, uses AI to translate dynamically only if requested and visible.
 */
const useTranslate = (text, options = {}) => {
  const { language, t, translateDynamic } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  // Default visible to true unless explicitly provided (for backward compatibility)
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
        return;
      }

      // 1. Check if it's a valid i18n key (e.g. "nav.home")
      const staticResult = t(text);
      if (staticResult !== text) {
        setTranslatedText(staticResult);
        return;
      }

      // 2. If it's explicitly marked as static but not found in JSON, don't use AI
      if (options.isStatic) {
        setTranslatedText(text);
        return;
      }

      // 3. Only use AI for dynamic content if visible
      if (!isVisible) {
        return;
      }

      // We assume it's dynamic if:
      // - Explicitly marked with dynamic: true
      // - Or it's a long string (> 40 chars) which is unlikely to be a UI label
      const isDynamic = options.dynamic || text.length > 40;

      if (isDynamic) {
        try {
          const dynamicResult = await translateDynamic(text);
          if (isMounted) {
            setTranslatedText(dynamicResult);
          }
        } catch (error) {
          console.error("[i18n] Hook error for:", text.substring(0, 20), error);
          if (isMounted) setTranslatedText(text);
        }
      } else {
        // Fallback for short strings that aren't keys
        if (isMounted) setTranslatedText(text);
      }
    };

    handleTranslation();

    return () => {
      isMounted = false;
    };
  }, [text, language, t, translateDynamic, options.isStatic, options.dynamic, isVisible]);

  return translatedText;
};

export default useTranslate;
