import axios from 'axios';

/**
 * Instancia de Axios configurada.
 * Adjunta automáticamente Accept-Language desde localStorage.
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const lang = localStorage.getItem('lang') || 'es';
  config.headers['Accept-Language'] = lang;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error
             || err.response?.data?.mensaje
             || 'Error de conexión';
    return Promise.reject(new Error(msg));
  }
);

export default api;
