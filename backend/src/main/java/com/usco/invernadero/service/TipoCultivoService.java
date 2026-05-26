package com.usco.invernadero.service;

import com.usco.invernadero.entity.TipoCultivo;
import com.usco.invernadero.entity.Usuario;
import java.util.List;

public interface TipoCultivoService {

    List<TipoCultivo> findAll(Usuario usuario);
    TipoCultivo findById(Long id, Usuario usuario);
    TipoCultivo save(TipoCultivo entity);
    TipoCultivo update(Long id, TipoCultivo entity, Usuario usuario);
    void delete(Long id, Usuario usuario);
}
