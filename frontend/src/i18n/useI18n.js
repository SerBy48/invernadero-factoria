import { createContext, useContext, useState, useCallback, createElement } from 'react';
import es from './es.json';
import en from './en.json';
import fr from './fr.json';
import pt from './pt.json';
import de from './de.json';

const translations = { es, en, fr, pt, de };

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('lang') || 'es'
  );

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
    document.documentElement.lang = newLang;
  }, []);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let val = translations[lang] ?? translations['es'];
    for (const k of keys) {
      val = val?.[k];
      if (val === undefined) return key;
    }
    return val;
  }, [lang]);

  return createElement(
    I18nContext.Provider,
    { value: { t, lang, setLang } },
    children
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export default useI18n;
