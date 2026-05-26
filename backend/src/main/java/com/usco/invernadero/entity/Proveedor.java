package com.usco.invernadero.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "proveedor")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 150)
    @NotNull
    @Column(name = "nombre", length = 150, nullable = false)
    private String nombre;

    @Size(max = 20)
    @Column(name = "telefono", length = 20, nullable = true)
    private String telefono;

    @Size(max = 150)
    @Column(name = "email", length = 150, nullable = true)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Usuario usuario;

}
