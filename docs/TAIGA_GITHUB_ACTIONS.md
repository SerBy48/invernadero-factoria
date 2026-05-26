# Integracion Taiga + GitHub Actions

Este proyecto usa GitHub como repositorio y GitHub Actions como automatizador de pruebas, validacion de pull requests, construccion Docker y notificaciones hacia Taiga.

## Flujo propuesto

1. Se crea una historia de usuario en Taiga.
2. La historia se replica o referencia en GitHub usando el formato `TAIGA-123` o `US-123`.
3. Se crea una rama de trabajo:

   ```bash
   git checkout -b feature/TAIGA-123-login-local
   ```

4. Se hacen commits pequenos y descriptivos:

   ```bash
   git commit -m "TAIGA-123 agrega login local"
   ```

5. Se abre un Pull Request hacia `develop` o `main`.
6. El PR debe incluir:
   - Referencia a Taiga.
   - Criterios de aceptacion con checklist.
   - Pruebas ejecutadas.
7. GitHub Actions valida:
   - Compilacion del frontend.
   - Pruebas del backend.
   - Trazabilidad con Taiga.
8. Al aprobar y fusionar, el pipeline de CD construye las imagenes Docker.
9. Si existen secretos de Taiga, se envia una notificacion de despliegue exitoso.

## Workflows incluidos

| Archivo | Proposito |
| --- | --- |
| `.github/workflows/ci.yml` | Ejecuta pruebas backend, build frontend y Selenium E2E. |
| `.github/workflows/pr-check.yml` | Valida que cada PR tenga historia Taiga y criterios de aceptacion. |
| `.github/workflows/cd.yml` | Construye y publica imagenes Docker, y notifica despliegue a Taiga. |
| `.github/workflows/taiga-sync.yml` | Notifica actividad de issues y PRs al webhook de Taiga. |

## Secretos requeridos en GitHub

En GitHub: `Settings > Secrets and variables > Actions > New repository secret`.

| Secreto | Uso |
| --- | --- |
| `DOCKER_USERNAME` | Usuario Docker Hub para publicar imagenes. |
| `DOCKER_PASSWORD` | Token/password Docker Hub. |
| `TAIGA_WEBHOOK_URL` | URL del webhook o integracion intermedia de Taiga. |
| `TAIGA_TOKEN` | Token usado para autenticar la notificacion. |
| `TAIGA_PROJECT_ID` | ID del proyecto Taiga. |

## Evidencia para la rubrica

- Commits vinculados a historias: `TAIGA-123 mensaje`.
- Pull Requests con plantilla y criterios de aceptacion.
- Actions ejecutadas en cada PR.
- Artifacts de pruebas backend/frontend.
- Notificacion a Taiga en despliegues.

## Nota importante sobre Taiga

Taiga no siempre permite modificar historias directamente desde GitHub sin configurar un webhook o integracion intermedia. Por eso el proyecto deja dos niveles:

- Nivel basico: trazabilidad obligatoria en PRs y commits.
- Nivel automatizado: notificacion a `TAIGA_WEBHOOK_URL` cuando hay PRs, issues o despliegues.
