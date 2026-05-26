package com.usco.invernadero;

import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @BeforeEach
    void setUpUser() {
        usuarioRepository.findByEmail("test@example.com").orElseGet(() -> {
            Usuario usuario = new Usuario();
            usuario.setNombre("Usuario Test");
            usuario.setEmail("test@example.com");
            usuario.setPassword("test");
            usuario.setProveedor("local");
            return usuarioRepository.save(usuario);
        });
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = "USER")
    void getAll_Producto_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/productos")
                .header("Accept-Language", "es"))
               .andExpect(status().isOk())
               .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    @WithMockUser(username = "test@example.com", roles = "USER")
    void getById_Producto_notFound_shouldReturn404() throws Exception {
        mockMvc.perform(get("/api/productos/999999"))
               .andExpect(status().isNotFound());
    }
}
