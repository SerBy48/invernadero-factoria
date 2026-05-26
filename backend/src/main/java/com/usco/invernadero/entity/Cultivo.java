package com.usco.invernadero.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "cultivo")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cultivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 100)
    @NotNull
    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @ManyToOne
    @JoinColumn(name = "tipo_cultivo_id", nullable = false)
    private TipoCultivo tipoCultivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Usuario usuario;

}
