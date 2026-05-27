package com.usco.invernadero.config;

import com.usco.invernadero.entity.TipoAccion;
import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.repository.UsuarioRepository;
import com.usco.invernadero.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UsuarioRepository usuarioRepository;
    private final AuditLogService   auditLogService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public OAuth2SuccessHandler(UsuarioRepository usuarioRepository,
                                AuditLogService auditLogService) {
        this.usuarioRepository = usuarioRepository;
        this.auditLogService   = auditLogService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email  = oAuth2User.getAttribute("email");
        String nombre = oAuth2User.getAttribute("name");

        boolean[] esNuevo = {false};
        Usuario usuario = usuarioRepository.findByEmail(email).orElseGet(() -> {
            esNuevo[0] = true;
            Usuario u = new Usuario();
            u.setEmail(email);
            u.setNombre(nombre != null ? nombre : email);
            u.setProveedor("google");
            u.setRol(usuarioRepository.existsByRol("ADMIN") ? "USER" : "ADMIN");
            return usuarioRepository.save(u);
        });

        if (esNuevo[0]) {
            auditLogService.registrar(email, usuario.getNombre(), TipoAccion.REGISTRO,
                "Registro vía Google" + (usuario.getRol().equals("ADMIN") ? " - rol ADMIN asignado" : ""));
        } else {
            auditLogService.registrar(email, usuario.getNombre(), TipoAccion.LOGIN, "Google OAuth2");
        }

        getRedirectStrategy().sendRedirect(request, response, frontendUrl);
    }
}
