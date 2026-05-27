-- Restricciones de validacion para PostgreSQL.
-- Ejecutar solo despues de limpiar o corregir registros antiguos invalidos.

ALTER TABLE tipo_cultivo
    ALTER COLUMN nombre SET NOT NULL,
    ADD CONSTRAINT chk_tipo_cultivo_nombre_formato
        CHECK (nombre <> '' AND nombre ~ '^[[:alpha:] ]+$');

ALTER TABLE cultivo
    ALTER COLUMN nombre SET NOT NULL,
    ALTER COLUMN tipo_cultivo_id SET NOT NULL,
    ADD CONSTRAINT chk_cultivo_nombre_formato
        CHECK (nombre <> '' AND nombre ~ '^[[:alpha:] ]+$');

ALTER TABLE producto
    ALTER COLUMN nombre SET NOT NULL,
    ALTER COLUMN precio SET NOT NULL,
    ALTER COLUMN stock SET NOT NULL,
    ALTER COLUMN moneda SET DEFAULT 'COP',
    ALTER COLUMN moneda SET NOT NULL,
    ADD CONSTRAINT chk_producto_nombre_obligatorio
        CHECK (nombre <> ''),
    ADD CONSTRAINT chk_producto_precio_positivo
        CHECK (precio > 0),
    ADD CONSTRAINT chk_producto_stock_no_negativo
        CHECK (stock >= 0),
    ADD CONSTRAINT chk_producto_moneda
        CHECK (moneda IN ('COP', 'USD'));

ALTER TABLE proveedor
    ALTER COLUMN nombre SET NOT NULL,
    ALTER COLUMN telefono SET NOT NULL,
    ALTER COLUMN email SET NOT NULL,
    ADD CONSTRAINT chk_proveedor_nombre_formato
        CHECK (nombre <> '' AND nombre ~ '^[[:alpha:] ]+$'),
    ADD CONSTRAINT chk_proveedor_telefono_formato
        CHECK (telefono ~ '^\+[1-9][0-9]{6,14}$'),
    ADD CONSTRAINT chk_proveedor_email_formato
        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');

ALTER TABLE persona
    ALTER COLUMN nombre SET NOT NULL,
    ALTER COLUMN apellido SET NOT NULL,
    ALTER COLUMN email SET NOT NULL,
    ADD CONSTRAINT chk_persona_nombre_formato
        CHECK (nombre <> '' AND nombre ~ '^[[:alpha:] ]+$'),
    ADD CONSTRAINT chk_persona_apellido_formato
        CHECK (apellido <> '' AND apellido ~ '^[[:alpha:] ]+$'),
    ADD CONSTRAINT chk_persona_email_formato
        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');
