# 🌱 Invernadero — Factoría de Software

Proyecto **generado automáticamente** desde `modelo/modelo.json`.

## Estructura

```
invernadero-factory/
├── modelo/              ← Fuente de verdad (modelo.json)
├── generator/           ← Scripts Python de generación
├── backend/             ← Spring Boot 3 (Java 17)
│   └── src/main/java/
│       ├── entity/      ← Entidades JPA (TipoCultivo, Cultivo, Producto, Proveedor, Persona)
│       ├── repository/  ← JpaRepository por entidad
│       ├── service/     ← Interfaces de servicio
│       │   └── impl/   ← Implementaciones (@Service)
│       ├── controller/  ← REST Controllers
│       ├── exception/   ← NotFoundException + GlobalHandler
│       └── config/      ← SecurityConfig, I18nConfig, CorsConfig
├── frontend/            ← React + MUI + Vite
│   └── src/
│       ├── i18n/        ← es.json, en.json, useI18n hook (manual)
│       ├── services/    ← api.js (Axios + Accept-Language)
│       ├── layout/      ← DashboardLayout, Navbar, Sidebar
│       └── pages/       ← CrudPage por entidad
├── taiga/               ← historias_usuario.json + taiga_import.py
├── .github/workflows/   ← ci.yml, cd.yml, pr-check.yml
└── docker-compose.yml
```

## Cómo regenerar el proyecto

```bash
cd generator
python generator.py --modelo ../modelo/modelo.json --salida ../salida
```

## Cómo correr localmente

```bash
# 1. Base de datos
docker-compose up db -d

# 2. Backend
cd backend
./mvnw spring-boot:run

# 3. Frontend
cd frontend
npm install && npm run dev
```

## Internacionalización (manual, sin APIs)

El sistema detecta el idioma desde:
1. `localStorage.setItem('lang', 'en')` en el frontend
2. Header `Accept-Language: en` enviado automáticamente por Axios
3. El backend lee `LocaleContextHolder` para los mensajes de respuesta

Archivos clave:
- Frontend: `src/i18n/es.json`, `src/i18n/en.json`, `src/i18n/useI18n.js`
- Backend:  `src/main/resources/i18n/messages_es.properties`

## GitHub Actions

| Workflow      | Trigger           | Qué hace                                     |
|---------------|-------------------|----------------------------------------------|
| `ci.yml`      | push/PR → main    | JUnit tests, React build, Selenium E2E       |
| `cd.yml`      | push → main + tag | Docker build/push + notifica Taiga           |
| `pr-check.yml`| PR abierto        | Checkstyle, ESLint, comentario automático    |

## Taiga

Historias generadas en `taiga/historias_usuario.json`.
Para importar automáticamente:

```bash
cd taiga
python taiga_import.py --url https://api.taiga.io --token TU_TOKEN --project-slug invernadero
```

## Rubrica cubierta

| Ítem | Estado |
|------|--------|
| 1. Modelo JSON + BD + Diccionario de datos | ✅ |
| 2. Backend Spring Boot desde modelo JSON   | ✅ |
| 3. Frontend React desde modelo JSON        | ✅ |
| 4. Tests Selenium (frontend) + JUnit (backend) | ✅ |
| 5. GitHub Actions (CI/CD + PR detection)   | ✅ |
| 6. OAuth2 Google + Security config         | ✅ |
| 7. Internacionalización ES/EN (manual)     | ✅ |
| 9. Taiga + historias de usuario            | ✅ |
