import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Paper, IconButton, Tooltip,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

import api from '../services/api';
import { useI18n } from '../i18n/useI18n';
import PageShell from '../components/PageShell';
import { email, firstError, letters, trimStrings } from '../utils/crudValidation';

const INIT_FORM = { nombre: '', apellido: '', email: '' };

export default function PersonaPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(INIT_FORM);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [errores, setErrores] = useState({});

  useEffect(() => { cargar(); }, []);

  function cargar() {
    api.get('/personas').then(r => setRows(r.data)).catch(e => setError(e.message));
  }

  function abrir(row) {
    setEditId(row?.id ?? null);
    setFormData(row ? { ...row } : INIT_FORM);
    setError(null);
    setErrores({});
    setOpen(true);
  }

  function validar(data = formData) {
    const next = {
      nombre: letters(data.nombre, t('entidades.persona.nombre')),
      apellido: letters(data.apellido, t('entidades.persona.apellido')),
      email: email(data.email),
    };
    setErrores(next);
    return next;
  }

  function guardar() {
    const clean = trimStrings(formData);
    const validation = validar(clean);
    if (firstError(validation)) return;

    const req = editId
      ? api.put(`/personas/${editId}`, clean)
      : api.post('/personas', clean);
    req.then(r => { setMensaje(r.data.mensaje || t('mensajes.exito')); setOpen(false); cargar(); })
       .catch(e => setError(e.message));
  }

  function eliminar(id) {
    if (!window.confirm(t('mensajes.confirmEliminar'))) return;
    api.delete(`/personas/${id}`)
       .then(r => { setMensaje(r.data.mensaje); cargar(); })
       .catch(e => setError(e.message));
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'nombre', headerName: t('entidades.persona.nombre'), flex: 1 },
    { field: 'apellido', headerName: t('entidades.persona.apellido'), flex: 1 },
    { field: 'email', headerName: t('entidades.persona.email'), flex: 1, renderCell: ({ row }) => row.email || '-' },
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
    <PageShell icon="👤" entityKey="persona" onNew={() => abrir(null)}>
      {(mensaje || error) && (
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {mensaje && <Alert severity="success" onClose={() => setMensaje(null)}>{mensaje}</Alert>}
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
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
          {editId ? t('acciones.editar') : t('acciones.nuevo')} - {t('entidades.persona.titulo')}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          <TextField
            fullWidth margin="normal" required
            label={t('entidades.persona.nombre')}
            value={formData.nombre || ''}
            onChange={e => {
              setFormData(p => ({ ...p, nombre: e.target.value }));
              setErrores(p => ({ ...p, nombre: '' }));
            }}
            error={Boolean(errores.nombre)}
            helperText={errores.nombre}
          />
          <TextField
            fullWidth margin="normal" required
            label={t('entidades.persona.apellido')}
            value={formData.apellido || ''}
            onChange={e => {
              setFormData(p => ({ ...p, apellido: e.target.value }));
              setErrores(p => ({ ...p, apellido: '' }));
            }}
            error={Boolean(errores.apellido)}
            helperText={errores.apellido}
          />
          <TextField
            fullWidth margin="normal" required type="email"
            label={t('entidades.persona.email')}
            value={formData.email || ''}
            onChange={e => {
              setFormData(p => ({ ...p, email: e.target.value }));
              setErrores(p => ({ ...p, email: '' }));
            }}
            error={Boolean(errores.email)}
            helperText={errores.email}
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
