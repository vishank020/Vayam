package com.community.auth;

import java.security.Principal;

public record AuthPrincipal(String userId, String username, String role) implements Principal {
    @Override
    public String getName() {
        return username;
    }
}
