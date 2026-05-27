import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  err => {
    const errores = err.response?.data?.errores;
    const msg = errores
      ? Object.values(errores).join('\n')
      : err.response?.data?.error
        || err.response?.data?.mensaje
        || 'Error de conexion';
    const error = new Error(msg);
    error.response = err.response;
    error.request = err.request;
    error.config = err.config;
    error.status = err.response?.status;
    return Promise.reject(error);
  }
);

export default api;
