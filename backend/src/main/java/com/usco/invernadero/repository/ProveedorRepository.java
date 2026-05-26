package com.usco.invernadero.repository;

import com.usco.invernadero.entity.Proveedor;
import com.usco.invernadero.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
    List<Proveedor> findByUsuario(Usuario usuario);
    Optional<Proveedor> findByIdAndUsuario(Long id, Usuario usuario);
}
