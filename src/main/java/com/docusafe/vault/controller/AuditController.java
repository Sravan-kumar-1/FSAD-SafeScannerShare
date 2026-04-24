package com.docusafe.vault.controller;

import com.docusafe.vault.model.AuditLog;
import com.docusafe.vault.model.Document;
import com.docusafe.vault.model.User;
import com.docusafe.vault.repository.AuditLogRepository;
import com.docusafe.vault.repository.DocumentRepository;
import com.docusafe.vault.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class AuditController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}/audit-logs")
    public ResponseEntity<?> getAuditLogs(@PathVariable("id") Long id, Authentication authentication) {
        try {
            Document document = documentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User currentUser = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Verify ownership
            if (!document.getOwner().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body("Only the owner can view audit logs.");
            }

            List<AuditLog> logs = auditLogRepository.findByDocumentIdOrderByTimestampDesc(document.getId());

            return ResponseEntity.ok(logs);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Could not retrieve audit logs: " + e.getMessage());
        }
    }
}
