import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Paper, Typography, Chip, Button, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useI18n } from '../i18n/useI18n';
import api from '../services/api';

export default function AdminUsuariosPage() {
  const { t } = useI18n();
  const [rows,    setRows]    = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [error,   setError]   = useState(null);
  const [confirm, setConfirm] = useState(null); // { id, nombre, activo }

  useEffect(() => { cargar(); }, []);

  function cargar() {
    api.get('/admin/usuarios').then(r => setRows(r.data)).catch(e => setError(e.message));
  }

  function toggleActivo() {
    api.put(`/admin/usuarios/${confirm.id}/toggle`)
      .then(r => { setMensaje(r.data.mensaje); setConfirm(null); cargar(); })
      .catch(e => { setError(e.message); setConfirm(null); });
  }

  const columns = [
    { field: 'id',     headerName: 'ID',    width: 60 },
    { field: 'nombre', headerName: t('admin.usuarios.nombre'), flex: 1, minWidth: 140 },
    { field: 'email',  headerName: t('admin.usuarios.email'),  flex: 1.5, minWidth: 180 },
    {
      field: 'rol', headerName: t('admin.usuarios.rol'), width: 130,
      renderCell: ({ row }) => (
        <Chip
          label={t(`perfil.roles.${row.rol}`) || row.rol}
          size="small"
          color={row.rol === 'ADMIN' ? 'warning' : 'default'}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'activo', headerName: t('admin.usuarios.estado'), width: 110,
      renderCell: ({ row }) => (
        <Chip
          label={row.activo ? t('admin.usuarios.activo') : t('admin.usuarios.inactivo')}
          size="small"
          color={row.activo ? 'success' : 'error'}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    { field: 'proveedor',     headerName: t('admin.usuarios.proveedor'),     width: 100 },
    { field: 'fechaCreacion', headerName: t('admin.usuarios.fechaCreacion'), flex: 1, minWidth: 150 },
    {
      field: '_actions', headerName: '', width: 140, sortable: false,
      renderCell: ({ row }) => row.rol !== 'ADMIN' ? (
        <Button
          size="small"
          variant="outlined"
          color={row.activo ? 'error' : 'success'}
          startIcon={row.activo ? <BlockRoundedIcon /> : <CheckCircleRoundedIcon />}
          onClick={() => setConfirm(row)}
          sx={{ fontSize: '0.75rem' }}
        >
          {row.activo ? t('admin.usuarios.inhabilitar') : t('admin.usuarios.habilitar')}
        </Button>
      ) : null,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 }, mb: 3,
          background: theme =>
            `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: '#fff', borderRadius: 3,
          display: 'flex', alignItems: 'center', gap: 2,
        }}
      >
        <PeopleAltRoundedIcon sx={{ fontSize: 40, opacity: 0.9 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('admin.usuarios.titulo')}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.82 }}>{t('admin.usuarios.descripcion')}</Typography>
        </Box>
      </Paper>

      {(mensaje || error) && (
        <Box sx={{ mb: 2 }}>
          {mensaje && <Alert severity="success" onClose={() => setMensaje(null)}>{mensaje}</Alert>}
          {error   && <Alert severity="error"   onClose={() => setError(null)}>{error}</Alert>}
        </Box>
      )}

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none' }}
        />
      </Paper>

      {/* Confirmación toggle */}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>
          {confirm?.activo ? t('admin.usuarios.inhabilitar') : t('admin.usuarios.habilitar')} {t('admin.usuarios.usuario')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirm?.activo ? t('admin.usuarios.confirmarInhabilitar') : t('admin.usuarios.confirmarHabilitar')} <strong>{confirm?.nombre}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirm(null)}>{t('acciones.cancelar')}</Button>
          <Button
            variant="contained"
            color={confirm?.activo ? 'error' : 'success'}
            onClick={toggleActivo}
          >
            {t('admin.usuarios.confirmar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
