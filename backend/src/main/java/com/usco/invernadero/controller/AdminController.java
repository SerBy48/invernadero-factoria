package com.usco.invernadero.controller;

import com.usco.invernadero.entity.AuditLog;
import com.usco.invernadero.entity.TipoAccion;
import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.repository.UsuarioRepository;
import com.usco.invernadero.service.AuditLogService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UsuarioRepository usuarioRepository;
    private final AuditLogService auditLogService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @GetMapping("/usuarios")
    public ResponseEntity<List<Map<String, Object>>> listarUsuarios() {
        List<Map<String, Object>> lista = usuarioRepository.findAll().stream()
            .map(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", u.getId());
                m.put("nombre", u.getNombre());
                m.put("email", u.getEmail());
                m.put("rol", u.getRol() != null ? u.getRol() : "USER");
                m.put("activo", u.isActivo());
                m.put("proveedor", u.getProveedor());
                m.put("fechaCreacion", u.getFechaCreacion() != null ? u.getFechaCreacion().format(FMT) : "");
                return m;
            }).toList();
        return ResponseEntity.ok(lista);
    }

    @PutMapping("/usuarios/{id}/toggle")
    public ResponseEntity<?> toggleActivo(@PathVariable Long id, Authentication auth) {
        Usuario target = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        if ("ADMIN".equals(target.getRol())) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se puede inhabilitar a un administrador"));
        }

        target.setActivo(!target.isActivo());
        usuarioRepository.save(target);

        TipoAccion accion = target.isActivo() ? TipoAccion.HABILITAR_USUARIO : TipoAccion.INHABILITAR_USUARIO;
        String adminEmail = extraerEmail(auth);
        usuarioRepository.findByEmail(adminEmail).ifPresent(admin ->
            auditLogService.registrar(adminEmail, admin.getNombre(), accion,
                "Usuario afectado: " + target.getEmail()));

        return ResponseEntity.ok(Map.of(
            "mensaje", target.isActivo() ? "Usuario habilitado" : "Usuario inhabilitado",
            "activo", target.isActivo()
        ));
    }

    @GetMapping("/auditoria")
    public ResponseEntity<List<AuditLog>> auditoria(
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer anio) {
        return ResponseEntity.ok(auditLogService.findWithFilters(accion, mes, anio));
    }

    @GetMapping("/auditoria/export")
    public void exportCsv(
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false, defaultValue = "es") String lang,
            HttpServletResponse response) throws IOException {

        String idioma = normalizarIdioma(lang);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"auditoria.csv\"");

        List<AuditLog> logs = auditLogService.findWithFilters(accion, mes, anio);
        PrintWriter writer = response.getWriter();
        writer.write('\uFEFF');
        writer.println("sep=;");
        writer.println(String.join(";",
            csv("ID"),
            csv(label(idioma, "fecha")),
            csv("Email"),
            csv(label(idioma, "nombre")),
            csv(label(idioma, "accion")),
            csv(label(idioma, "detalle"))
        ));

        for (AuditLog log : logs) {
            String fecha = log.getFecha() != null ? log.getFecha().format(FMT) : "";
            String nombre = log.getUsuarioNombre() != null ? log.getUsuarioNombre() : "";
            writer.println(String.join(";",
                csv(String.valueOf(log.getId())),
                csv(fecha),
                csv(log.getUsuarioEmail()),
                csv(nombre),
                csv(traducirAccion(log.getAccion(), idioma)),
                csv(traducirDetalle(log.getDetalle(), idioma))
            ));
        }
        writer.flush();
    }

    private String normalizarIdioma(String lang) {
        if (lang == null || lang.isBlank()) return "es";
        String l = lang.toLowerCase();
        return switch (l) {
            case "en", "fr", "pt", "de" -> l;
            default -> "es";
        };
    }

    private String label(String lang, String key) {
        return switch (lang) {
            case "en" -> switch (key) {
                case "fecha" -> "Date and time";
                case "nombre" -> "Name";
                case "accion" -> "Action";
                case "detalle" -> "Detail";
                default -> key;
            };
            case "fr" -> switch (key) {
                case "fecha" -> "Date et heure";
                case "nombre" -> "Nom";
                case "accion" -> "Action";
                case "detalle" -> "Detail";
                default -> key;
            };
            case "pt" -> switch (key) {
                case "fecha" -> "Data e hora";
                case "nombre" -> "Nome";
                case "accion" -> "Acao";
                case "detalle" -> "Detalhe";
                default -> key;
            };
            case "de" -> switch (key) {
                case "fecha" -> "Datum und Uhrzeit";
                case "nombre" -> "Name";
                case "accion" -> "Aktion";
                case "detalle" -> "Detail";
                default -> key;
            };
            default -> switch (key) {
                case "fecha" -> "Fecha y hora";
                case "nombre" -> "Nombre";
                case "accion" -> "Acción";
                case "detalle" -> "Detalle";
                default -> key;
            };
        };
    }

    private String traducirAccion(TipoAccion accion, String lang) {
        if (accion == null) return "";
        return switch (lang) {
            case "en" -> switch (accion) {
                case LOGIN -> "Login";
                case LOGOUT -> "Logout";
                case REGISTRO -> "Registration";
                case ELIMINACION_CUENTA -> "Account deletion";
                case INHABILITAR_USUARIO -> "Disable user";
                case HABILITAR_USUARIO -> "Enable user";
            };
            case "fr" -> switch (accion) {
                case LOGIN -> "Connexion";
                case LOGOUT -> "Deconnexion";
                case REGISTRO -> "Inscription";
                case ELIMINACION_CUENTA -> "Suppression de compte";
                case INHABILITAR_USUARIO -> "Desactiver utilisateur";
                case HABILITAR_USUARIO -> "Activer utilisateur";
            };
            case "pt" -> switch (accion) {
                case LOGIN -> "Login";
                case LOGOUT -> "Logout";
                case REGISTRO -> "Registro";
                case ELIMINACION_CUENTA -> "Exclusao de conta";
                case INHABILITAR_USUARIO -> "Desativar usuario";
                case HABILITAR_USUARIO -> "Ativar usuario";
            };
            case "de" -> switch (accion) {
                case LOGIN -> "Anmeldung";
                case LOGOUT -> "Abmeldung";
                case REGISTRO -> "Registrierung";
                case ELIMINACION_CUENTA -> "Kontoloschung";
                case INHABILITAR_USUARIO -> "Benutzer deaktivieren";
                case HABILITAR_USUARIO -> "Benutzer aktivieren";
            };
            default -> switch (accion) {
                case LOGIN -> "Inicio de sesión";
                case LOGOUT -> "Cierre de sesión";
                case REGISTRO -> "Registro";
                case ELIMINACION_CUENTA -> "Eliminación de cuenta";
                case INHABILITAR_USUARIO -> "Inhabilitar usuario";
                case HABILITAR_USUARIO -> "Habilitar usuario";
            };
        };
    }

    private String traducirDetalle(String detalle, String lang) {
        if (detalle == null || detalle.isBlank()) return "";
        if ("Google OAuth2".equals(detalle)) return "Google OAuth2";
        if ("Primer usuario — rol ADMIN asignado".equals(detalle)) {
            return switch (lang) {
                case "en" -> "First user - ADMIN role assigned";
                case "fr" -> "Premier utilisateur - role ADMIN attribue";
                case "pt" -> "Primeiro usuario - funcao ADMIN atribuida";
                case "de" -> "Erster Benutzer - ADMIN-Rolle zugewiesen";
                default -> "Primer usuario - rol ADMIN asignado";
            };
        }
        if ("Registro vía Google".equals(detalle)) {
            return switch (lang) {
                case "en" -> "Registered via Google";
                case "fr" -> "Inscription via Google";
                case "pt" -> "Registro via Google";
                case "de" -> "Registrierung uber Google";
                default -> "Registro vía Google";
            };
        }
        if ("Registro vía Google — rol ADMIN asignado".equals(detalle)) {
            return switch (lang) {
                case "en" -> "Registered via Google - ADMIN role assigned";
                case "fr" -> "Inscription via Google - role ADMIN attribue";
                case "pt" -> "Registro via Google - funcao ADMIN atribuida";
                case "de" -> "Registrierung uber Google - ADMIN-Rolle zugewiesen";
                default -> "Registro vía Google - rol ADMIN asignado";
            };
        }
        if (detalle.startsWith("Usuario afectado:")) {
            String email = detalle.replace("Usuario afectado:", "").trim();
            String label = switch (lang) {
                case "en" -> "Affected user";
                case "fr" -> "Utilisateur concerne";
                case "pt" -> "Usuario afetado";
                case "de" -> "Betroffener Benutzer";
                default -> "Usuario afectado";
            };
            return label + ": " + email;
        }
        return detalle;
    }

    private String csv(String value) {
        String safe = value != null ? value : "";
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }

    private String extraerEmail(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof OAuth2User u) return u.getAttribute("email");
        return auth.getName();
    }
}
