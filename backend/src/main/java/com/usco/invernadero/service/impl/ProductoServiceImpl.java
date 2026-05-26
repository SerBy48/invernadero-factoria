package com.usco.invernadero.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.usco.invernadero.entity.Producto;
import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.exception.ProductoNotFoundException;
import com.usco.invernadero.repository.ProductoRepository;
import com.usco.invernadero.service.ProductoService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository repository;
    private final MessageSource messageSource;

    @Override
    public List<Producto> findAll(Usuario usuario) {
        return repository.findByUsuario(usuario);
    }

    @Override
    public Producto findById(Long id, Usuario usuario) {
        return repository.findByIdAndUsuario(id, usuario)
                .orElseThrow(() -> new ProductoNotFoundException(id, messageSource));
    }

    @Override
    @Transactional
    public Producto save(Producto entity) {
        return repository.save(entity);
    }

    @Override
    @Transactional
    public Producto update(Long id, Producto entity, Usuario usuario) {
        Producto existing = findById(id, usuario);
        existing.setNombre(entity.getNombre());
        existing.setPrecio(entity.getPrecio());
        existing.setStock(entity.getStock());
        return repository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id, Usuario usuario) {
        findById(id, usuario);
        repository.deleteById(id);
    }
}
