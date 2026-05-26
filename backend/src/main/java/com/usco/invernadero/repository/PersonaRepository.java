package com.usco.invernadero.repository;

import com.usco.invernadero.entity.Persona;
import com.usco.invernadero.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonaRepository extends JpaRepository<Persona, Long> {
    List<Persona> findByUsuario(Usuario usuario);
    Optional<Persona> findByIdAndUsuario(Long id, Usuario usuario);
}
