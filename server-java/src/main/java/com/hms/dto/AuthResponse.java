package com.hms.dto;

public class AuthResponse {

    private String token;
    private PublicUser user;

    public AuthResponse() {}

    public AuthResponse(String token, PublicUser user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public PublicUser getUser() { return user; }
    public void setUser(PublicUser user) { this.user = user; }
}
