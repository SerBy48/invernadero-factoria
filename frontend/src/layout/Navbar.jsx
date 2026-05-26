import {
  AppBar, Toolbar, Typography, IconButton,
  Avatar, Box, Tooltip, Chip, useTheme, useMediaQuery,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useColorMode } from '../theme/ThemeContext';
import { useI18n } from '../i18n/useI18n';
import api from '../services/api';

export default function Navbar({ usuario, onToggleSidebar }) {
  const { mode, toggleColorMode } = useColorMode();
  const { t } = useI18n();
  const theme   = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isDark  = mode === 'dark';
  const initial = usuario ? usuario[0].toUpperCase() : '?';

  function handleToggleMode() {
    const newIsDark = mode !== 'dark';
    toggleColorMode();
    api.put('/auth/preferencias', { modoOscuro: newIsDark }).catch(() => {});
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: isDark ? 'background.paper' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        color: 'text.primary',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(46,125,50,0.1)'}`,
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
        {isMobile && (
          <IconButton onClick={onToggleSidebar} edge="start" color="inherit" sx={{ mr: 0.5 }}>
            <MenuRoundedIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: '-0.03em', color: 'primary.main', userSelect: 'none' }}
        >
          🌱 {isMobile ? '' : 'Sistema Invernadero'}
        </Typography>

        <Tooltip title={isDark ? 'Modo claro' : 'Modo oscuro'}>
          <IconButton onClick={handleToggleMode} color="inherit" size="small">
            {isDark
              ? <LightModeRoundedIcon sx={{ color: 'secondary.main' }} />
              : <DarkModeRoundedIcon />}
          </IconButton>
        </Tooltip>

        {usuario && (
          <Chip
            avatar={
              <Avatar sx={{ bgcolor: 'primary.main', color: '#fff !important', fontWeight: 700, fontSize: '0.85rem' }}>
                {initial}
              </Avatar>
            }
            label={usuario}
            variant="outlined"
            size="small"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              borderColor: 'primary.light',
              fontWeight: 600,
              fontSize: '0.82rem',
            }}
          />
        )}

        <Tooltip title={t('app.cerrarSesion')}>
          <IconButton onClick={() => { window.location.href = '/logout'; }} color="inherit" size="small">
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
