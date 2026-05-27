import { useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress,
} from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import { useI18n } from '../i18n/useI18n';
import api from '../services/api';

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.8 }}>
      <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.08em' }}>
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={500}>{value}</Typography>
      </Box>
    </Box>
  );
}

export default function PerfilPage({ usuario, onCuentaEliminada }) {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cargando,    setCargando]    = useState(false);
  const [error,       setError]       = useState(null);
  const esAdmin = usuario.rol === 'ADMIN';

  const fechaFormateada = usuario.fechaCreacion
    ? new Date(usuario.fechaCreacion).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  function eliminarCuenta() {
    setCargando(true);
    api.delete('/auth/perfil')
      .then(() => { setConfirmOpen(false); onCuentaEliminada(); })
      .catch(e => { setError(e.message); setCargando(false); });
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 680, mx: 'auto' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          background: theme =>
            `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: '#fff',
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <AccountCircleRoundedIcon sx={{ fontSize: 48, opacity: 0.9 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('perfil.titulo')}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.82 }}>{t('perfil.descripcion')}</Typography>
        </Box>
      </Paper>

      {/* Datos */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', px: 3, py: 1, mb: 3 }}>
        <InfoRow
          icon={<BadgeRoundedIcon />}
          label={t('perfil.nombre')}
          value={usuario.nombre}
        />
        <Divider />
        <InfoRow
          icon={<EmailRoundedIcon />}
          label={t('perfil.email')}
          value={usuario.email}
        />
        <Divider />
        <InfoRow
          icon={<LockRoundedIcon />}
          label={t('perfil.rol')}
          value={
            <Chip
              label={t(`perfil.roles.${usuario.rol}`) || usuario.rol}
              size="small"
              color={usuario.rol === 'ADMIN' ? 'warning' : 'primary'}
              variant="outlined"
              sx={{ fontWeight: 600, mt: 0.3 }}
            />
          }
        />
        <Divider />
        <InfoRow
          icon={<AccountCircleRoundedIcon />}
          label={t('perfil.proveedor')}
          value={t(`perfil.proveedores.${usuario.proveedor}`) || usuario.proveedor}
        />
        <Divider />
        <InfoRow
          icon={<CalendarMonthRoundedIcon />}
          label={t('perfil.fechaCreacion')}
          value={fechaFormateada}
        />
      </Paper>

      {!esAdmin && (
        <Paper
          elevation={0}
          sx={{ borderRadius: 3, border: '1px solid', borderColor: 'error.light', p: 3 }}
        >
          <Typography variant="subtitle1" fontWeight={700} color="error" sx={{ mb: 0.5 }}>
            {t('perfil.zonaPeligro')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('perfil.confirmarEliminar')}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverRoundedIcon />}
            onClick={() => { setError(null); setConfirmOpen(true); }}
          >
            {t('perfil.eliminarCuenta')}
          </Button>
        </Paper>
      )}

      {esAdmin && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {t('perfil.adminNoEliminable')}
        </Alert>
      )}

      {/* Dialog confirmación */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          ⚠️ {t('perfil.eliminarCuenta')}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2">
            {t('perfil.confirmarEliminar')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={cargando}>
            {t('acciones.cancelar')}
          </Button>
          <Button variant="contained" color="error" onClick={eliminarCuenta} disabled={cargando}>
            {cargando ? <CircularProgress size={20} color="inherit" /> : t('perfil.eliminarCuenta')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
