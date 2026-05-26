import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Paper, Typography, Chip, Button, Alert,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Stack,
} from '@mui/material';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import { useI18n } from '../i18n/useI18n';
import api from '../services/api';

const ACCIONES = ['LOGIN', 'LOGOUT', 'REGISTRO', 'ELIMINACION_CUENTA', 'INHABILITAR_USUARIO', 'HABILITAR_USUARIO'];

const ACCION_COLOR = {
  LOGIN:               'success',
  LOGOUT:              'warning',
  REGISTRO:            'info',
  ELIMINACION_CUENTA:  'error',
  INHABILITAR_USUARIO: 'error',
  HABILITAR_USUARIO:   'success',
};

const MESES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const ANIO_ACTUAL = new Date().getFullYear();

export default function AuditoriaPage() {
  const { t } = useI18n();
  const [rows,    setRows]    = useState([]);
  const [error,   setError]   = useState(null);
  const [filtros, setFiltros] = useState({ accion: '', mes: '', anio: '' });

  const cargar = useCallback(() => {
    const params = new URLSearchParams();
    if (filtros.accion) params.set('accion', filtros.accion);
    if (filtros.mes)    params.set('mes',    filtros.mes);
    if (filtros.anio)   params.set('anio',   filtros.anio);
    api.get(`/admin/auditoria?${params}`)
      .then(r => setRows(r.data))
      .catch(e => setError(e.message));
  }, [filtros]);

  useEffect(() => { cargar(); }, []);

  function limpiar() {
    setFiltros({ accion: '', mes: '', anio: '' });
    api.get('/admin/auditoria').then(r => setRows(r.data)).catch(e => setError(e.message));
  }

  function exportar() {
    const params = new URLSearchParams();
    if (filtros.accion) params.set('accion', filtros.accion);
    if (filtros.mes)    params.set('mes',    filtros.mes);
    if (filtros.anio)   params.set('anio',   filtros.anio);

    api.get(`/admin/auditoria/export?${params}`, { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'auditoria.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(async e => {
        // Si la respuesta es un blob de error, leerlo como texto
        let msg = 'Error al exportar el archivo';
        try {
          if (e.response?.data instanceof Blob) {
            const text = await e.response.data.text();
            const json = JSON.parse(text);
            msg = json.error || json.mensaje || msg;
          }
        } catch (_) {}
        setError(msg);
      });
  }

  const columns = [
    {
      field: 'fecha', headerName: t('admin.auditoria.fecha'), width: 170,
      renderCell: ({ row }) => row.fecha ? new Date(row.fecha).toLocaleString() : '—',
    },
    { field: 'usuarioEmail',  headerName: t('admin.auditoria.email'),  flex: 1, minWidth: 160 },
    { field: 'usuarioNombre', headerName: t('admin.auditoria.nombre'), flex: 1, minWidth: 130 },
    {
      field: 'accion', headerName: t('admin.auditoria.accion'), width: 190,
      renderCell: ({ row }) => (
        <Chip
          label={t(`tiposAccion.${row.accion}`) || row.accion}
          size="small"
          color={ACCION_COLOR[row.accion] || 'default'}
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
      ),
    },
    { field: 'detalle', headerName: t('admin.auditoria.detalle'), flex: 1.5, minWidth: 150 },
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
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HistoryRoundedIcon sx={{ fontSize: 40, opacity: 0.9 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>{t('admin.auditoria.titulo')}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.82 }}>{t('admin.auditoria.descripcion')}</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<FileDownloadRoundedIcon />}
          onClick={exportar}
          sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: 'primary.dark', fontWeight: 700, '&:hover': { bgcolor: '#fff' } }}
        >
          {t('admin.auditoria.exportar')}
        </Button>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Filtros */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListRoundedIcon fontSize="small" /> Filtros
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{t('admin.auditoria.accion')}</InputLabel>
            <Select
              value={filtros.accion}
              label={t('admin.auditoria.accion')}
              onChange={e => setFiltros(p => ({ ...p, accion: e.target.value }))}
            >
              <MenuItem value="">{t('admin.auditoria.todasAcciones')}</MenuItem>
              {ACCIONES.map(a => (
                <MenuItem key={a} value={a}>{t(`tiposAccion.${a}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('admin.auditoria.mes')}</InputLabel>
            <Select
              value={filtros.mes}
              label={t('admin.auditoria.mes')}
              onChange={e => setFiltros(p => ({ ...p, mes: e.target.value }))}
            >
              <MenuItem value="">{t('admin.auditoria.todosMeses')}</MenuItem>
              {MESES.map(m => (
                <MenuItem key={m} value={m}>{t(`meses.${m}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small" label={t('admin.auditoria.anio')}
            value={filtros.anio}
            onChange={e => setFiltros(p => ({ ...p, anio: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            sx={{ width: 100 }}
            inputProps={{ maxLength: 4 }}
            placeholder={String(ANIO_ACTUAL)}
          />

          <Button variant="contained" startIcon={<FilterListRoundedIcon />} onClick={cargar}>
            {t('admin.auditoria.filtrar')}
          </Button>
          <Button variant="outlined" startIcon={<ClearRoundedIcon />} onClick={limpiar}>
            {t('admin.auditoria.limpiar')}
          </Button>
        </Stack>
      </Paper>

      {/* Tabla */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[15, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
          sx={{ border: 'none' }}
        />
      </Paper>
    </Box>
  );
}
