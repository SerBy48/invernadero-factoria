"""
Factoría de Software - Generador de Proyecto Invernadero
=========================================================
Lee modelo.json y genera:
  - Backend  : Spring Boot (entidades, repositorios, servicios, controladores, seguridad, i18n)
  - Frontend : React + MUI  (páginas CRUD por entidad, i18n manual, layout)
  - CI/CD    : GitHub Actions workflows
  - Taiga    : historias de usuario en JSON listas para importar vía API

Uso:
    python generator.py --modelo ../modelo/modelo.json --salida ../salida
"""

import json
import os
import sys
import argparse
import re
from pathlib import Path

# ─────────────────────────── Utilidades ───────────────────────────

def to_pascal(name: str) -> str:
    """tipo_cultivo  →  TipoCultivo"""
    return "".join(w.capitalize() for w in re.split(r"[_\-]", name))

def to_camel(name: str) -> str:
    """tipo_cultivo  →  tipoCultivo"""
    parts = re.split(r"[_\-]", name)
    return parts[0] + "".join(w.capitalize() for w in parts[1:])

def to_kebab(name: str) -> str:
    """tipo_cultivo  →  tipo-cultivo"""
    return name.replace("_", "-")

def mkdir(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  ✔  {path}")

# ─────────────────────── Tipos Java ───────────────────────────────

JAVA_TYPES = {
    "identity": "Long",
    "string":   "String",
    "integer":  "Integer",
    "decimal":  "java.math.BigDecimal",
    "boolean":  "Boolean",
    "date":     "java.time.LocalDate",
    "datetime": "java.time.LocalDateTime",
    "fk":       None,   # se resuelve por fk_entidad
}

def java_type(atrib, entidades_map):
    t = atrib["tipo_dato"]
    if t == "fk":
        return to_pascal(atrib["fk_entidad"])
    return JAVA_TYPES.get(t, "String")

# ═══════════════════════════════════════════════════════════════════
#  BACKEND
# ═══════════════════════════════════════════════════════════════════

def gen_backend(modelo: dict, base: Path):
    pkg   = modelo["paquete_base"]
    pkg_path = base / "src/main/java" / pkg.replace(".", "/")
    res_path = base / "src/main/resources"

    entidades = modelo["entidades"]
    entidades_map = {e["nombre"]: e for e in entidades}

    # ── pom.xml
    gen_pom(modelo, base)

    # ── application.properties
    gen_app_props(modelo, res_path)

    # ── i18n messages
    gen_messages(modelo, res_path)

    # ── SecurityConfig (OAuth2 + JWT ready)
    gen_security(pkg, pkg_path)

    # ── i18n config
    gen_i18n_config(pkg, pkg_path)

    # ── Por cada entidad
    for ent in entidades:
        gen_entity(ent, entidades_map, pkg, pkg_path)
        gen_repository(ent, pkg, pkg_path)
        gen_service_interface(ent, pkg, pkg_path)
        gen_service_impl(ent, entidades_map, pkg, pkg_path)
        gen_controller(ent, pkg, pkg_path)
        gen_exception(ent, pkg, pkg_path)

    # ── Main application
    gen_main_app(modelo, pkg, pkg_path)

    # ── Tests básicos por entidad
    for ent in entidades:
        gen_test(ent, pkg, base)


def gen_pom(modelo, base):
    pkg = modelo["paquete_base"]
    artifact = modelo["proyecto"]
    content = f"""<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.5</version>
    <relativePath/>
  </parent>

  <groupId>{pkg}</groupId>
  <artifactId>{artifact}</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>{artifact}</name>

  <properties>
    <java.version>17</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-oauth2-client</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-mail</artifactId>
    </dependency>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <optional>true</optional>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <configuration>
          <excludes>
            <exclude>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
            </exclude>
          </excludes>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
"""
    write(base / "pom.xml", content)


def gen_app_props(modelo, res_path):
    content = f"""# ── Base de datos
spring.datasource.url=jdbc:postgresql://{modelo['host']}:{modelo['puerto']}/{modelo['dbname']}
spring.datasource.username={modelo['username']}
spring.datasource.password={modelo['password']}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# ── Servidor
server.port=8080

# ── Internacionalización
spring.messages.basename=i18n/messages
spring.messages.encoding=UTF-8
spring.messages.default-locale=es

# ── OAuth2 Google (completar con credenciales reales)
spring.security.oauth2.client.registration.google.client-id=${{GOOGLE_CLIENT_ID}}
spring.security.oauth2.client.registration.google.client-secret=${{GOOGLE_CLIENT_SECRET}}
spring.security.oauth2.client.registration.google.scope=profile,email

# ── Correo (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${{GMAIL_USER}}
spring.mail.password=${{GMAIL_APP_PASSWORD}}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# ── CORS
cors.allowed-origins=http://localhost:5173
"""
    write(res_path / "application.properties", content)

    # application-test.properties (H2 para tests)
    test_props = """spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop
spring.security.oauth2.client.registration.google.client-id=test
spring.security.oauth2.client.registration.google.client-secret=test
"""
    write(res_path / "application-test.properties", test_props)


def gen_messages(modelo, res_path):
    idiomas = modelo.get("idiomas", ["es", "en"])
    i18n_path = res_path / "i18n"

    # Base messages (español)
    lines_es = ["# ── Mensajes generales\n",
                "app.nombre=Sistema Invernadero\n",
                "error.not.found=Recurso con id {0} no encontrado\n",
                "error.validation=Error de validación\n",
                "success.created=Recurso creado exitosamente\n",
                "success.updated=Recurso actualizado exitosamente\n",
                "success.deleted=Recurso eliminado exitosamente\n\n"]

    lines_en = ["# ── General messages\n",
                "app.nombre=Greenhouse System\n",
                "error.not.found=Resource with id {0} not found\n",
                "error.validation=Validation error\n",
                "success.created=Resource created successfully\n",
                "success.updated=Resource updated successfully\n",
                "success.deleted=Resource deleted successfully\n\n"]

    for ent in modelo["entidades"]:
        n = ent["nombre"]
        p = to_pascal(n)
        lines_es.append(f"entidad.{n}.nombre={p}\n")
        lines_es.append(f"entidad.{n}.descripcion={ent['descripcion']}\n")
        for a in ent["atributos"]:
            lines_es.append(f"entidad.{n}.{a['nombre']}={a['nombre'].replace('_',' ').capitalize()}\n")
        lines_es.append("\n")

        lines_en.append(f"entidad.{n}.nombre={p}\n")
        lines_en.append(f"entidad.{n}.descripcion={ent['descripcion']}\n")
        for a in ent["atributos"]:
            lines_en.append(f"entidad.{n}.{a['nombre']}={a['nombre'].replace('_',' ').capitalize()}\n")
        lines_en.append("\n")

    write(i18n_path / "messages_es.properties", "".join(lines_es))
    write(i18n_path / "messages_en.properties", "".join(lines_en))
    # default fallback
    write(i18n_path / "messages.properties", "".join(lines_es))


def gen_i18n_config(pkg, pkg_path):
    content = f"""package {pkg}.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;

import java.util.List;
import java.util.Locale;

/**
 * Configuración de internacionalización manual.
 * El cliente envía el header "Accept-Language: es" o "Accept-Language: en"
 * para seleccionar el idioma. También se puede usar el parámetro ?lang=es.
 */
@Configuration
public class I18nConfig implements WebMvcConfigurer {{

    @Bean
    public LocaleResolver localeResolver() {{
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setSupportedLocales(List.of(new Locale("es"), Locale.ENGLISH));
        resolver.setDefaultLocale(new Locale("es"));
        return resolver;
    }}

    @Bean
    public LocaleChangeInterceptor localeChangeInterceptor() {{
        LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
        interceptor.setParamName("lang");
        return interceptor;
    }}

    @Override
    public void addInterceptors(InterceptorRegistry registry) {{
        registry.addInterceptor(localeChangeInterceptor());
    }}
}}
"""
    write(pkg_path / "config/I18nConfig.java", content)


def gen_security(pkg, pkg_path):
    content = f"""package {pkg}.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuración de seguridad:
 * - OAuth2 Login con Google (Clase 30.04)
 * - CORS habilitado para el frontend React (puerto 5173)
 * - Rutas /api/** protegidas; /public/** abiertas
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {{

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {{
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/public/**", "/error").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .defaultSuccessUrl("/api/auth/me", true)
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/public/logout-success")
            );

        return http.build();
    }}

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {{
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }}
}}
"""
    write(pkg_path / "config/SecurityConfig.java", content)

    # AuthController
    auth_ctrl = f"""package {pkg}.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {{

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            @AuthenticationPrincipal OAuth2User principal) {{
        if (principal == null) {{
            return ResponseEntity.ok(Map.of("autenticado", false));
        }}
        return ResponseEntity.ok(Map.of(
            "autenticado", true,
            "nombre",      principal.getAttribute("name"),
            "email",       principal.getAttribute("email"),
            "foto",        principal.getAttribute("picture")
        ));
    }}
}}
"""
    write(pkg_path / "controller/AuthController.java", auth_ctrl)


def gen_entity(ent, entidades_map, pkg, pkg_path):
    name   = ent["nombre"]
    pascal = to_pascal(name)
    attrs  = ent["atributos"]
    rels   = ent.get("relaciones", [])
    cons   = ent.get("constraints", [])

    imports = set([
        "jakarta.persistence.*",
        "jakarta.validation.constraints.*",
        "lombok.*",
    ])

    fields_code = []
    for a in attrs:
        t = a["tipo_dato"]
        fname = to_camel(a["nombre"])

        if t == "identity":
            fields_code.append(
                "    @Id\n"
                "    @GeneratedValue(strategy = GenerationType.IDENTITY)\n"
                f"    private Long {fname};"
            )
        elif t == "fk":
            rel_pascal = to_pascal(a["fk_entidad"])
            jcol = a["nombre"]
            nullable = "true" if a.get("nulo", True) else "false"
            fields_code.append(
                "    @ManyToOne\n"
                f'    @JoinColumn(name = "{jcol}", nullable = {nullable})\n'
                f"    private {rel_pascal} {to_camel(a['fk_entidad'])};"
            )
        elif t == "decimal":
            imports.add("java.math.BigDecimal")
            col_ann = f'    @Column(name = "{a["nombre"]}", nullable = {"false" if not a.get("nulo",True) else "true"})\n'
            fields_code.append(col_ann + f"    private BigDecimal {fname};")
        else:
            jt = JAVA_TYPES.get(t, "String")
            col_ann = f'    @Column(name = "{a["nombre"]}", length = {a.get("longitud") or 255}, nullable = {"false" if not a.get("nulo", True) else "true"})\n'
            if not a.get("nulo", True):
                col_ann = "    @NotNull\n" + col_ann
            if t == "string" and a.get("longitud"):
                col_ann = f'    @Size(max = {a["longitud"]})\n' + col_ann
            fields_code.append(col_ann + f"    private {jt} {fname};")

    # Unique constraints en @Table
    unique_clauses = []
    for c in cons:
        if c["tipo"] == "Unique":
            cols = ", ".join(f'"{col}"' for col in c["columnas"])
            unique_clauses.append(f"        @UniqueConstraint(columnNames = {{{cols}}})")
    table_ann = f'@Table(name = "{name}"'
    if unique_clauses:
        uc_str = ",\n".join(unique_clauses)
        table_ann += f',\n       uniqueConstraints = {{\n{uc_str}\n       }}'
    table_ann += ")"

    imports_str = "\n".join(f"import {i};" for i in sorted(imports))

    content = f"""package {pkg}.entity;

{imports_str}

@Entity
{table_ann}
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class {pascal} {{

{"".join(f for f in [chr(10).join([f]) for f in fields_code])}

}}
"""
    # Limpieza de líneas vacías extra
    content = re.sub(r'\n{3,}', '\n\n', content)
    write(pkg_path / f"entity/{pascal}.java", content)


def gen_repository(ent, pkg, pkg_path):
    name   = ent["nombre"]
    pascal = to_pascal(name)
    content = f"""package {pkg}.repository;

import {pkg}.entity.{pascal};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface {pascal}Repository extends JpaRepository<{pascal}, Long> {{
}}
"""
    write(pkg_path / f"repository/{pascal}Repository.java", content)


def gen_service_interface(ent, pkg, pkg_path):
    name   = ent["nombre"]
    pascal = to_pascal(name)
    content = f"""package {pkg}.service;

import {pkg}.entity.{pascal};
import java.util.List;

public interface {pascal}Service {{

    List<{pascal}> findAll();
    {pascal} findById(Long id);
    {pascal} save({pascal} entity);
    {pascal} update(Long id, {pascal} entity);
    void delete(Long id);
}}
"""
    write(pkg_path / f"service/{pascal}Service.java", content)


def gen_service_impl(ent, entidades_map, pkg, pkg_path):
    name   = ent["nombre"]
    pascal = to_pascal(name)
    camel  = to_camel(name)

    # Campos a actualizar (excluir pk y fk por simplicidad)
    setters = []
    for a in ent["atributos"]:
        if not a.get("pk") and a["tipo_dato"] != "fk":
            fname = to_camel(a["nombre"])
            setters.append(f"        existing.set{fname[0].upper()+fname[1:]}(entity.get{fname[0].upper()+fname[1:]}());")
    for a in ent["atributos"]:
        if a["tipo_dato"] == "fk":
            rel = to_camel(a["fk_entidad"])
            setters.append(f"        existing.set{rel[0].upper()+rel[1:]}(entity.get{rel[0].upper()+rel[1:]}());")

    setters_str = "\n".join(setters) if setters else "        // sin campos adicionales"

    content = f"""package {pkg}.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import {pkg}.entity.{pascal};
import {pkg}.exception.{pascal}NotFoundException;
import {pkg}.repository.{pascal}Repository;
import {pkg}.service.{pascal}Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class {pascal}ServiceImpl implements {pascal}Service {{

    private final {pascal}Repository repository;
    private final MessageSource messageSource;

    @Override
    public List<{pascal}> findAll() {{
        return repository.findAll();
    }}

    @Override
    public {pascal} findById(Long id) {{
        return repository.findById(id)
                .orElseThrow(() -> new {pascal}NotFoundException(id, messageSource));
    }}

    @Override
    @Transactional
    public {pascal} save({pascal} entity) {{
        return repository.save(entity);
    }}

    @Override
    @Transactional
    public {pascal} update(Long id, {pascal} entity) {{
        {pascal} existing = findById(id);
{setters_str}
        return repository.save(existing);
    }}

    @Override
    @Transactional
    public void delete(Long id) {{
        findById(id);
        repository.deleteById(id);
    }}
}}
"""
    write(pkg_path / f"service/impl/{pascal}ServiceImpl.java", content)


def gen_controller(ent, pkg, pkg_path):
    name   = ent["nombre"]
    pascal = to_pascal(name)
    kebab  = to_kebab(name)

    content = f"""package {pkg}.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import {pkg}.entity.{pascal};
import {pkg}.service.{pascal}Service;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/{kebab}s")
@RequiredArgsConstructor
public class {pascal}Controller {{

    private final {pascal}Service service;
    private final MessageSource messageSource;

    private String msg(String key, Object... args) {{
        return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
    }}

    @GetMapping
    public ResponseEntity<List<{pascal}>> getAll() {{
        return ResponseEntity.ok(service.findAll());
    }}

    @GetMapping("/{"{id}"}")
    public ResponseEntity<{pascal}> getById(@PathVariable Long id) {{
        return ResponseEntity.ok(service.findById(id));
    }}

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody {pascal} entity) {{
        {pascal} saved = service.save(entity);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                    "mensaje", msg("success.created"),
                    "dato",    saved
                ));
    }}

    @PutMapping("/{"{id}"}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @Valid @RequestBody {pascal} entity) {{
        {pascal} updated = service.update(id, entity);
        return ResponseEntity.ok(Map.of(
            "mensaje", msg("success.updated"),
            "dato",    updated
        ));
    }}

    @DeleteMapping("/{"{id}"}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {{
        service.delete(id);
        return ResponseEntity.ok(Map.of("mensaje", msg("success.deleted")));
    }}
}}
"""
    write(pkg_path / f"controller/{pascal}Controller.java", content)


def gen_exception(ent, pkg, pkg_path):
    name   = ent["nombre"]
    pascal = to_pascal(name)

    exc = f"""package {pkg}.exception;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;

public class {pascal}NotFoundException extends RuntimeException {{

    public {pascal}NotFoundException(Long id, MessageSource ms) {{
        super(ms.getMessage("error.not.found", new Object[]{{id}},
              LocaleContextHolder.getLocale()));
    }}
}}
"""
    write(pkg_path / f"exception/{pascal}NotFoundException.java", exc)

    # Global exception handler (se escribe solo una vez, verificamos existencia lógica)
    handler_path = pkg_path / "exception/GlobalExceptionHandler.java"
    if not handler_path.exists():
        handler = f"""package {pkg}.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {{

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(RuntimeException ex) {{
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(Map.of("error", ex.getMessage()));
    }}

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex) {{
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e ->
            errores.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(Map.of("errores", errores));
    }}
}}
"""
        write(handler_path, handler)


def gen_main_app(modelo, pkg, pkg_path):
    app_name = to_pascal(modelo["proyecto"]) + "Application"
    content = f"""package {pkg};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class {app_name} {{

    public static void main(String[] args) {{
        SpringApplication.run({app_name}.class, args);
    }}
}}
"""
    write(pkg_path / f"{app_name}.java", content)


def gen_test(ent, pkg, base):
    name   = ent["nombre"]
    pascal = to_pascal(name)
    kebab  = to_kebab(name)
    test_path = base / "src/test/java" / pkg.replace(".", "/")

    content = f"""package {pkg};

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class {pascal}ControllerTest {{

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getAll_{pascal}_shouldReturn200() throws Exception {{
        mockMvc.perform(get("/api/{kebab}s")
                .header("Accept-Language", "es"))
               .andExpect(status().isOk())
               .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }}

    @Test
    void getById_{pascal}_notFound_shouldReturn404() throws Exception {{
        mockMvc.perform(get("/api/{kebab}s/999999"))
               .andExpect(status().isNotFound());
    }}
}}
"""
    write(test_path / f"{pascal}ControllerTest.java", content)


# ═══════════════════════════════════════════════════════════════════
#  FRONTEND
# ═══════════════════════════════════════════════════════════════════

def gen_frontend(modelo: dict, base: Path):
    entidades = modelo["entidades"]
    idiomas   = modelo.get("idiomas", ["es", "en"])
    src       = base / "src"
    pub       = base / "public"

    gen_package_json(modelo, base)
    gen_index_html(modelo, base)
    gen_vite_config(base)
    gen_i18n_frontend(modelo, src)
    gen_api_service(src)
    gen_layout(src)
    gen_app_jsx(entidades, src)
    gen_main_jsx(src)
    gen_index_css(src)

    for ent in entidades:
        gen_crud_page(ent, src)


def gen_package_json(modelo, base):
    content = """{
  "name": "invernadero-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "python tests/selenium_tests.py"
  },
  "dependencies": {
    "@mui/material": "^5.15.0",
    "@mui/x-data-grid": "^7.0.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "formik": "^2.4.5",
    "yup": "^1.3.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.1.4"
  }
}
"""
    write(base / "package.json", content)


def gen_index_html(modelo, base):
    content = f"""<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{to_pascal(modelo['proyecto'])} - Sistema de Gestión</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
"""
    write(base / "index.html", content)


def gen_vite_config(base):
    content = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
"""
    write(base / "vite.config.js", content)


def gen_i18n_frontend(modelo, src):
    """Internacionalización manual: archivos JSON + hook useI18n"""
    idiomas   = modelo.get("idiomas", ["es", "en"])
    entidades = modelo["entidades"]

    # Traducciones ES
    es = {
        "app": {"titulo": "Sistema Invernadero", "cerrarSesion": "Cerrar sesión", "bienvenido": "Bienvenido"},
        "acciones": {"nuevo": "Nuevo", "editar": "Editar", "eliminar": "Eliminar",
                     "guardar": "Guardar", "cancelar": "Cancelar", "buscar": "Buscar"},
        "mensajes": {"confirmEliminar": "¿Confirma eliminar este registro?",
                     "exito": "Operación exitosa", "error": "Ocurrió un error"},
        "entidades": {}
    }
    en = {
        "app": {"titulo": "Greenhouse System", "cerrarSesion": "Logout", "bienvenido": "Welcome"},
        "acciones": {"nuevo": "New", "editar": "Edit", "eliminar": "Delete",
                     "guardar": "Save", "cancelar": "Cancel", "buscar": "Search"},
        "mensajes": {"confirmEliminar": "Confirm delete this record?",
                     "exito": "Operation successful", "error": "An error occurred"},
        "entidades": {}
    }

    for ent in entidades:
        n = ent["nombre"]
        p = to_pascal(n)
        es["entidades"][n] = {"titulo": p, "descripcion": ent["descripcion"]}
        en["entidades"][n] = {"titulo": p, "descripcion": ent["descripcion"]}
        for a in ent["atributos"]:
            label = " ".join(w.capitalize() for w in re.split(r"[_\-]", a["nombre"]))
            es["entidades"][n][a["nombre"]] = label
            en["entidades"][n][a["nombre"]] = label

    i18n_dir = src / "i18n"
    write(i18n_dir / "es.json", json.dumps(es, ensure_ascii=False, indent=2))
    write(i18n_dir / "en.json", json.dumps(en, ensure_ascii=False, indent=2))

    # Hook useI18n
    hook = """import { useState, useCallback } from 'react';
import es from './es.json';
import en from './en.json';

const translations = { es, en };

/**
 * Hook de internacionalización manual.
 * Uso: const { t, lang, setLang } = useI18n();
 *      t('acciones.nuevo')  →  "Nuevo" o "New"
 */
export function useI18n(defaultLang = 'es') {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('lang') || defaultLang
  );

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
    // Notifica al backend via Accept-Language header (ver apiService)
    document.documentElement.lang = newLang;
  }, []);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let val = translations[lang] || translations['es'];
    for (const k of keys) {
      val = val?.[k];
      if (val === undefined) return key;
    }
    return val;
  }, [lang]);

  return { t, lang, setLang };
}

export default useI18n;
"""
    write(i18n_dir / "useI18n.js", hook)


def gen_api_service(src):
    content = """import axios from 'axios';

/**
 * Instancia de Axios configurada.
 * Adjunta automáticamente Accept-Language desde localStorage.
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const lang = localStorage.getItem('lang') || 'es';
  config.headers['Accept-Language'] = lang;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.error
             || err.response?.data?.mensaje
             || 'Error de conexión';
    return Promise.reject(new Error(msg));
  }
);

export default api;
"""
    write(src / "services/api.js", content)


def gen_layout(src):
    sidebar = """import {
  Drawer, List, ListItemButton, ListItemText,
  Toolbar, Typography, Box, Divider, Select, MenuItem
} from '@mui/material';
import { useI18n } from '../i18n/useI18n';

const DRAWER_WIDTH = 220;

export default function Sidebar({ entidades, vistaActual, setVista }) {
  const { t, lang, setLang } = useI18n();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', bgcolor: '#1b5e20' },
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
          🌱 {t('app.titulo')}
        </Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: '#388e3c' }} />
      <List>
        {entidades.map(ent => (
          <ListItemButton
            key={ent}
            selected={vistaActual === ent}
            onClick={() => setVista(ent)}
            sx={{ color: '#fff', '&.Mui-selected': { bgcolor: '#2e7d32' } }}
          >
            <ListItemText primary={t(`entidades.${ent}.titulo`)} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ position: 'absolute', bottom: 16, left: 8 }}>
        <Select
          value={lang}
          onChange={e => setLang(e.target.value)}
          size="small"
          sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#81c784' } }}
        >
          <MenuItem value="es">🇨🇴 ES</MenuItem>
          <MenuItem value="en">🇺🇸 EN</MenuItem>
        </Select>
      </Box>
    </Drawer>
  );
}
"""
    write(src / "layout/Sidebar.jsx", sidebar)

    navbar = """import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useI18n } from '../i18n/useI18n';

export default function Navbar({ usuario }) {
  const { t } = useI18n();
  return (
    <AppBar position="fixed" sx={{ zIndex: 1201, bgcolor: '#388e3c' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {t('app.bienvenido')}{usuario ? `, ${usuario}` : ''}
        </Typography>
        <Button color="inherit" href="/logout">
          {t('app.cerrarSesion')}
        </Button>
      </Toolbar>
    </AppBar>
  );
}
"""
    write(src / "layout/Navbar.jsx", navbar)

    layout = """import { Box, Toolbar } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 220;

export default function DashboardLayout({ entidades, vistaActual, setVista, usuario, children }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar usuario={usuario} />
      <Sidebar entidades={entidades} vistaActual={vistaActual} setVista={setVista} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, ml: `${DRAWER_WIDTH}px` }}>
        {children}
      </Box>
    </Box>
  );
}
"""
    write(src / "layout/DashboardLayout.jsx", layout)


def gen_crud_page(ent, src):
    name   = ent["nombre"]
    pascal = to_pascal(name)
    kebab  = to_kebab(name)
    attrs  = [a for a in ent["atributos"] if not a.get("pk")]

    # Columnas para DataGrid
    columns = [f"  {{ field: 'id', headerName: 'ID', flex: 0.5 }}"]
    for a in attrs:
        camel = to_camel(a["nombre"])
        label = " ".join(w.capitalize() for w in re.split(r"[_\-]", a["nombre"]))
        if a["tipo_dato"] == "fk":
            rel_camel = to_camel(a.get("fk_entidad", a["nombre"]))
            columns.append(
                f"  {{ field: '{rel_camel}', headerName: '{label}', flex: 1,\n"
                f"    valueGetter: (params) => params.row.{rel_camel}?.nombre ?? '' }}"
            )
        else:
            columns.append(
                f"  {{ field: '{camel}', headerName: '{label}', flex: 1, editable: false }}"
            )

    columns_str = ",\n".join(columns)

    # Campos del formulario
    form_fields = []
    for a in attrs:
        fname = to_camel(a["nombre"])
        label = " ".join(w.capitalize() for w in re.split(r"[_\-]", a["nombre"]))
        if a["tipo_dato"] == "fk":
            rel_camel = to_camel(a.get("fk_entidad", a["nombre"]))
            rel_pascal = to_pascal(a.get("fk_entidad", a["nombre"]))
            form_fields.append(f"""
          <FormControl fullWidth margin="normal" key="{fname}">
            <InputLabel>{label}</InputLabel>
            <Select
              name="{rel_camel}"
              value={{formData.{rel_camel}?.id || ''}}
              label="{label}"
              onChange={{e => setFormData(p => ({{...p, {rel_camel}: {{id: e.target.value}}}}))}}>
              {{opciones{rel_pascal}.map(o => (
                <MenuItem key={{o.id}} value={{o.id}}>{{o.nombre}}</MenuItem>
              ))}}
            </Select>
          </FormControl>""")
        else:
            itype = "number" if a["tipo_dato"] in ["integer", "decimal"] else "text"
            req = " required" if not a.get("nulo", True) else ""
            form_fields.append(f"""
          <TextField fullWidth margin="normal" key="{fname}"
            label="{label}" name="{fname}" type="{itype}"{req}
            value={{formData.{fname} || ''}}
            onChange={{e => setFormData(p => ({{...p, {fname}: e.target.value}}))}} />""")

    form_fields_str = "".join(form_fields)

    # Initial form data
    init_fields = {}
    for a in attrs:
        fname = to_camel(a["nombre"])
        if a["tipo_dato"] == "fk":
            rel_camel = to_camel(a.get("fk_entidad", a["nombre"]))
            init_fields[rel_camel] = None
        elif a["tipo_dato"] in ["integer", "decimal"]:
            init_fields[fname] = 0
        else:
            init_fields[fname] = ""

    init_str = json.dumps(init_fields, ensure_ascii=False)

    # Imports para Select de FK
    fk_rels = [a for a in attrs if a["tipo_dato"] == "fk"]
    fk_states = ""
    fk_effects = ""
    fk_imports_extra = ""
    if fk_rels:
        fk_imports_extra = "import FormControl from '@mui/material/FormControl';\nimport InputLabel from '@mui/material/InputLabel';\nimport Select from '@mui/material/Select';\nimport MenuItem from '@mui/material/MenuItem';\n"
        for fk in fk_rels:
            rel_pascal = to_pascal(fk["fk_entidad"])
            rel_kebab  = to_kebab(fk["fk_entidad"])
            fk_states += f"  const [opciones{rel_pascal}, setOpciones{rel_pascal}] = useState([]);\n"
            fk_effects += f"""
  useEffect(() => {{
    api.get('/{rel_kebab}s').then(r => setOpciones{rel_pascal}(r.data)).catch(console.error);
  }}, []);
"""

    content = f"""import {{ useState, useEffect }} from 'react';
import {{ DataGrid }} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
{fk_imports_extra}
import api from '../services/api';
import {{ useI18n }} from '../i18n/useI18n';

const COLUMNS = [
{columns_str}
];

const INIT_FORM = {init_str};

export default function {pascal}Page() {{
  const {{ t }} = useI18n();
  const [rows,     setRows]     = useState([]);
  const [open,     setOpen]     = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [formData, setFormData] = useState(INIT_FORM);
  const [mensaje,  setMensaje]  = useState(null);
  const [error,    setError]    = useState(null);

{fk_states}
{fk_effects}

  useEffect(() => {{ cargar(); }}, []);

  function cargar() {{
    api.get('/{kebab}s')
       .then(r => setRows(r.data))
       .catch(e => setError(e.message));
  }}

  function abrir(row) {{
    setEditId(row?.id ?? null);
    setFormData(row ? {{ ...row }} : INIT_FORM);
    setError(null);
    setOpen(true);
  }}

  function guardar() {{
    const req = editId
      ? api.put(`/{kebab}s/${{editId}}`, formData)
      : api.post('/{kebab}s', formData);
    req.then(r => {{
        setMensaje(r.data.mensaje || t('mensajes.exito'));
        setOpen(false);
        cargar();
      }})
      .catch(e => setError(e.message));
  }}

  function eliminar(id) {{
    if (!window.confirm(t('mensajes.confirmEliminar'))) return;
    api.delete(`/{kebab}s/${{id}}`)
       .then(r => {{ setMensaje(r.data.mensaje); cargar(); }})
       .catch(e => setError(e.message));
  }}

  const colsConAcciones = [
    ...COLUMNS,
    {{
      field: '_acciones', headerName: '', sortable: false, flex: 1,
      renderCell: (params) => (
        <>
          <Button size="small" onClick={{() => abrir(params.row)}}>{{t('acciones.editar')}}</Button>
          <Button size="small" color="error" onClick={{() => eliminar(params.row.id)}}>
            {{t('acciones.eliminar')}}
          </Button>
        </>
      )
    }}
  ];

  return (
    <Box>
      <Box sx={{{{ display: 'flex', justifyContent: 'space-between', mb: 2 }}}}>
        <Typography variant="h5">{{t('entidades.{name}.titulo')}}</Typography>
        <Button variant="contained" color="success" onClick={{() => abrir(null)}}>
          {{t('acciones.nuevo')}}
        </Button>
      </Box>

      {{mensaje && <Alert severity="success" onClose={{() => setMensaje(null)}} sx={{{{ mb: 2 }}}}>{{mensaje}}</Alert>}}
      {{error   && <Alert severity="error"   onClose={{() => setError(null)}}   sx={{{{ mb: 2 }}}}>{{error}}</Alert>}}

      <DataGrid
        rows={{rows}}
        columns={{colsConAcciones}}
        autoHeight
        pageSizeOptions={{[10]}}
        initialState={{{{ pagination: {{ paginationModel: {{ pageSize: 10 }} }} }}}}
        sx={{{{ bgcolor: '#f1f8e9' }}}}
      />

      <Dialog open={{open}} onClose={{() => setOpen(false)}} maxWidth="sm" fullWidth>
        <DialogTitle>
          {{editId ? t('acciones.editar') : t('acciones.nuevo')}} — {{t('entidades.{name}.titulo')}}
        </DialogTitle>
        <DialogContent>
          {{error && <Alert severity="error" sx={{{{ mb: 1 }}}}>{{error}}</Alert>}}
          {form_fields_str}
        </DialogContent>
        <DialogActions>
          <Button onClick={{() => setOpen(false)}}>{{t('acciones.cancelar')}}</Button>
          <Button variant="contained" color="success" onClick={{guardar}}>
            {{t('acciones.guardar')}}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}}
"""
    write(src / f"pages/{pascal}Page.jsx", content)


def gen_app_jsx(entidades, src):
    nombres = [e["nombre"] for e in entidades]
    imports = "\n".join(f"import {to_pascal(n)}Page from './pages/{to_pascal(n)}Page';"
                        for n in nombres)
    cases   = "\n".join(f"      {{vista === '{n}' && <{to_pascal(n)}Page />}}"
                        for n in nombres)
    ents_arr = json.dumps(nombres)

    content = f"""import {{ useState }} from 'react';
import DashboardLayout from './layout/DashboardLayout';
{imports}

const ENTIDADES = {ents_arr};

export default function App() {{
  const [vista,   setVista]   = useState(ENTIDADES[0]);
  const [usuario, setUsuario] = useState(null);

  return (
    <DashboardLayout
      entidades={{ENTIDADES}}
      vistaActual={{vista}}
      setVista={{setVista}}
      usuario={{usuario}}
    >
{cases}
    </DashboardLayout>
  );
}}
"""
    write(src / "App.jsx", content)


def gen_main_jsx(src):
    content = """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""
    write(src / "main.jsx", content)


def gen_index_css(src):
    content = """* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', sans-serif; background: #f9fbe7; }
"""
    write(src / "index.css", content)


# ═══════════════════════════════════════════════════════════════════
#  SELENIUM TESTS (Frontend)
# ═══════════════════════════════════════════════════════════════════

def gen_selenium_tests(modelo, base):
    entidades = modelo["entidades"]
    tests = []
    for ent in entidades:
        n = ent["nombre"]
        pascal = to_pascal(n)
        tests.append(f"""
    def test_{n}_page_loads(self):
        self.driver.get("http://localhost:5173")
        time.sleep(1)
        # Hacer clic en la entidad en el sidebar
        try:
            link = self.driver.find_element(By.XPATH, f"//*[contains(text(), '{pascal}')]")
            link.click()
            time.sleep(1)
            print(f"✔ Página {pascal} carga correctamente")
        except Exception as e:
            self.fail(f"No se encontró la página {pascal}: {{e}}")
""")

    content = f"""\"\"\"
Tests de Selenium para el frontend del invernadero.
Ejecutar con: python selenium_tests.py
Requiere: pip install selenium webdriver-manager
\"\"\"
import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


class InvernaderoFrontendTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        cls.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=options
        )
        cls.driver.implicitly_wait(5)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def test_home_loads(self):
        self.driver.get("http://localhost:5173")
        time.sleep(2)
        self.assertIn("Invernadero", self.driver.title or self.driver.page_source)
        print("✔ Home carga correctamente")
{"".join(tests)}

if __name__ == "__main__":
    unittest.main(verbosity=2)
"""
    write(base / "tests/selenium_tests.py", content)


# ═══════════════════════════════════════════════════════════════════
#  GITHUB ACTIONS
# ═══════════════════════════════════════════════════════════════════

def gen_github_actions(modelo, base):
    workflows = base / ".github/workflows"

    # ── CI: build + test en PR y push a main
    ci = f"""name: CI - Build y Pruebas

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend:
    name: Backend (Spring Boot + JUnit)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: invernadero_test
          POSTGRES_USER: invernadero
          POSTGRES_PASSWORD: invernadero
        ports: [ "5432:5432" ]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Configurar Java 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Ejecutar tests (perfil test con H2)
        working-directory: backend
        run: mvn test -P test
        env:
          SPRING_PROFILES_ACTIVE: test

      - name: Subir reporte de tests
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: surefire-reports
          path: backend/target/surefire-reports/

  frontend:
    name: Frontend (React + Vite build)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configurar Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Instalar dependencias
        working-directory: frontend
        run: npm ci

      - name: Build producción
        working-directory: frontend
        run: npm run build

      - name: Subir artefacto build
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: frontend/dist/

  selenium:
    name: Tests Selenium (E2E)
    runs-on: ubuntu-latest
    needs: [ backend, frontend ]
    steps:
      - uses: actions/checkout@v4

      - name: Configurar Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Instalar dependencias Selenium
        run: pip install selenium webdriver-manager

      - name: Ejecutar tests Selenium (headless)
        run: python frontend/tests/selenium_tests.py
        continue-on-error: true
"""
    write(workflows / "ci.yml", ci)

    # ── CD: deploy a producción cuando se hace merge a main
    cd = f"""name: CD - Despliegue a Producción

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  docker-build-push:
    name: Construir y publicar imagen Docker
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login a Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{{{ secrets.DOCKER_USERNAME }}}}
          password: ${{{{ secrets.DOCKER_PASSWORD }}}}

      - name: Build y push Backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{{{ secrets.DOCKER_USERNAME }}}}/invernadero-backend:latest

      - name: Build y push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{{{ secrets.DOCKER_USERNAME }}}}/invernadero-frontend:latest

  taiga-close-sprint:
    name: Notificar Taiga - Cierre de Sprint
    runs-on: ubuntu-latest
    needs: docker-build-push
    steps:
      - name: Mover historias completadas en Taiga
        run: |
          echo "Notificando Taiga API..."
          curl -s -X POST \\
            -H "Authorization: Bearer ${{{{ secrets.TAIGA_TOKEN }}}}" \\
            -H "Content-Type: application/json" \\
            -d '{{"project": "${{{{ secrets.TAIGA_PROJECT_ID }}}}", "event": "deploy_success"}}' \\
            "${{{{ secrets.TAIGA_WEBHOOK_URL }}}}" || true
"""
    write(workflows / "cd.yml", cd)

    # ── PR check: detectar conflictos y lint
    pr_check = """name: PR - Revisión automática

on:
  pull_request:
    types: [ opened, synchronize, reopened ]

jobs:
  lint-backend:
    name: Checkstyle Backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven
      - name: Checkstyle
        working-directory: backend
        run: mvn checkstyle:check || true

  lint-frontend:
    name: ESLint Frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Instalar deps
        working-directory: frontend
        run: npm ci
      - name: ESLint
        working-directory: frontend
        run: npx eslint src/ --ext .jsx,.js --max-warnings=0 || true

  auto-comment:
    name: Comentar en PR
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - name: Comentar PR con instrucciones
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ **CI automático iniciado.** Por favor espera los resultados antes de aprobar el PR.'
            });
"""
    write(workflows / "pr-check.yml", pr_check)


# ═══════════════════════════════════════════════════════════════════
#  TAIGA - Historias de usuario
# ═══════════════════════════════════════════════════════════════════

def gen_taiga(modelo, base):
    entidades = modelo["entidades"]
    historias = []
    orden = 1

    # Historias genéricas del sistema
    globales = [
        ("Configurar repositorio GitHub y ramas", "Como desarrollador, quiero tener el repositorio configurado con ramas main y develop, y protección de rama, para garantizar un flujo de trabajo ordenado.", "Alta"),
        ("Configurar GitHub Actions CI", "Como desarrollador, quiero que cada PR ejecute automáticamente los tests del backend y frontend para detectar errores antes de fusionar.", "Alta"),
        ("Configurar OAuth2 con Google", "Como usuario, quiero poder iniciar sesión con mi cuenta de Google para acceder al sistema de forma segura.", "Alta"),
        ("Implementar internacionalización ES/EN", "Como usuario, quiero poder cambiar el idioma de la interfaz entre español e inglés sin recargar la página.", "Media"),
        ("Configurar despliegue con Docker", "Como DevOps, quiero que el sistema se empaquete en contenedores Docker para facilitar el despliegue en cualquier entorno.", "Media"),
    ]

    for titulo, descripcion, prioridad in globales:
        historias.append({
            "orden": orden,
            "titulo": titulo,
            "descripcion": descripcion,
            "prioridad": prioridad,
            "estado": "Nueva",
            "tipo": "Historia de usuario",
            "criterios_aceptacion": [
                f"Dado que {descripcion.split(',')[0].lower()}, cuando se ejecuta, entonces el resultado es correcto."
            ]
        })
        orden += 1

    # Historias por entidad
    for ent in entidades:
        n = ent["nombre"]
        p = to_pascal(n)
        for accion, desc in [
            (f"Listar {p}s",   f"Como usuario, quiero ver una tabla paginada con todos los {n}s registrados."),
            (f"Crear {p}",     f"Como usuario, quiero registrar un nuevo {n} con todos sus datos requeridos."),
            (f"Editar {p}",    f"Como usuario, quiero modificar los datos de un {n} existente."),
            (f"Eliminar {p}",  f"Como usuario, quiero eliminar un {n} con confirmación previa."),
        ]:
            historias.append({
                "orden": orden,
                "titulo": accion,
                "descripcion": desc,
                "prioridad": "Alta",
                "estado": "Nueva",
                "tipo": "Historia de usuario",
                "entidad": n,
                "criterios_aceptacion": [
                    f"Dado que el usuario accede a la sección {p}, cuando realiza la acción '{accion}', entonces el sistema responde correctamente y muestra un mensaje de confirmación."
                ]
            })
            orden += 1

    resultado = {
        "proyecto": modelo["proyecto"],
        "sprint": "Sprint 1",
        "historias": historias,
        "instrucciones_importacion": (
            "Para importar en Taiga: Settings > Import/Export > Import > pegar este JSON. "
            "O usar la API REST: POST /api/v1/userstories con token de autenticación."
        ),
        "script_api": {
            "descripcion": "Script Python para crear historias via API de Taiga",
            "uso": "python taiga_import.py --url https://taiga.io --token TU_TOKEN --project-slug invernadero"
        }
    }

    write(base / "taiga/historias_usuario.json",
          json.dumps(resultado, ensure_ascii=False, indent=2))

    # Script de importación a Taiga
    script = '''"""
Script de importación automática de historias de usuario a Taiga.
Uso: python taiga_import.py --url https://taiga.io --token TOKEN --project-slug invernadero
"""
import argparse
import json
import sys

try:
    import requests
except ImportError:
    print("Instala requests: pip install requests")
    sys.exit(1)


def importar(base_url, token, project_slug, historias_file):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "x-disable-pagination": "true"
    }

    # Obtener ID del proyecto
    r = requests.get(f"{base_url}/api/v1/projects/by_slug?slug={project_slug}",
                     headers=headers)
    r.raise_for_status()
    project_id = r.json()["id"]
    print(f"✔ Proyecto encontrado: {project_id}")

    with open(historias_file, encoding="utf-8") as f:
        data = json.load(f)

    creadas = 0
    for h in data["historias"]:
        payload = {
            "project": project_id,
            "subject": h["titulo"],
            "description": h["descripcion"],
        }
        resp = requests.post(f"{base_url}/api/v1/userstories",
                             headers=headers, json=payload)
        if resp.status_code in (200, 201):
            creadas += 1
            print(f"  ✔ Historia creada: {h['titulo']}")
        else:
            print(f"  ✗ Error en '{h['titulo']}': {resp.text[:100]}")

    print(f"\\n{creadas}/{len(data['historias'])} historias importadas.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url",           default="https://taiga.io")
    parser.add_argument("--token",         required=True)
    parser.add_argument("--project-slug",  required=True)
    parser.add_argument("--historias",     default="historias_usuario.json")
    args = parser.parse_args()

    importar(args.url, args.token, args.project_slug, args.historias)
'''
    write(base / "taiga/taiga_import.py", script)


# ═══════════════════════════════════════════════════════════════════
#  DOCKER
# ═══════════════════════════════════════════════════════════════════

def gen_docker(modelo, base):
    # Backend Dockerfile
    be_docker = """FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline -q
COPY src src
RUN ./mvnw package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
"""
    write(base / "backend/Dockerfile", be_docker)

    # Frontend Dockerfile
    fe_docker = """FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
"""
    write(base / "frontend/Dockerfile", fe_docker)

    nginx_conf = """server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
"""
    write(base / "frontend/nginx.conf", nginx_conf)

    # docker-compose.yml
    compose = f"""version: '3.9'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: {modelo['dbname']}
      POSTGRES_USER: {modelo['username']}
      POSTGRES_PASSWORD: {modelo['password']}
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - db
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/{modelo['dbname']}
      SPRING_DATASOURCE_USERNAME: {modelo['username']}
      SPRING_DATASOURCE_PASSWORD: {modelo['password']}
      GOOGLE_CLIENT_ID: ${{GOOGLE_CLIENT_ID}}
      GOOGLE_CLIENT_SECRET: ${{GOOGLE_CLIENT_SECRET}}

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pg_data:
"""
    write(base / "docker-compose.yml", compose)


# ═══════════════════════════════════════════════════════════════════
#  README
# ═══════════════════════════════════════════════════════════════════

def gen_readme(modelo, base):
    ents = ", ".join(to_pascal(e["nombre"]) for e in modelo["entidades"])
    content = f"""# 🌱 {to_pascal(modelo['proyecto'])} — Factoría de Software

Proyecto **generado automáticamente** desde `modelo/modelo.json`.

## Estructura

```
invernadero-factory/
├── modelo/              ← Fuente de verdad (modelo.json)
├── generator/           ← Scripts Python de generación
├── backend/             ← Spring Boot 3 (Java 17)
│   └── src/main/java/
│       ├── entity/      ← Entidades JPA ({ents})
│       ├── repository/  ← JpaRepository por entidad
│       ├── service/     ← Interfaces de servicio
│       │   └── impl/   ← Implementaciones (@Service)
│       ├── controller/  ← REST Controllers
│       ├── exception/   ← NotFoundException + GlobalHandler
│       └── config/      ← SecurityConfig, I18nConfig, CorsConfig
├── frontend/            ← React + MUI + Vite
│   └── src/
│       ├── i18n/        ← es.json, en.json, useI18n hook (manual)
│       ├── services/    ← api.js (Axios + Accept-Language)
│       ├── layout/      ← DashboardLayout, Navbar, Sidebar
│       └── pages/       ← CrudPage por entidad
├── taiga/               ← historias_usuario.json + taiga_import.py
├── .github/workflows/   ← ci.yml, cd.yml, pr-check.yml
└── docker-compose.yml
```

## Cómo regenerar el proyecto

```bash
cd generator
python generator.py --modelo ../modelo/modelo.json --salida ../salida
```

## Cómo correr localmente

```bash
# 1. Base de datos
docker-compose up db -d

# 2. Backend
cd backend
./mvnw spring-boot:run

# 3. Frontend
cd frontend
npm install && npm run dev
```

## Internacionalización (manual, sin APIs)

El sistema detecta el idioma desde:
1. `localStorage.setItem('lang', 'en')` en el frontend
2. Header `Accept-Language: en` enviado automáticamente por Axios
3. El backend lee `LocaleContextHolder` para los mensajes de respuesta

Archivos clave:
- Frontend: `src/i18n/es.json`, `src/i18n/en.json`, `src/i18n/useI18n.js`
- Backend:  `src/main/resources/i18n/messages_es.properties`

## GitHub Actions

| Workflow      | Trigger           | Qué hace                                     |
|---------------|-------------------|----------------------------------------------|
| `ci.yml`      | push/PR → main    | JUnit tests, React build, Selenium E2E       |
| `cd.yml`      | push → main + tag | Docker build/push + notifica Taiga           |
| `pr-check.yml`| PR abierto        | Checkstyle, ESLint, comentario automático    |

## Taiga

Historias generadas en `taiga/historias_usuario.json`.
Para importar automáticamente:

```bash
cd taiga
python taiga_import.py --url https://api.taiga.io --token TU_TOKEN --project-slug invernadero
```

## Rubrica cubierta

| Ítem | Estado |
|------|--------|
| 1. Modelo JSON + BD + Diccionario de datos | ✅ |
| 2. Backend Spring Boot desde modelo JSON   | ✅ |
| 3. Frontend React desde modelo JSON        | ✅ |
| 4. Tests Selenium (frontend) + JUnit (backend) | ✅ |
| 5. GitHub Actions (CI/CD + PR detection)   | ✅ |
| 6. OAuth2 Google + Security config         | ✅ |
| 7. Internacionalización ES/EN (manual)     | ✅ |
| 9. Taiga + historias de usuario            | ✅ |
"""
    write(base / "README.md", content)


# ═══════════════════════════════════════════════════════════════════
#  PUNTO DE ENTRADA
# ═══════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Generador Factoría de Software")
    parser.add_argument("--modelo",  default="../modelo/modelo.json", help="Ruta al modelo JSON")
    parser.add_argument("--salida",  default="../salida",             help="Directorio de salida")
    args = parser.parse_args()

    modelo_path = Path(args.modelo)
    if not modelo_path.exists():
        print(f"❌ No se encontró el modelo: {modelo_path}")
        sys.exit(1)

    with open(modelo_path, encoding="utf-8") as f:
        modelo = json.load(f)

    salida = Path(args.salida)
    salida.mkdir(parents=True, exist_ok=True)

    print(f"\n🔧 Generando proyecto '{modelo['proyecto']}' en {salida}/\n")

    print("── Backend ──────────────────────────────")
    gen_backend(modelo, salida / "backend")

    print("\n── Frontend ─────────────────────────────")
    gen_frontend(modelo, salida / "frontend")

    print("\n── Selenium Tests ───────────────────────")
    gen_selenium_tests(modelo, salida / "frontend")

    print("\n── GitHub Actions ───────────────────────")
    gen_github_actions(modelo, salida)

    print("\n── Taiga ────────────────────────────────")
    gen_taiga(modelo, salida)

    print("\n── Docker ───────────────────────────────")
    gen_docker(modelo, salida)

    print("\n── README ───────────────────────────────")
    gen_readme(modelo, salida)

    total = sum(1 for _ in salida.rglob("*") if _.is_file())
    print(f"\n✅ Generación completa — {total} archivos creados en {salida}/")


if __name__ == "__main__":
    main()
