package com.usco.invernadero.exception;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;

public class ProductoNotFoundException extends RuntimeException {

    public ProductoNotFoundException(Long id, MessageSource ms) {
        super(ms.getMessage("error.not.found", new Object[]{id},
              LocaleContextHolder.getLocale()));
    }
}
