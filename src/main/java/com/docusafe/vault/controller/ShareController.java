package com.docusafe.vault.controller;

import com.docusafe.vault.model.Document;
import com.docusafe.vault.model.User;
import com.docusafe.vault.model.ViewerSession;
import com.docusafe.vault.repository.DocumentRepository;
import com.docusafe.vault.repository.UserRepository;
import com.docusafe.vault.repository.ViewerSessionRepository;
import com.docusafe.vault.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfStamper;
import com.lowagie.text.pdf.BaseFont;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
public class ShareController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ViewerSessionRepository viewerSessionRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private com.docusafe.vault.service.AuditService auditService;

    @PostMapping("/api/documents/{id}/share")
    public ResponseEntity<?> shareDocument(@PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, Object> payload,
            Authentication authentication,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            Document document = documentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Document not found"));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User currentUser = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Verify ownership
            if (!document.getOwner().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body("Only the owner can share this document.");
            }

            // Default to 10.0 minutes if no payload is provided
            double durationInMinutes = 10.0;
            if (payload != null && payload.containsKey("durationInMinutes")) {
                Number durationNum = (Number) payload.getOrDefault("durationInMinutes", 10.0);
                durationInMinutes = durationNum.doubleValue();
            }

            // Convert Double minutes to total seconds for high precision
            long durationSeconds = (long) (durationInMinutes * 60);

            // Handle Optional Targeted Sharing
            Long targetUserId = null;
            if (payload != null && payload.containsKey("targetUserId") && payload.get("targetUserId") != null) {
                Object targetIdObj = payload.get("targetUserId");
                if (targetIdObj instanceof Number) {
                    targetUserId = ((Number) targetIdObj).longValue();
                } else if (targetIdObj instanceof String) {
                    targetUserId = Long.parseLong((String) targetIdObj);
                }
            }

            // Handle One-Time View (Self-Destruct) setting
            boolean oneTimeView = false;
            if (payload != null && payload.containsKey("oneTimeView") && payload.get("oneTimeView") != null) {
                oneTimeView = (Boolean) payload.get("oneTimeView");
            }

            // Handle Custom Watermark Text setting
            String watermarkText = null;
            if (payload != null && payload.containsKey("watermarkText") && payload.get("watermarkText") != null) {
                watermarkText = (String) payload.get("watermarkText");
                if (watermarkText.trim().isEmpty()) {
                    watermarkText = null;
                }
            }

            Float watermarkOpacity = 15f;
            Integer watermarkSize = 14;
            Integer watermarkDensity = 100;

            if (payload != null) {
                if (payload.containsKey("watermarkOpacity") && payload.get("watermarkOpacity") != null) {
                    watermarkOpacity = ((Number) payload.get("watermarkOpacity")).floatValue();
                }
                if (payload.containsKey("watermarkSize") && payload.get("watermarkSize") != null) {
                    watermarkSize = ((Number) payload.get("watermarkSize")).intValue();
                }
                if (payload.containsKey("watermarkDensity") && payload.get("watermarkDensity") != null) {
                    watermarkDensity = ((Number) payload.get("watermarkDensity")).intValue();
                }
            }

            // Generate Viewer Session (Valid for requested duration in exact seconds)
            ViewerSession session = ViewerSession.builder()
                    .document(document)
                    .shareToken(UUID.randomUUID().toString())
                    .expiresAt(LocalDateTime.now().plusSeconds(durationSeconds))
                    .targetUserId(targetUserId)
                    .build();

            // Explicitly set the One-Time View boolean (Prevents Lombok Default nulling)
            session.setOneTimeView(oneTimeView);
            session.setWatermarkText(watermarkText);
            session.setWatermarkOpacity(watermarkOpacity);
            session.setWatermarkSize(watermarkSize);
            session.setWatermarkDensity(watermarkDensity);

            viewerSessionRepository.save(session);

            auditService.logAction("SHARE", document.getId(), currentUser.getEmail(), request.getRemoteAddr());

            Map<String, Object> response = new HashMap<>();
            response.put("shareToken", session.getShareToken());
            response.put("expiresAt", session.getExpiresAt());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error sharing document: " + e.getMessage());
        }
    }

    @GetMapping("/api/share/{token}/stream")
    public ResponseEntity<org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody> streamSharedDocument(
            @PathVariable("token") String token,
            Authentication authentication,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            ViewerSession session = viewerSessionRepository.findByShareToken(token)
                    .orElseThrow(() -> new RuntimeException("Invalid share token"));

            // Check expiration
            if (LocalDateTime.now().isAfter(session.getExpiresAt())) {
                // Return 410 Gone if the link has expired
                return ResponseEntity.status(org.springframework.http.HttpStatus.GONE).build();
            }

            Document document = session.getDocument();
            boolean isOwner = false;

            try {
                if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
                    UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                    User currentUser = userRepository.findByEmail(userDetails.getUsername()).orElse(null);

                    if (currentUser != null && document.getOwner().getId().equals(currentUser.getId())) {
                        isOwner = true;
                    }
                }
            } catch (Exception e) {
                // Ignore, anonymous access
            }

            // Enforce One-Time View Consumptive Logic (Skip if Owner)
            if (!isOwner && session.isOneTimeView() && session.isConsumed()) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.GONE).build();
            }

            // Enforce Targeted Sharing Access Check (Skip if Owner)
            if (!isOwner && session.getTargetUserId() != null) {
                // This block executes if the link was generated for a specific user
                try {
                    if (authentication == null) {
                        return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
                    }
                    UserDetails userDetails = (UserDetails) authentication.getPrincipal(); // throws exception if
                                                                                           // anonymous
                    User currentUser = userRepository.findByEmail(userDetails.getUsername())
                            .orElseThrow(() -> new RuntimeException("Current user not found"));

                    boolean isIdMatch = session.getTargetUserId().equals(currentUser.getId());

                    // Temporary Bypass: Allow access if emails match as a secondary check
                    boolean isEmailMatch = false;
                    User targetUser = userRepository.findById(session.getTargetUserId()).orElse(null);
                    if (targetUser != null && currentUser.getEmail().equals(targetUser.getEmail())) {
                        isEmailMatch = true;
                    }

                    if (!isIdMatch && !isEmailMatch) {
                        return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                                .body(null);
                    }
                } catch (Exception e) {
                    // Anonymous users cannot access targeted links
                    return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                            .body(null);
                }
            }

            org.springframework.core.io.Resource resource = fileStorageService
                    .loadFileAsResource(document.getFilePath());

            String viewerEmail = null;
            Long viewerId = null;
            String logUsername = "Anonymous";

            try {
                if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
                    UserDetails viewerDetails = (UserDetails) authentication.getPrincipal();
                    User viewerUser = userRepository.findByEmail(viewerDetails.getUsername()).orElse(null);
                    if (viewerUser != null) {
                        viewerEmail = viewerUser.getEmail();
                        viewerId = viewerUser.getId();
                        logUsername = viewerUser.getEmail();
                    }
                }
            } catch (Exception e) {
                // Ignore, means anonymous access
            }

            String ipAddress = request.getRemoteAddr();
            if ("0:0:0:0:0:0:1".equals(ipAddress)) {
                ipAddress = "127.0.0.1";
            }

            auditService.logAction("VIEW", document.getId(), logUsername, ipAddress, viewerEmail, viewerId);

            // Flag as consumed to block parallel React fetches immediately (Skip if Owner)
            if (!isOwner && session.isOneTimeView()) {
                session.setConsumed(true);
                viewerSessionRepository.save(session);
            }

            // Increment explicit View Analytics Counter
            if (!isOwner) {
                document.setViewCount(document.getViewCount() + 1);
                documentRepository.save(document);
            }

            // Check for Custom Watermark (Ensures MIME compatibility \& Owner Bypass)
            byte[] fileBytes;
            try (java.io.InputStream is = resource.getInputStream()) {
                fileBytes = is.readAllBytes();
            }

            if (!isOwner && document.getContentType().equalsIgnoreCase("application/pdf")) {
                // If a custom watermark exists, use it. Otherwise, default to generic log
                // username overlay.
                String watermarkToApply = "VIEWED BY: " + logUsername;
                if (session.getWatermarkText() != null && !session.getWatermarkText().trim().isEmpty()) {
                    watermarkToApply = session.getWatermarkText();
                }
                fileBytes = applyWatermark(fileBytes, watermarkToApply, logUsername, ipAddress);
            }

            final byte[] finalFileBytes = fileBytes;
            final boolean finalIsOwner = isOwner;

            org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody responseBody = outputStream -> {
                try {
                    outputStream.write(finalFileBytes);
                    outputStream.flush();

                    // Only burn the link if the streaming was SUCCESSFUL
                    if (!finalIsOwner && session.isOneTimeView()) {
                        // Delay the burn by 2.0 seconds to ensure the browser finishes downloading
                        // the raw bytes from Tomcat's output buffer over the network wire
                        try {
                            Thread.sleep(2000);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                        viewerSessionRepository.delete(session);
                    }
                } catch (Exception e) {
                    System.err.println("Streaming interrupted or failed: " + e.getMessage());
                }
            };

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(document.getContentType()))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + document.getFileName() + "\"")
                    .body(responseBody);

        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(null);
        }
    }

    @GetMapping("/api/share/{token}/metadata")
    public ResponseEntity<Map<String, Object>> getShareMetadata(@PathVariable("token") String token) {
        try {
            ViewerSession session = viewerSessionRepository.findByShareToken(token)
                    .orElseThrow(() -> new RuntimeException("Invalid share token"));

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("expiresAt", session.getExpiresAt());
            metadata.put("documentName", session.getDocument().getFileName());
            metadata.put("contentType", session.getDocument().getContentType());
            metadata.put("watermarkText", session.getWatermarkText());
            metadata.put("watermarkOpacity",
                    session.getWatermarkOpacity() != null ? session.getWatermarkOpacity() : 15f);
            metadata.put("watermarkSize", session.getWatermarkSize() != null ? session.getWatermarkSize() : 14);
            metadata.put("watermarkDensity",
                    session.getWatermarkDensity() != null ? session.getWatermarkDensity() : 100);

            return ResponseEntity.ok(metadata);
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(null);
        }
    }

    private byte[] applyWatermark(byte[] pdfBytes, String customText, String viewerEmail, String ipAddress)
            throws Exception {
        try (java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream()) {
            PdfReader reader = new PdfReader(pdfBytes);
            PdfStamper stamper = new PdfStamper(reader, baos);

            int n = reader.getNumberOfPages();
            BaseFont font = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.WINANSI, BaseFont.EMBEDDED);

            String fullWatermark = customText.toUpperCase() + " | USER: " + viewerEmail + " | IP: " + ipAddress;

            com.lowagie.text.pdf.PdfGState gs1 = new com.lowagie.text.pdf.PdfGState();
            gs1.setFillOpacity(0.15f); // 15% opacity

            for (int i = 1; i <= n; i++) {
                PdfContentByte over = stamper.getOverContent(i);
                over.saveState();
                over.setGState(gs1);
                over.beginText();
                over.setFontAndSize(font, 36);
                over.setColorFill(java.awt.Color.GRAY);

                com.lowagie.text.Rectangle pagesize = reader.getPageSizeWithRotation(i);
                float x = pagesize.getWidth() / 2;
                float y = pagesize.getHeight() / 2;

                // Center align, draw text at exact middle coordinates, 45 degree angle
                over.showTextAligned(com.lowagie.text.Element.ALIGN_CENTER, fullWatermark, x, y, 45);

                over.endText();
                over.restoreState();
            }

            stamper.close();
            reader.close();
            return baos.toByteArray();
        }
    }
}