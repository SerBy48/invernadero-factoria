package com.usco.invernadero.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 200)
    private String password;

    @Column(nullable = false, length = 20)
    private String proveedor = "local";

    @Column(length = 10)
    private String idioma = "es";

    @Column(nullable = false)
    private boolean modoOscuro = false;

    @Column(name = "rol", columnDefinition = "varchar(10) not null default 'USER'")
    private String rol = "USER";

    @Column(name = "activo", columnDefinition = "boolean not null default true")
    private boolean activo = true;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        if (fechaCreacion == null) fechaCreacion = LocalDateTime.now();
        if (rol == null) rol = "USER";
    }
}
