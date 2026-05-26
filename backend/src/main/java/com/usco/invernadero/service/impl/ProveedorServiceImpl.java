package com.usco.invernadero.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.usco.invernadero.entity.Proveedor;
import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.exception.ProveedorNotFoundException;
import com.usco.invernadero.repository.ProveedorRepository;
import com.usco.invernadero.service.ProveedorService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProveedorServiceImpl implements ProveedorService {

    private final ProveedorRepository repository;
    private final MessageSource messageSource;

    @Override
    public List<Proveedor> findAll(Usuario usuario) {
        return repository.findByUsuario(usuario);
    }

    @Override
    public Proveedor findById(Long id, Usuario usuario) {
        return repository.findByIdAndUsuario(id, usuario)
                .orElseThrow(() -> new ProveedorNotFoundException(id, messageSource));
    }

    @Override
    @Transactional
    public Proveedor save(Proveedor entity) {
        return repository.save(entity);
    }

    @Override
    @Transactional
    public Proveedor update(Long id, Proveedor entity, Usuario usuario) {
        Proveedor existing = findById(id, usuario);
        existing.setNombre(entity.getNombre());
        existing.setTelefono(entity.getTelefono());
        existing.setEmail(entity.getEmail());
        return repository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id, Usuario usuario) {
        findById(id, usuario);
        repository.deleteById(id);
    }
}
