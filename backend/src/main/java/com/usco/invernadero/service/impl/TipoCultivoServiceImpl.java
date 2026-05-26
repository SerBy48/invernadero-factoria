package com.usco.invernadero.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.usco.invernadero.entity.TipoCultivo;
import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.exception.TipoCultivoNotFoundException;
import com.usco.invernadero.repository.TipoCultivoRepository;
import com.usco.invernadero.service.TipoCultivoService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoCultivoServiceImpl implements TipoCultivoService {

    private final TipoCultivoRepository repository;
    private final MessageSource messageSource;

    @Override
    public List<TipoCultivo> findAll(Usuario usuario) {
        return repository.findByUsuario(usuario);
    }

    @Override
    public TipoCultivo findById(Long id, Usuario usuario) {
        return repository.findByIdAndUsuario(id, usuario)
                .orElseThrow(() -> new TipoCultivoNotFoundException(id, messageSource));
    }

    @Override
    @Transactional
    public TipoCultivo save(TipoCultivo entity) {
        return repository.save(entity);
    }

    @Override
    @Transactional
    public TipoCultivo update(Long id, TipoCultivo entity, Usuario usuario) {
        TipoCultivo existing = findById(id, usuario);
        existing.setNombre(entity.getNombre());
        return repository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id, Usuario usuario) {
        findById(id, usuario);
        repository.deleteById(id);
    }
}
