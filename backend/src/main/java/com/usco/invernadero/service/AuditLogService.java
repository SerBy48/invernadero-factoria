package com.usco.invernadero.service;

import com.usco.invernadero.entity.AuditLog;
import com.usco.invernadero.entity.TipoAccion;
import com.usco.invernadero.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository repository;

    public void registrar(String email, String nombre, TipoAccion accion, String detalle) {
        repository.save(AuditLog.builder()
            .usuarioEmail(email)
            .usuarioNombre(nombre)
            .accion(accion)
            .detalle(detalle)
            .fecha(LocalDateTime.now())
            .build());
    }

    public List<AuditLog> findWithFilters(String accion, Integer mes, Integer anio) {
        String a = (accion != null && !accion.isBlank()) ? accion : null;
        return repository.findWithFilters(a, mes, anio);
    }
}
