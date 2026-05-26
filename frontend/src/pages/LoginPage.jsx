import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Tabs, Tab,
  Divider, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import api from '../services/api';

const FEATURES = [
  'Gestión de cultivos y tipos de cultivo',
  'Control de inventario de productos',
  'Administración de proveedores',
  'Registro de personas del sistema',
  'Soporte multilingüe (5 idiomas)',
];

const INIT_FORM = { nombre: '', email: '', password: '', confirmar: '' };
const INIT_ERRORES = { nombre: '', email: '', password: '', confirmar: '' };

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarCampo(campo, valor, passwordActual) {
  const v = valor || '';
  switch (campo) {
    case 'nombre':
      if (!v.trim())                    return 'El nombre es obligatorio';
      if (!SOLO_LETRAS.test(v))         return 'Solo se permiten letras y espacios';
      if (v.trim().length < 2)          return 'Mínimo 2 caracteres';
      return '';
    case 'email':
      if (!v.trim())                    return 'El correo es obligatorio';
      if (!EMAIL_REGEX.test(v))         return 'Formato de correo no válido (ej: usuario@correo.com)';
      return '';
    case 'password':
      if (!v)                           return 'La contraseña es obligatoria';
      if (v.length < 8)                 return 'Mínimo 8 caracteres';
      if (!/[a-zA-Z]/.test(v))          return 'Debe contener al menos una letra';
      if (!/\d/.test(v))                return 'Debe contener al menos un número';
      return '';
    case 'confirmar':
      if (!v)                           return 'Confirma tu contraseña';
      if (v !== passwordActual)         return 'Las contraseñas no coinciden';
      return '';
    default:
      return '';
  }
}

export default function LoginPage({ onLoginExitoso, errorExterno }) {
  const [tab,          setTab]          = useState(0);
  const [form,         setForm]         = useState(INIT_FORM);
  const [errores,      setErrores]      = useState(INIT_ERRORES);
  const [error,        setError]        = useState(null);
  const [cargando,     setCargando]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field) => (e) => {
    const valor = e.target.value;
    setForm(p => ({ ...p, [field]: valor }));
    if (errores[field]) {
      const err = validarCampo(field, valor, field === 'confirmar' ? form.password : valor);
      setErrores(p => ({ ...p, [field]: err }));
    }
  };

  const blur = (field) => () => {
    const err = validarCampo(field, form[field], form.password);
    setErrores(p => ({ ...p, [field]: err }));
  };

  function cambiarTab(v) {
    setTab(v);
    setError(null);
    setForm(INIT_FORM);
    setErrores(INIT_ERRORES);
  }

  function handleLogin() {
    const emailErr    = validarCampo('email', form.email, '');
    const passwordErr = form.password ? '' : 'La contraseña es obligatoria';
    setErrores(p => ({ ...p, email: emailErr, password: passwordErr }));
    if (emailErr || passwordErr) return;

    setCargando(true); setError(null);
    api.post('/auth/login', { email: form.email, password: form.password })
      .then(() => onLoginExitoso())
      .catch(e => { setError(e.message); setCargando(false); });
  }

  function handleRegistro() {
    const campos = ['nombre', 'email', 'password', 'confirmar'];
    const nuevos = {};
    let hayError = false;
    campos.forEach(c => {
      const err = validarCampo(c, form[c], form.password);
      nuevos[c] = err;
      if (err) hayError = true;
    });
    setErrores(nuevos);
    if (hayError) return;

    setCargando(true); setError(null);
    api.post('/auth/registro', { nombre: form.nombre, email: form.email, password: form.password })
      .then(() => api.post('/auth/login', { email: form.email, password: form.password }))
      .then(() => onLoginExitoso())
      .catch(e => { setError(e.message); setCargando(false); });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') tab === 0 ? handleLogin() : handleRegistro();
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>

      {/* ── Panel izquierdo: hero (solo desktop) ── */}
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
        <Box sx={{ position: 'absolute', bottom: -80, left: -80,  width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', top: '40%', right: '10%', width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)' }} />

        <Typography variant="h2" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.04em', mb: 1, position: 'relative' }}>
          Invernadero Usco
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.75)', mb: 5, fontWeight: 400, maxWidth: 420, lineHeight: 1.6, position: 'relative' }}>
          Sistema integral de gestión para tu invernadero. Controla cultivos, inventario y más desde un solo lugar.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, position: 'relative' }}>
          {FEATURES.map(f => (
            <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#a5d6a7', flexShrink: 0 }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.95rem' }}>{f}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Panel derecho: formulario ── */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 460px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 5 },
          bgcolor: 'background.paper',
          minHeight: '100vh',
        }}
      >
        <Typography
          variant="h5"
          sx={{ display: { md: 'none' }, fontWeight: 800, color: 'primary.main', mb: 4, alignSelf: 'flex-start' }}
        >
          Invernadero
        </Typography>

        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            {tab === 0 ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {tab === 0
              ? 'Ingresa tus credenciales para continuar'
              : 'Completa el formulario para registrarte'}
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, v) => cambiarTab(v)}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Iniciar sesión" sx={{ fontWeight: 600, textTransform: 'none', flex: 1 }} />
            <Tab label="Registrarse"    sx={{ fontWeight: 600, textTransform: 'none', flex: 1 }} />
          </Tabs>

          {errorExterno && (
            <Alert severity="warning" sx={{ mb: 2 }}>{errorExterno}</Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
          )}

          {tab === 1 && (
            <TextField
              fullWidth size="small" margin="dense"
              label="Nombre completo" autoFocus
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
            label="Correo electrónico" type="email"
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
            label={tab === 1 ? 'Contraseña (mín. 8 caracteres, letras y números)' : 'Contraseña'}
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
                      : <VisibilityRoundedIcon   fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {tab === 1 && (
            <TextField
              fullWidth size="small" margin="dense"
              label="Confirmar contraseña" type="password"
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
              : (tab === 0 ? 'Iniciar sesión' : 'Crear cuenta')}
          </Button>

          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
              o continuar con
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
            Sistema Invernadero · Factoría de Software
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
