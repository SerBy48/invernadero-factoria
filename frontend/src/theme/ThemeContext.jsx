import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ColorModeContext = createContext(null);

export function useColorMode() {
  return useContext(ColorModeContext);
}

function makeTheme(mode) {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: isDark
        ? { main: '#66bb6a', light: '#98ee99', dark: '#338a3e', contrastText: '#000' }
        : { main: '#2e7d32', light: '#60ad5e', dark: '#1b5e20', contrastText: '#fff' },
      secondary: { main: '#8bc34a', light: '#bef67a', dark: '#5a9216' },
      background: isDark
        ? { default: '#0d1b0e', paper: '#132213' }
        : { default: '#f0f7f0', paper: '#ffffff' },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(46,125,50,0.12)',
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      h5: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
      MuiDataGrid: {
        styleOverrides: {
          root: { border: 'none' },
          columnHeader: { backgroundColor: isDark ? '#1a2e1a' : '#e8f5e9' },
          columnHeaders: { backgroundColor: isDark ? '#1a2e1a' : '#e8f5e9' },
        },
      },
    },
  });
}

export function ColorModeProvider({ children }) {
  const [mode, setModeState] = useState(
    () => localStorage.getItem('colorMode') || 'light'
  );

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    localStorage.setItem('colorMode', newMode);
  }, []);

  const toggleColorMode = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    });
  }, []);

  const theme = useMemo(() => makeTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
