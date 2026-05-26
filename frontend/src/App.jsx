import NO_EXISTE from './archivo-que-no-existe';

import { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import DashboardLayout from './layout/DashboardLayout';
import TipoCultivoPage from './pages/TipoCultivoPage';
import CultivoPage from './pages/CultivoPage';
import ProductoPage from './pages/ProductoPage';
import ProveedorPage from './pages/ProveedorPage';
import PersonaPage from './pages/PersonaPage';
import PerfilPage from './pages/PerfilPage';
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import AuditoriaPage from './pages/AuditoriaPage';
import LoginPage from './pages/LoginPage';
import api from './services/api';
import { useI18n } from './i18n/useI18n';
import { useColorMode } from './theme/ThemeContext';

const ENTIDADES = ['tipo_cultivo', 'cultivo', 'producto', 'proveedor', 'persona'];
const ADMIN_DEFAULT_VIEW = 'admin_usuarios';

export default function App() {
  const [cargando,  setCargando]  = useState(true);
  const [usuario,   setUsuario]   = useState(null);
  const [vista,     setVista]     = useState(ENTIDADES[0]);
  const [errorMsg,  setErrorMsg]  = useState(null);

  const { setLang } = useI18n();
  const { setMode } = useColorMode();

  const verificarSesion = useCallback(() => {
    setCargando(true);
    api.get('/auth/me')
      .then(r => {
        setLang(r.data.idioma || 'es');
        setMode(r.data.modoOscuro ? 'dark' : 'light');
        setUsuario(r.data);
        setVista(r.data.rol === 'ADMIN' ? ADMIN_DEFAULT_VIEW : ENTIDADES[0]);
        setErrorMsg(null);
        setCargando(false);
      })
      .catch(e => {
        if (e.message === 'inhabilitado') {
          setErrorMsg('Tu cuenta ha sido inhabilitada. Contacta al administrador.');
        }
        setUsuario(null);
        setCargando(false);
      });
  }, [setLang, setMode]);

  useEffect(() => {
    // Detect OAuth2 failure redirect with ?error=inhabilitado
    if (window.location.search.includes('inhabilitado')) {
      setErrorMsg('Tu cuenta ha sido inhabilitada. Contacta al administrador.');
      window.history.replaceState({}, '', '/');
    }
    verificarSesion();
  }, [verificarSesion]);

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" size={48} />
      </Box>
    );
  }

  if (!usuario) {
    return <LoginPage onLoginExitoso={verificarSesion} errorExterno={errorMsg} />;
  }

  return (
    <DashboardLayout
      entidades={ENTIDADES}
      vistaActual={vista}
      setVista={setVista}
      usuario={usuario}
    >
      {vista === 'tipo_cultivo' && <TipoCultivoPage />}
      {vista === 'cultivo'      && <CultivoPage />}
      {vista === 'producto'     && <ProductoPage />}
      {vista === 'proveedor'    && <ProveedorPage />}
      {vista === 'persona'      && <PersonaPage />}
      {vista === 'perfil'       && (
        <PerfilPage
          usuario={usuario}
          onCuentaEliminada={() => { setUsuario(null); setVista(ENTIDADES[0]); }}
        />
      )}
      {vista === 'admin_usuarios'  && usuario.rol === 'ADMIN' && <AdminUsuariosPage />}
      {vista === 'admin_auditoria' && usuario.rol === 'ADMIN' && <AuditoriaPage />}
    </DashboardLayout>
  );
}
