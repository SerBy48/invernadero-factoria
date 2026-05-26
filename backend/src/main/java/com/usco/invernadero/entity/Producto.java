package com.usco.invernadero.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "producto",
       uniqueConstraints = {
        @UniqueConstraint(columnNames = {"nombre", "usuario_id"})
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 100)
    @NotNull
    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @Column(name = "precio", nullable = false)
    private BigDecimal precio;

    @NotNull
    @Column(name = "stock", length = 255, nullable = false)
    private Integer stock;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Usuario usuario;

}
