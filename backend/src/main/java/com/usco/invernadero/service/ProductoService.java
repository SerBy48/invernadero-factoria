package com.usco.invernadero.service;

import com.usco.invernadero.entity.Producto;
import com.usco.invernadero.entity.Usuario;
import java.util.List;

public interface ProductoService {

    List<Producto> findAll(Usuario usuario);
    Producto findById(Long id, Usuario usuario);
    Producto save(Producto entity);
    Producto update(Long id, Producto entity, Usuario usuario);
    void delete(Long id, Usuario usuario);
}
