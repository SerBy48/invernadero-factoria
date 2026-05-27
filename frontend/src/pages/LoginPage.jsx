import { useState } from 'react';
import {
  Box, Typography, TextField, Button, Tabs, Tab,
  Divider, Alert, CircularProgress, InputAdornment, IconButton,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import api from '../services/api';
import { useI18n } from '../i18n/useI18n';

const FEATURE_KEYS = [
  'cultivos',
  'productos',
  'proveedores',
  'personas',
  'idiomas',
];

const IDIOMAS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Francais' },
  { value: 'pt', label: 'Portugues' },
  { value: 'de', label: 'Deutsch' },
];

const INIT_FORM = { nombre: '', email: '', password: '', confirmar: '' };
const INIT_ERRORES = { nombre: '', email: '', password: '', confirmar: '' };

const SOLO_LETRAS = /^[\p{L}\s]+$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarCampo(campo, valor, passwordActual, t) {
  const v = valor || '';
  switch (campo) {
    case 'nombre':
      if (!v.trim()) return t('login.validacion.nombreObligatorio');
      if (!SOLO_LETRAS.test(v)) return t('login.validacion.soloLetras');
      if (v.trim().length < 2) return t('login.validacion.minNombre');
      return '';
    case 'email':
      if (!v.trim()) return t('login.validacion.emailObligatorio');
      if (!EMAIL_REGEX.test(v)) return t('login.validacion.emailFormato');
      return '';
    case 'password':
      if (!v) return t('login.validacion.passwordObligatoria');
      if (v.length < 8) return t('login.validacion.passwordMin');
      if (!/[a-zA-Z]/.test(v)) return t('login.validacion.passwordLetra');
      if (!/\d/.test(v)) return t('login.validacion.passwordNumero');
      return '';
    case 'confirmar':
      if (!v) return t('login.validacion.confirmarObligatorio');
      if (v !== passwordActual) return t('login.validacion.passwordNoCoincide');
      return '';
    default:
      return '';
  }
}

function normalizarErrorLogin(message) {
  if (!message) return null;
  if (message === 'login.cuentaInhabilitada') return message;
  if (message === 'inhabilitado') return 'login.cuentaInhabilitada';
  if (message.toLowerCase().includes('inhabilitad')) return 'login.cuentaInhabilitada';
  return message;
}

function traducirErrorLogin(message, t) {
  const normalizado = normalizarErrorLogin(message);
  if (!normalizado) return null;
  return normalizado.startsWith('login.') ? t(normalizado) : normalizado;
}

export default function LoginPage({ onLoginExitoso, errorExterno }) {
  const { t, lang, setLang } = useI18n();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(INIT_FORM);
  const [errores, setErrores] = useState(INIT_ERRORES);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field) => (e) => {
    const valor = e.target.value;
    setForm(p => ({ ...p, [field]: valor }));
    if (errores[field]) {
      const err = validarCampo(field, valor, field === 'confirmar' ? form.password : valor, t);
      setErrores(p => ({ ...p, [field]: err }));
    }
  };

  const blur = (field) => () => {
    const err = validarCampo(field, form[field], form.password, t);
    setErrores(p => ({ ...p, [field]: err }));
  };

  function cambiarTab(v) {
    setTab(v);
    setError(null);
    setForm(INIT_FORM);
    setErrores(INIT_ERRORES);
  }

  function handleLogin() {
    const emailErr = validarCampo('email', form.email, '', t);
    const passwordErr = form.password ? '' : t('login.validacion.passwordObligatoria');
    setErrores(p => ({ ...p, email: emailErr, password: passwordErr }));
    if (emailErr || passwordErr) return;

    setCargando(true);
    setError(null);
    api.post('/auth/login', { email: form.email, password: form.password })
      .then(() => onLoginExitoso())
      .catch(e => { setError(normalizarErrorLogin(e.message)); setCargando(false); });
  }

  function handleRegistro() {
    const campos = ['nombre', 'email', 'password', 'confirmar'];
    const nuevos = {};
    let hayError = false;
    campos.forEach(c => {
      const err = validarCampo(c, form[c], form.password, t);
      nuevos[c] = err;
      if (err) hayError = true;
    });
    setErrores(nuevos);
    if (hayError) return;

    setCargando(true);
    setError(null);
    api.post('/auth/registro', { nombre: form.nombre, email: form.email, password: form.password })
      .then(() => api.post('/auth/login', { email: form.email, password: form.password }))
      .then(() => onLoginExitoso())
      .catch(e => { setError(normalizarErrorLogin(e.message)); setCargando(false); });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') tab === 0 ? handleLogin() : handleRegistro();
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default', position: 'relative' }}>
      <FormControl
        size="small"
        sx={{
          position: 'absolute',
          top: { xs: 14, sm: 18 },
          left: { xs: 14, sm: 18 },
          minWidth: 142,
          zIndex: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
        }}
      >
        <InputLabel id="login-lang-label">{t('app.idioma')}</InputLabel>
        <Select
          labelId="login-lang-label"
          value={lang}
          label={t('app.idioma')}
          onChange={e => setLang(e.target.value)}
        >
          {IDIOMAS.map(({ value, label }) => (
            <MenuItem key={value} value={value}>{label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: 'linear-gradient(160deg, #1b5e20 0%, #2e7d32 55%, #388e3c 100%)',
          p: { md: 6, lg: 10 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', top: '40%', right: '10%', width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)' }} />

        <Typography variant="h2" sx={{ color: '#fff', fontWeight: 800, letterSpacing: 0, mb: 1, position: 'relative' }}>
          {t('login.marca')}
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.75)', mb: 5, fontWeight: 400, maxWidth: 420, lineHeight: 1.6, position: 'relative' }}>
          {t('login.subtitulo')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, position: 'relative' }}>
          {FEATURE_KEYS.map(key => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#a5d6a7', flexShrink: 0 }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.95rem' }}>
                {t(`login.features.${key}`)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          flex: { xs: 1, md: '0 0 460px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 5 },
          pt: { xs: 11, sm: 10 },
          bgcolor: 'background.paper',
          minHeight: '100vh',
        }}
      >
        <Typography
          variant="h5"
          sx={{ display: { md: 'none' }, fontWeight: 800, color: 'primary.main', mb: 4, alignSelf: 'flex-start' }}
        >
          {t('login.marca')}
        </Typography>

        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            {tab === 0 ? t('login.bienvenido') : t('login.crearCuenta')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {tab === 0 ? t('login.loginDescripcion') : t('login.registroDescripcion')}
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, v) => cambiarTab(v)}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={t('login.iniciarSesion')} sx={{ fontWeight: 600, textTransform: 'none', flex: 1 }} />
            <Tab label={t('login.registrarse')} sx={{ fontWeight: 600, textTransform: 'none', flex: 1 }} />
          </Tabs>

          {errorExterno && (
            <Alert severity="warning" sx={{ mb: 2 }}>{traducirErrorLogin(errorExterno, t)}</Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{traducirErrorLogin(error, t)}</Alert>
          )}

          {tab === 1 && (
            <TextField
              fullWidth size="small" margin="dense"
              label={t('login.nombreCompleto')} autoFocus
              value={form.nombre}
              onChange={set('nombre')}
              onBlur={blur('nombre')}
              onKeyDown={handleKeyDown}
              error={!!errores.nombre}
              helperText={errores.nombre}
            />
          )}

          <TextField
            fullWidth size="small" margin="dense"
            label={t('login.correo')} type="email"
            autoFocus={tab === 0}
            value={form.email}
            onChange={set('email')}
            onBlur={blur('email')}
            onKeyDown={handleKeyDown}
            error={!!errores.email}
            helperText={errores.email}
          />

          <TextField
            fullWidth size="small" margin="dense"
            label={tab === 1 ? t('login.passwordRegistro') : t('login.password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete={tab === 1 ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={set('password')}
            onBlur={blur('password')}
            onKeyDown={handleKeyDown}
            error={!!errores.password}
            helperText={errores.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPassword(p => !p)} edge="end">
                    {showPassword
                      ? <VisibilityOffRoundedIcon fontSize="small" />
                      : <VisibilityRoundedIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {tab === 1 && (
            <TextField
              fullWidth size="small" margin="dense"
              label={t('login.confirmarPassword')} type="password"
              autoComplete="new-password"
              value={form.confirmar}
              onChange={set('confirmar')}
              onBlur={blur('confirmar')}
              onKeyDown={handleKeyDown}
              error={!!errores.confirmar}
              helperText={errores.confirmar}
            />
          )}

          <Button
            fullWidth variant="contained" size="large"
            onClick={tab === 0 ? handleLogin : handleRegistro}
            disabled={cargando}
            sx={{ mt: 2.5, mb: 2, py: 1.3, fontSize: '0.95rem' }}
          >
            {cargando
              ? <CircularProgress size={22} color="inherit" />
              : (tab === 0 ? t('login.iniciarSesion') : t('login.crearCuenta'))}
          </Button>

          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
              {t('login.continuarCon')}
            </Typography>
          </Divider>

          <Button
            fullWidth variant="outlined" size="large"
            startIcon={<GoogleIcon />}
            onClick={() => { window.location.href = '/oauth2/authorization/google'; }}
            sx={{
              py: 1.3,
              borderColor: 'divider',
              color: 'text.primary',
              fontSize: '0.95rem',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'transparent' },
            }}
          >
            Google
          </Button>

          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 4 }}>
            {t('login.footer')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
