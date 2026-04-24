package com.docusafe.vault.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String email;
    private String password;
    private String publicKey;
}
