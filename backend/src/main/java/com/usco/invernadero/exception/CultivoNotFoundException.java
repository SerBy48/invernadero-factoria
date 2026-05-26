package com.usco.invernadero.exception;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;

public class CultivoNotFoundException extends RuntimeException {

    public CultivoNotFoundException(Long id, MessageSource ms) {
        super(ms.getMessage("error.not.found", new Object[]{id},
              LocaleContextHolder.getLocale()));
    }
}
