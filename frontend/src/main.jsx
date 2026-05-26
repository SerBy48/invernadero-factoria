import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ColorModeProvider } from './theme/ThemeContext.jsx';
import { I18nProvider } from './i18n/useI18n.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ColorModeProvider>
  </React.StrictMode>
);
