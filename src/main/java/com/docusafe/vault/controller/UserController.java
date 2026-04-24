package com.docusafe.vault.controller;

import com.docusafe.vault.model.User;
import com.docusafe.vault.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173",
        "http://127.0.0.1:5174" })
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(@RequestParam("email") String email) {
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        List<User> users = userRepository.findTop5ByEmailContainingIgnoreCase(email.trim());
        List<Map<String, Object>> response = new ArrayList<>();

        for (User user : users) {
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            response.add(userData);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/hash")
    public String getHash() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("password123");
    }

    @GetMapping("/checkhash")
    public String checkHash() {
        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        String rawPassword = "password123";
        String encodedFromDb = "$2a$10$Y8D9B6h2V.5vL6sH6rM2gOPy4Q8bN0f4dE/B3aK3k/pX6eC3W5w.C"; // What is currently in
                                                                                               // the DB
        boolean matches = encoder.matches(rawPassword, encodedFromDb);
        return "Raw: " + rawPassword + " | DB Hash: " + encodedFromDb + " | Matches: " + matches;
    }
}
