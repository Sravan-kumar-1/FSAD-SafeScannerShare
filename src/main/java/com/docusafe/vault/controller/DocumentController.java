package com.docusafe.vault.controller;

import com.docusafe.vault.model.Document;
import com.docusafe.vault.model.User;
import com.docusafe.vault.repository.UserRepository;
import com.docusafe.vault.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.docusafe.vault.repository.DocumentRepository documentRepository;

    @Autowired
    private com.docusafe.vault.service.AuditService auditService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file, Authentication authentication,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body("User is not authenticated");
            }

            // Get current user email from Authentication
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();

            // Find User entity
            User owner = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Store file and get Document metadata
            Document savedDocument = fileStorageService.storeFile(file, owner);

            auditService.logAction("UPLOAD", savedDocument.getId(), owner.getEmail(), request.getRemoteAddr());

            return ResponseEntity.ok(savedDocument);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Could not upload file: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllDocuments(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User owner = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return ResponseEntity.ok(documentRepository.findByOwner(owner));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Could not retrieve documents: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/stream")
    public ResponseEntity<org.springframework.core.io.Resource> streamDocument(@PathVariable("id") Long id,
            Authentication authentication) {
        try {
            Document document = documentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User currentUser = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Security Check
            if (!document.getOwner().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }

            org.springframework.core.io.Resource resource = fileStorageService
                    .loadFileAsResource(document.getFilePath());

            String contentType = document.getContentType();
            if (contentType == null) {
                contentType = "application/octet-stream";
                try {
                    contentType = java.nio.file.Files.probeContentType(resource.getFile().toPath());
                } catch (Exception x) {
                    System.out.println("Could not probe native ContentType for binary stream fallbacks.");
                }
            }

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + document.getFileName() + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/raw/{id}")
    public ResponseEntity<byte[]> getRawDocument(@PathVariable("id") Long id,
            Authentication authentication) {
        try {
            Document document = documentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User currentUser = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Security Check
            if (!document.getOwner().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }

            java.nio.file.Path filePath = java.nio.file.Paths.get(document.getFilePath());
            byte[] fileBytes = java.nio.file.Files.readAllBytes(filePath);

            String contentType = document.getContentType();
            if (contentType == null) {
                contentType = "application/octet-stream";
                try {
                    contentType = java.nio.file.Files.probeContentType(filePath);
                } catch (Exception x) {
                    System.out.println("Could not probe native ContentType for raw binary fallback.");
                }
            }

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + document.getFileName() + "\"")
                    .body(fileBytes);

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/metadata")
    public ResponseEntity<java.util.Map<String, Object>> getDocumentMetadata(@PathVariable("id") Long id,
            Authentication authentication) {
        try {
            Document document = documentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User currentUser = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Security Check
            if (!document.getOwner().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }

            java.util.Map<String, Object> metadata = new java.util.HashMap<>();
            metadata.put("documentName", document.getFileName());
            metadata.put("contentType", document.getContentType());

            // Native Views do not expire
            metadata.put("expiresAt", null);

            return ResponseEntity.ok(metadata);

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
