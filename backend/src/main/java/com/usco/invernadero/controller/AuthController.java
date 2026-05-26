package com.usco.invernadero.controller;

import com.usco.invernadero.entity.TipoAccion;
import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.repository.*;
import com.usco.invernadero.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioRepository   usuarioRepository;
    private final PasswordEncoder      passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final AuditLogService      auditLogService;
    private final CultivoRepository    cultivoRepository;
    private final TipoCultivoRepository tipoCultivoRepository;
    private final ProductoRepository   productoRepository;
    private final ProveedorRepository  proveedorRepository;
    private final PersonaRepository    personaRepository;

    @PostMapping("/registro")
    public ResponseEntity<?> registro(@RequestBody Map<String, String> body) {
        String email    = body.getOrDefault("email",    "").trim();
        String password = body.getOrDefault("password", "").trim();
        String nombre   = body.getOrDefault("nombre",   "").trim();

        if (nombre.isBlank() || email.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Todos los campos son obligatorios"));
        }
        if (!nombre.matches("[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s]{2,100}")) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre solo puede contener letras y espacios (mínimo 2 caracteres)"));
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "El correo electrónico no es válido"));
        }
        if (password.length() < 8 || !password.matches(".*[a-zA-Z].*") || !password.matches(".*\\d.*")) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe tener mínimo 8 caracteres, al menos una letra y un número"));
        }
        if (usuarioRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "El email ya está registrado"));
        }

        Usuario u = new Usuario();
        u.setNombre(nombre);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(password));
        u.setProveedor("local");
        u.setRol(usuarioRepository.existsByRol("ADMIN") ? "USER" : "ADMIN");
        usuarioRepository.save(u);

        auditLogService.registrar(email, nombre, TipoAccion.REGISTRO,
            u.getRol().equals("ADMIN") ? "Primer usuario — rol ADMIN asignado" : null);

        return ResponseEntity.ok(Map.of("mensaje", "Usuario registrado exitosamente"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body,
                                   HttpServletRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(body.get("email"), body.get("password"))
            );

            SecurityContext ctx = SecurityContextHolder.createEmptyContext();
            ctx.setAuthentication(auth);
            SecurityContextHolder.setContext(ctx);

            HttpSession session = request.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, ctx);

            String email = body.get("email");
            Usuario u = usuarioRepository.findByEmail(email).orElseThrow();

            auditLogService.registrar(email, u.getNombre(), TipoAccion.LOGIN, null);

            return ResponseEntity.ok(Map.of(
                "autenticado",    true,
                "nombre",         u.getNombre(),
                "email",          u.getEmail(),
                "idioma",         u.getIdioma()  != null ? u.getIdioma() : "es",
                "modoOscuro",     u.isModoOscuro(),
                "rol",            u.getRol()     != null ? u.getRol()    : "USER",
                "proveedor",      u.getProveedor(),
                "fechaCreacion",  u.getFechaCreacion() != null ? u.getFechaCreacion().toString() : ""
            ));
        } catch (DisabledException e) {
            return ResponseEntity.status(403).body(Map.of("error", "Tu cuenta ha sido inhabilitada. Contacta al administrador."));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Credenciales incorrectas"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("autenticado", false));
        }

        String email = extraerEmail(authentication);
        return usuarioRepository.findByEmail(email)
            .map(u -> {
                if (!u.isActivo()) {
                    SecurityContextHolder.clearContext();
                    return ResponseEntity.status(403)
                        .body(Map.<String, Object>of("error", "inhabilitado", "autenticado", false));
                }
                return ResponseEntity.ok(Map.<String, Object>of(
                    "autenticado",   true,
                    "nombre",        u.getNombre(),
                    "email",         u.getEmail(),
                    "idioma",        u.getIdioma()  != null ? u.getIdioma()  : "es",
                    "modoOscuro",    u.isModoOscuro(),
                    "rol",           u.getRol()     != null ? u.getRol()     : "USER",
                    "proveedor",     u.getProveedor(),
                    "fechaCreacion", u.getFechaCreacion() != null ? u.getFechaCreacion().toString() : ""
                ));
            })
            .orElse(ResponseEntity.status(401).body(Map.of("autenticado", false)));
    }

    @PutMapping("/preferencias")
    public ResponseEntity<?> preferencias(@RequestBody Map<String, Object> body,
                                          Authentication authentication) {
        String email = extraerEmail(authentication);
        usuarioRepository.findByEmail(email).ifPresent(u -> {
            if (body.containsKey("idioma")) u.setIdioma((String) body.get("idioma"));
            if (body.containsKey("modoOscuro")) {
                Object val = body.get("modoOscuro");
                if (val instanceof Boolean b) u.setModoOscuro(b);
            }
            usuarioRepository.save(u);
        });
        return ResponseEntity.ok(Map.of("mensaje", "Preferencias actualizadas"));
    }

    @DeleteMapping("/perfil")
    @Transactional
    public ResponseEntity<?> eliminarCuenta(Authentication authentication,
                                            HttpServletRequest request) {
        String email = extraerEmail(authentication);
        Usuario u = usuarioRepository.findByEmail(email).orElseThrow();

        auditLogService.registrar(email, u.getNombre(), TipoAccion.ELIMINACION_CUENTA, null);

        cultivoRepository.deleteAll(cultivoRepository.findByUsuario(u));
        tipoCultivoRepository.deleteAll(tipoCultivoRepository.findByUsuario(u));
        productoRepository.deleteAll(productoRepository.findByUsuario(u));
        proveedorRepository.deleteAll(proveedorRepository.findByUsuario(u));
        personaRepository.deleteAll(personaRepository.findByUsuario(u));

        usuarioRepository.delete(u);

        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();

        return ResponseEntity.ok(Map.of("mensaje", "Cuenta eliminada exitosamente"));
    }

    private String extraerEmail(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof OAuth2User oAuth2User) return oAuth2User.getAttribute("email");
        return authentication.getName();
    }
}
