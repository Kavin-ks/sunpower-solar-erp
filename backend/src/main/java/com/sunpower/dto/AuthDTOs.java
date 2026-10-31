package com.sunpower.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class AuthDTOs {

    public static class LoginRequest {
        @NotBlank(message = "Username cannot be empty")
        private String username;

        @NotBlank(message = "Password cannot be empty")
        private String password;

        public LoginRequest() {}

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        @NotBlank(message = "Username cannot be empty")
        private String username;

        @NotBlank(message = "Password cannot be empty")
        private String password;

        @NotBlank(message = "Full name cannot be empty")
        private String fullName;

        private String email;
        private String phone;
        private String role; // e.g. "ROLE_SALES", "ROLE_ADMIN"

        public RegisterRequest() {}

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class JwtResponse {
        private String token;
        private String type = "Bearer";
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private List<String> roles;

        public JwtResponse(String token, Long id, String username, String fullName, String email, List<String> roles) {
            this.token = token;
            this.id = id;
            this.username = username;
            this.fullName = fullName;
            this.email = email;
            this.roles = roles;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public List<String> getRoles() { return roles; }
        public void setRoles(List<String> roles) { this.roles = roles; }
    }
}
