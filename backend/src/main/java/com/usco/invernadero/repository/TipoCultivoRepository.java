package com.usco.invernadero.repository;

import com.usco.invernadero.entity.TipoCultivo;
import com.usco.invernadero.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipoCultivoRepository extends JpaRepository<TipoCultivo, Long> {
    List<TipoCultivo> findByUsuario(Usuario usuario);
    Optional<TipoCultivo> findByIdAndUsuario(Long id, Usuario usuario);
}
