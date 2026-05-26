package com.usco.invernadero.repository;

import com.usco.invernadero.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query(value = """
        SELECT * FROM audit_log
        WHERE (:accion IS NULL OR accion = :accion)
          AND (:mes    IS NULL OR EXTRACT(MONTH FROM fecha) = :mes)
          AND (:anio   IS NULL OR EXTRACT(YEAR  FROM fecha) = :anio)
        ORDER BY fecha DESC
        """, nativeQuery = true)
    List<AuditLog> findWithFilters(
        @Param("accion") String accion,
        @Param("mes")    Integer mes,
        @Param("anio")   Integer anio);
}
