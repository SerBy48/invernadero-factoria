package com.usco.invernadero.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String usuarioEmail;

    @Column(length = 100)
    private String usuarioNombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoAccion accion;

    @Column(length = 255)
    private String detalle;

    @Column(nullable = false)
    private LocalDateTime fecha;
}
