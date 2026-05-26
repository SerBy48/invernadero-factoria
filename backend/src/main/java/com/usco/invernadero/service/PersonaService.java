package com.usco.invernadero.service;

import com.usco.invernadero.entity.Persona;
import com.usco.invernadero.entity.Usuario;
import java.util.List;

public interface PersonaService {

    List<Persona> findAll(Usuario usuario);
    Persona findById(Long id, Usuario usuario);
    Persona save(Persona entity);
    Persona update(Long id, Persona entity, Usuario usuario);
    void delete(Long id, Usuario usuario);
}
