# Cumplimiento de rubrica

| Punto | Evidencia en el proyecto |
| --- | --- |
| Modelo JSON, base de datos, entidad-relacion y diccionario | `modelo/modelo.json`, entidades JPA y documentacion del modelo. |
| Backend Spring Boot basado en modelo JSON | Carpeta `backend/`, controladores REST, servicios y repositorios. |
| Frontend basado en modelo JSON | Carpeta `frontend/`, paginas CRUD React y servicios Axios. |
| Pruebas frontend Selenium, backend JUnit y Python | `backend/src/test`, `frontend/tests/selenium_tests.py`, workflow `ci.yml`. |
| GitHub Actions, commit, pull request, deteccion y pruebas | `.github/workflows/ci.yml`, `.github/workflows/pr-check.yml`, plantilla de PR. |
| OAuth, seguridad Gmail, autenticacion y autorizacion | Spring Security, OAuth2 Google, login local, roles ADMIN/USER. |
| Internacionalizacion backend y frontend | `backend/src/main/resources/i18n`, `frontend/src/i18n`. |
| Documentacion y comentarios | `docs/`, plantillas GitHub, comentarios puntuales en codigo. |
| Taiga para historias y criterios de aceptacion | `docs/TAIGA_GITHUB_ACTIONS.md`, `taiga-sync.yml`, `pull_request_template.md`. |
| Automatizacion de procesos | GitHub Actions para CI, PR checks, CD, Docker y notificaciones Taiga. |
