import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Box, Divider, Select, MenuItem,
} from '@mui/material';
import LocalFloristRoundedIcon from '@mui/icons-material/LocalFloristRounded';
import YardRoundedIcon from '@mui/icons-material/YardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import { useI18n } from '../i18n/useI18n';
import { useColorMode } from '../theme/ThemeContext';
import api from '../services/api';

const DRAWER_WIDTH = 260;

const ENTITY_ICONS = {
  tipo_cultivo: <LocalFloristRoundedIcon />,
  cultivo:      <YardRoundedIcon />,
  producto:     <Inventory2RoundedIcon />,
  proveedor:    <LocalShippingRoundedIcon />,
  persona:      <PeopleRoundedIcon />,
};

const IDIOMAS = [
  { value: 'es', label: '🇨🇴 Español' },
  { value: 'en', label: '🇺🇸 English' },
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'pt', label: '🇧🇷 Português' },
  { value: 'de', label: '🇩🇪 Deutsch' },
];

function NavItem({ icon, label, selected, onClick, bg, hover, selectedBg }) {
  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{
        borderRadius: 2, mb: 0.5,
        color: selected ? '#fff' : 'rgba(255,255,255,0.7)',
        bgcolor: selected ? selectedBg : 'transparent',
        transition: 'all 0.15s',
        '&:hover': { bgcolor: hover, color: '#fff' },
        '&.Mui-selected': { bgcolor: selectedBg },
        '&.Mui-selected:hover': { bgcolor: selectedBg },
      }}
    >
      <ListItemIcon sx={{ color: selected ? '#a5d6a7' : 'rgba(255,255,255,0.45)', minWidth: 40, transition: 'color 0.15s' }}>
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{ fontWeight: selected ? 700 : 500, fontSize: '0.88rem' }}
      />
      {selected && (
        <Box sx={{ width: 4, height: 28, borderRadius: 2, bgcolor: '#a5d6a7', ml: 1 }} />
      )}
    </ListItemButton>
  );
}

export default function Sidebar({ entidades, vistaActual, setVista, mobileOpen, onClose, usuarioRol }) {
  const { t, lang, setLang } = useI18n();
  const { mode } = useColorMode();

  const isDark      = mode === 'dark';
  const bg          = isDark ? '#0d1a0d' : '#1b5e20';
  const selectedBg  = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.18)';
  const hoverBg     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.10)';

  function handleLangChange(newLang) {
    setLang(newLang);
    api.put('/auth/preferencias', { idioma: newLang }).catch(() => {});
  }

  function navItem(key, icon, label) {
    return (
      <NavItem
        key={key}
        icon={icon}
        label={label}
        selected={vistaActual === key}
        onClick={() => { setVista(key); onClose?.(); }}
        selectedBg={selectedBg}
        hover={hoverBg}
      />
    );
  }

  const sectionLabel = (text) => (
    <Typography
      variant="caption"
      sx={{
        color: 'rgba(255,255,255,0.4)', px: 1.5, pt: 1.5, pb: 0.5,
        display: 'block', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.65rem',
      }}
    >
      {text}
    </Typography>
  );

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: bg }}>
      <Toolbar sx={{ px: 2.5, minHeight: { xs: 56, sm: 64 } }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', userSelect: 'none' }}>
          🌱 Invernadero
        </Typography>
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      <List sx={{ flexGrow: 1, px: 1.5, pt: 1.5, pb: 1, overflowY: 'auto' }}>
        {usuarioRol !== 'ADMIN' && (
          <>
            {sectionLabel('Gestión')}
            {entidades.map(ent => navItem(ent, ENTITY_ICONS[ent], t(`entidades.${ent}.titulo`)))}
          </>
        )}

        {/* Perfil */}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
        {navItem('perfil', <AccountCircleRoundedIcon />, t('perfil.titulo'))}

        {/* Admin section */}
        {usuarioRol === 'ADMIN' && (
          <>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
            {sectionLabel('Administracion')}
            {navItem('admin_usuarios',  <GroupRoundedIcon />,   t('admin.usuarios.titulo'))}
            {navItem('admin_auditoria', <HistoryRoundedIcon />, t('admin.auditoria.titulo'))}
          </>
        )}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mb: 1, display: 'block', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
          Idioma / Language
        </Typography>
        <Select
          value={lang}
          onChange={e => handleLangChange(e.target.value)}
          size="small" fullWidth
          sx={{
            color: '#fff', fontSize: '0.85rem',
            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
            '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.6)' },
          }}
          MenuProps={{ PaperProps: { sx: { bgcolor: bg, color: '#fff' } } }}
        >
          {IDIOMAS.map(({ value, label }) => (
            <MenuItem key={value} value={value} sx={{ color: '#fff', fontSize: '0.85rem' }}>{label}</MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary" open={mobileOpen} onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', bgcolor: bg, border: 'none' },
        }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', bgcolor: bg, border: 'none', boxShadow: isDark ? 'none' : '2px 0 16px rgba(0,0,0,0.08)' },
        }}
        open
      >
        {content}
      </Drawer>
    </Box>
  );
}
