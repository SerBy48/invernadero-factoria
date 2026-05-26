package com.usco.invernadero.service;

import com.usco.invernadero.entity.Proveedor;
import com.usco.invernadero.entity.Usuario;
import java.util.List;

public interface ProveedorService {

    List<Proveedor> findAll(Usuario usuario);
    Proveedor findById(Long id, Usuario usuario);
    Proveedor save(Proveedor entity);
    Proveedor update(Long id, Proveedor entity, Usuario usuario);
    void delete(Long id, Usuario usuario);
}
