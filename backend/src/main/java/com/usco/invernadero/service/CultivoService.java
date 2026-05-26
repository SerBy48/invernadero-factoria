package com.usco.invernadero.service;

import com.usco.invernadero.entity.Cultivo;
import com.usco.invernadero.entity.Usuario;
import java.util.List;

public interface CultivoService {

    List<Cultivo> findAll(Usuario usuario);
    Cultivo findById(Long id, Usuario usuario);
    Cultivo save(Cultivo entity);
    Cultivo update(Long id, Cultivo entity, Usuario usuario);
    void delete(Long id, Usuario usuario);
}
