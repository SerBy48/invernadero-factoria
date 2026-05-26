import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Paper, IconButton, Tooltip,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

import api from '../services/api';
import { useI18n } from '../i18n/useI18n';
import PageShell from '../components/PageShell';

const INIT_FORM = { nombre: '', telefono: '', email: '' };

export default function ProveedorPage() {
  const { t } = useI18n();
  const [rows,     setRows]     = useState([]);
  const [open,     setOpen]     = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [formData, setFormData] = useState(INIT_FORM);
  const [mensaje,  setMensaje]  = useState(null);
  const [error,    setError]    = useState(null);

  useEffect(() => { cargar(); }, []);

  function cargar() {
    api.get('/proveedors').then(r => setRows(r.data)).catch(e => setError(e.message));
  }

  function abrir(row) {
    setEditId(row?.id ?? null);
    setFormData(row ? { ...row } : INIT_FORM);
    setError(null);
    setOpen(true);
  }

  function guardar() {
    const req = editId
      ? api.put(`/proveedors/${editId}`, formData)
      : api.post('/proveedors', formData);
    req.then(r => { setMensaje(r.data.mensaje || t('mensajes.exito')); setOpen(false); cargar(); })
       .catch(e => setError(e.message));
  }

  function eliminar(id) {
    if (!window.confirm(t('mensajes.confirmEliminar'))) return;
    api.delete(`/proveedors/${id}`)
       .then(r => { setMensaje(r.data.mensaje); cargar(); })
       .catch(e => setError(e.message));
  }

  const columns = [
    { field: 'id',       headerName: 'ID',                              width: 80 },
    { field: 'nombre',   headerName: t('entidades.proveedor.nombre'),   flex: 1 },
    { field: 'telefono', headerName: t('entidades.proveedor.telefono'), width: 150,
      valueFormatter: (p) => p.value || '—' },
    { field: 'email',    headerName: t('entidades.proveedor.email'),    flex: 1,
      valueFormatter: (p) => p.value || '—' },
    {
      field: '_actions', headerName: '', width: 110, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
          <Tooltip title={t('acciones.editar')}>
            <IconButton size="small" color="primary" onClick={() => abrir(row)}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('acciones.eliminar')}>
            <IconButton size="small" color="error" onClick={() => eliminar(row.id)}>
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <PageShell icon="🚚" entityKey="proveedor" onNew={() => abrir(null)}>
      {(mensaje || error) && (
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ border: 'none' }}
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editId ? t('acciones.editar') : t('acciones.nuevo')} — {t('entidades.proveedor.titulo')}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          <TextField
            fullWidth margin="normal" required
            label={t('entidades.proveedor.nombre')}
            value={formData.nombre || ''}
            onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
          />
          <TextField
            fullWidth margin="normal"
            label={t('entidades.proveedor.telefono')}
            value={formData.telefono || ''}
            onChange={e => setFormData(p => ({ ...p, telefono: e.target.value }))}
          />
          <TextField
            fullWidth margin="normal" type="email"
            label={t('entidades.proveedor.email')}
            value={formData.email || ''}
            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)}>{t('acciones.cancelar')}</Button>
          <Button variant="contained" color="primary" onClick={guardar}>{t('acciones.guardar')}</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
