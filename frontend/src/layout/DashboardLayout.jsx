import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 260;

export default function DashboardLayout({ entidades, vistaActual, setVista, usuario, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar
        usuario={usuario.nombre}
        onToggleSidebar={() => setMobileOpen(o => !o)}
      />
      <Sidebar
        entidades={entidades}
        vistaActual={vistaActual}
        setVista={setVista}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        usuarioRol={usuario.rol}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          transition: 'background-color 0.3s',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        {children}
      </Box>
    </Box>
  );
}
