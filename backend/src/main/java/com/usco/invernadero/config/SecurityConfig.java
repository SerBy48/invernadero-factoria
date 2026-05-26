package com.usco.invernadero.config;

import com.usco.invernadero.entity.Usuario;
import com.usco.invernadero.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UsuarioRepository usuarioRepository;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final AuditLogoutHandler auditLogoutHandler;

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String corsAllowedOrigins;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public SecurityConfig(UsuarioRepository usuarioRepository,
                          OAuth2SuccessHandler oAuth2SuccessHandler,
                          AuditLogoutHandler auditLogoutHandler) {
        this.usuarioRepository    = usuarioRepository;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.auditLogoutHandler   = auditLogoutHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> usuarioRepository.findByEmail(email)
            .filter(u -> u.getPassword() != null)
            .map(u -> User.builder()
                .username(u.getEmail())
                .password(u.getPassword())
                .roles(u.getRol() != null ? u.getRol() : "USER")
                .disabled(!u.isActivo())
                .build())
            .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + email));
    }

    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService() {
        DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
        return request -> {
            OAuth2User oAuth2User = delegate.loadUser(request);
            String email = oAuth2User.getAttribute("email");
            Optional<Usuario> dbUser = usuarioRepository.findByEmail(email);
            if (dbUser.isPresent() && !dbUser.get().isActivo()) {
                throw new OAuth2AuthenticationException(
                    new OAuth2Error("account_disabled", "cuenta_inhabilitada", null));
            }
            String rol = dbUser.map(u -> u.getRol() != null ? u.getRol() : "USER").orElse("USER");
            return new DefaultOAuth2User(
                Set.of(new SimpleGrantedAuthority("ROLE_" + rol)),
                oAuth2User.getAttributes(),
                "email");
        };
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authenticationProvider(authenticationProvider())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/public/**", "/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/registro").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"autenticado\":false}");
                })
                .accessDeniedHandler((request, response, denied) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"acceso_denegado\"}");
                })
            )
            .oauth2Login(oauth -> oauth
                .userInfoEndpoint(u -> u.userService(customOAuth2UserService()))
                .successHandler(oAuth2SuccessHandler)
                .failureUrl(frontendUrl + "?error=inhabilitado")
            )
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout"))
                .addLogoutHandler(auditLogoutHandler)
                .logoutSuccessUrl(frontendUrl)
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(corsAllowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
