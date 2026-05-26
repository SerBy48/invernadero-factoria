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
    private final AuditLogService   auditLogService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @GetMapping("/usuarios")
    public ResponseEntity<List<Map<String, Object>>> listarUsuarios() {
        List<Map<String, Object>> lista = usuarioRepository.findAll().stream()
            .map(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",            u.getId());
                m.put("nombre",        u.getNombre());
                m.put("email",         u.getEmail());
                m.put("rol",           u.getRol() != null ? u.getRol() : "USER");
                m.put("activo",        u.isActivo());
                m.put("proveedor",     u.getProveedor());
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
            "activo",  target.isActivo()
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
            HttpServletResponse response) throws IOException {

        response.setCharacterEncoding("UTF-8");
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"auditoria.csv\"");

        List<AuditLog> logs = auditLogService.findWithFilters(accion, mes, anio);
        PrintWriter writer = response.getWriter();
        writer.print('﻿'); // UTF-8 BOM para compatibilidad con Excel
        writer.println("ID,Fecha,Email,Nombre,Accion,Detalle");
        for (AuditLog log : logs) {
            String fecha    = log.getFecha()         != null ? log.getFecha().format(FMT)      : "";
            String nombre   = log.getUsuarioNombre() != null ? log.getUsuarioNombre()           : "";
            String detalle  = log.getDetalle()       != null ? log.getDetalle().replace("\"", "'") : "";
            writer.printf("%d,\"%s\",\"%s\",\"%s\",%s,\"%s\"%n",
                log.getId(), fecha, log.getUsuarioEmail(), nombre, log.getAccion(), detalle);
        }
        writer.flush();
    }

    private String extraerEmail(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof OAuth2User u) return u.getAttribute("email");
        return auth.getName();
    }
}
