package com.usco.invernadero.config;

import com.usco.invernadero.entity.TipoAccion;
import com.usco.invernadero.repository.UsuarioRepository;
import com.usco.invernadero.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuditLogoutHandler implements LogoutHandler {

    private final AuditLogService auditLogService;
    private final UsuarioRepository usuarioRepository;

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication auth) {
        if (auth == null) return;
        try {
            String email = extraerEmail(auth);
            usuarioRepository.findByEmail(email).ifPresent(u ->
                auditLogService.registrar(email, u.getNombre(), TipoAccion.LOGOUT, null));
        } catch (Exception ignored) {}
    }

    private String extraerEmail(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof OAuth2User u) return u.getAttribute("email");
        return auth.getName();
    }
}
