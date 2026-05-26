package com.usco.invernadero.repository;

import com.usco.invernadero.entity.Cultivo;
import com.usco.invernadero.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CultivoRepository extends JpaRepository<Cultivo, Long> {
    List<Cultivo> findByUsuario(Usuario usuario);
    Optional<Cultivo> findByIdAndUsuario(Long id, Usuario usuario);
}
