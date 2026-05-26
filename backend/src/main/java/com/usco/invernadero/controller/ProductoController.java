package com.usco.invernadero.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import com.usco.invernadero.entity.Producto;
import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.repository.UsuarioRepository;
import com.usco.invernadero.service.ProductoService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService service;
    private final MessageSource messageSource;
    private final UsuarioRepository usuarioRepository;

    private String msg(String key, Object... args) {
        return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
    }

    private Usuario resolverUsuario(Authentication auth) {
        Object principal = auth.getPrincipal();
        String email = principal instanceof OAuth2User u ? u.getAttribute("email") : auth.getName();
        return usuarioRepository.findByEmail(email).orElseThrow();
    }

    @GetMapping
    public ResponseEntity<List<Producto>> getAll(Authentication auth) {
        return ResponseEntity.ok(service.findAll(resolverUsuario(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> getById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(service.findById(id, resolverUsuario(auth)));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody Producto entity, Authentication auth) {
        entity.setUsuario(resolverUsuario(auth));
        Producto saved = service.save(entity);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                    "mensaje", msg("success.created"),
                    "dato",    saved
                ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @Valid @RequestBody Producto entity, Authentication auth) {
        Producto updated = service.update(id, entity, resolverUsuario(auth));
        return ResponseEntity.ok(Map.of(
            "mensaje", msg("success.updated"),
            "dato",    updated
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id, Authentication auth) {
        service.delete(id, resolverUsuario(auth));
        return ResponseEntity.ok(Map.of("mensaje", msg("success.deleted")));
    }
}
