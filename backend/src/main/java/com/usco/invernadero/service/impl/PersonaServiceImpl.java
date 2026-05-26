package com.usco.invernadero.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.usco.invernadero.entity.Persona;
import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.exception.PersonaNotFoundException;
import com.usco.invernadero.repository.PersonaRepository;
import com.usco.invernadero.service.PersonaService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonaServiceImpl implements PersonaService {

    private final PersonaRepository repository;
    private final MessageSource messageSource;

    @Override
    public List<Persona> findAll(Usuario usuario) {
        return repository.findByUsuario(usuario);
    }

    @Override
    public Persona findById(Long id, Usuario usuario) {
        return repository.findByIdAndUsuario(id, usuario)
                .orElseThrow(() -> new PersonaNotFoundException(id, messageSource));
    }

    @Override
    @Transactional
    public Persona save(Persona entity) {
        return repository.save(entity);
    }

    @Override
    @Transactional
    public Persona update(Long id, Persona entity, Usuario usuario) {
        Persona existing = findById(id, usuario);
        existing.setNombre(entity.getNombre());
        existing.setApellido(entity.getApellido());
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
