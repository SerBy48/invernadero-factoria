package com.usco.invernadero;

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
public class ProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getAll_Producto_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/productos")
                .header("Accept-Language", "es"))
               .andExpect(status().isOk())
               .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    void getById_Producto_notFound_shouldReturn404() throws Exception {
        mockMvc.perform(get("/api/productos/999999"))
               .andExpect(status().isNotFound());
    }
}
