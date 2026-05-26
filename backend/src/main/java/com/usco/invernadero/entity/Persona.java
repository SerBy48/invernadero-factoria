package com.usco.invernadero.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "persona",
       uniqueConstraints = {
        @UniqueConstraint(columnNames = {"email", "usuario_id"})
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Persona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 100)
    @NotNull
    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @Size(max = 100)
    @NotNull
    @Column(name = "apellido", length = 100, nullable = false)
    private String apellido;

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
