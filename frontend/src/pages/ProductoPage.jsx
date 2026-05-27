import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Paper, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

import api from '../services/api';
import { useI18n } from '../i18n/useI18n';
import PageShell from '../components/PageShell';
import { firstError, nonNegativeInteger, positiveNumber, required, trimStrings } from '../utils/crudValidation';

const INIT_FORM = { nombre: '', precio: '', stock: '', moneda: 'COP' };

export default function ProductoPage() {
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
    api.get('/productos').then(r => setRows(r.data)).catch(e => setError(e.message));
  }

  function abrir(row) {
    setEditId(row?.id ?? null);
    setFormData(row ? { ...row, moneda: row.moneda || 'COP' } : INIT_FORM);
    setError(null);
    setErrores({});
    setOpen(true);
  }

  function validar(data = formData) {
    const next = {
      nombre: required(data.nombre, t('entidades.producto.nombre')),
      precio: positiveNumber(data.precio, t('entidades.producto.precio')),
      stock: nonNegativeInteger(data.stock, t('entidades.producto.stock')),
      moneda: ['COP', 'USD'].includes(data.moneda) ? '' : 'La moneda debe ser COP o USD',
    };
    setErrores(next);
    return next;
  }

  function guardar() {
    const clean = {
      ...trimStrings(formData),
      precio: formData.precio === '' ? '' : Number(formData.precio),
      stock: formData.stock === '' ? '' : Number(formData.stock),
      moneda: formData.moneda || 'COP',
    };
    const validation = validar(clean);
    if (firstError(validation)) return;

    const req = editId
      ? api.put(`/productos/${editId}`, clean)
      : api.post('/productos', clean);
    req.then(r => { setMensaje(r.data.mensaje || t('mensajes.exito')); setOpen(false); cargar(); })
       .catch(e => setError(e.message));
  }

  function eliminar(id) {
    if (!window.confirm(t('mensajes.confirmEliminar'))) return;
    api.delete(`/productos/${id}`)
       .then(r => { setMensaje(r.data.mensaje); cargar(); })
       .catch(e => setError(e.message));
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'nombre', headerName: t('entidades.producto.nombre'), flex: 1 },
    {
      field: 'precio',
      headerName: t('entidades.producto.precio'),
      width: 150,
      renderCell: ({ row }) => row.precio != null
        ? `${row.moneda || 'COP'} ${Number(row.precio).toLocaleString()}`
        : '-',
    },
    { field: 'moneda', headerName: t('entidades.producto.moneda'), width: 100 },
    { field: 'stock', headerName: t('entidades.producto.stock'), width: 110 },
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
    <PageShell icon="📦" entityKey="producto" onNew={() => abrir(null)}>
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
          {editId ? t('acciones.editar') : t('acciones.nuevo')} - {t('entidades.producto.titulo')}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          <TextField
            fullWidth margin="normal" required
            label={t('entidades.producto.nombre')}
            value={formData.nombre || ''}
            onChange={e => {
              setFormData(p => ({ ...p, nombre: e.target.value }));
              setErrores(p => ({ ...p, nombre: '' }));
            }}
            error={Boolean(errores.nombre)}
            helperText={errores.nombre}
          />
          <TextField
            fullWidth margin="normal" required type="number"
            label={t('entidades.producto.precio')}
            value={formData.precio ?? ''}
            onChange={e => {
              setFormData(p => ({ ...p, precio: e.target.value }));
              setErrores(p => ({ ...p, precio: '' }));
            }}
            inputProps={{ min: 0, step: '0.01' }}
            error={Boolean(errores.precio)}
            helperText={errores.precio}
          />
          <FormControl fullWidth margin="normal" error={Boolean(errores.moneda)}>
            <InputLabel>{t('entidades.producto.moneda')}</InputLabel>
            <Select
              value={formData.moneda || 'COP'}
              label={t('entidades.producto.moneda')}
              onChange={e => {
                setFormData(p => ({ ...p, moneda: e.target.value }));
                setErrores(p => ({ ...p, moneda: '' }));
              }}
            >
              <MenuItem value="COP">COP</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
            </Select>
            {errores.moneda && (
              <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
                {errores.moneda}
              </Box>
            )}
          </FormControl>
          <TextField
            fullWidth margin="normal" required type="number"
            label={t('entidades.producto.stock')}
            value={formData.stock ?? ''}
            onChange={e => {
              setFormData(p => ({ ...p, stock: e.target.value }));
              setErrores(p => ({ ...p, stock: '' }));
            }}
            inputProps={{ min: 0, step: 1 }}
            error={Boolean(errores.stock)}
            helperText={errores.stock}
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
