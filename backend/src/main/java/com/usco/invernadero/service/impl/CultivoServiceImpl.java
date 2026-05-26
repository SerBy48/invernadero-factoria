package com.usco.invernadero.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.usco.invernadero.entity.Cultivo;
import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.exception.CultivoNotFoundException;
import com.usco.invernadero.repository.CultivoRepository;
import com.usco.invernadero.service.CultivoService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CultivoServiceImpl implements CultivoService {

    private final CultivoRepository repository;
    private final MessageSource messageSource;

    @Override
    public List<Cultivo> findAll(Usuario usuario) {
        return repository.findByUsuario(usuario);
    }

    @Override
    public Cultivo findById(Long id, Usuario usuario) {
        return repository.findByIdAndUsuario(id, usuario)
                .orElseThrow(() -> new CultivoNotFoundException(id, messageSource));
    }

    @Override
    @Transactional
    public Cultivo save(Cultivo entity) {
        return repository.save(entity);
    }

    @Override
    @Transactional
    public Cultivo update(Long id, Cultivo entity, Usuario usuario) {
        Cultivo existing = findById(id, usuario);
        existing.setNombre(entity.getNombre());
        existing.setTipoCultivo(entity.getTipoCultivo());
        return repository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id, Usuario usuario) {
        findById(id, usuario);
        repository.deleteById(id);
    }
}
