package com.docusafe.vault.controller;

import com.docusafe.vault.model.Document;
import com.docusafe.vault.model.User;
import com.docusafe.vault.model.ViewerSession;
import com.docusafe.vault.repository.UserRepository;
import com.docusafe.vault.repository.ViewerSessionRepository;
import com.docusafe.vault.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173",
        "http://127.0.0.1:5174" })
@RestController
@RequestMapping("/api/shares")
public class ViewerSessionController {

    @Autowired
    private ViewerSessionRepository viewerSessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    @GetMapping("/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveShares(Authentication authentication) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User currentUser = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Current user not found"));

            List<ViewerSession> activeSessions = viewerSessionRepository
                    .findActiveSessionsByDocumentOwner(currentUser.getId(), LocalDateTime.now());

            List<Map<String, Object>> response = new ArrayList<>();
            for (ViewerSession session : activeSessions) {
                Map<String, Object> sessionData = new HashMap<>();
                sessionData.put("token", session.getShareToken());
                sessionData.put("documentName", session.getDocument().getFileName());
                sessionData.put("expiresAt", session.getExpiresAt());
                sessionData.put("isConsumed", session.isConsumed());
                sessionData.put("oneTimeView", session.isOneTimeView());

                if (session.getTargetUserId() != null) {
                    User targetUser = userRepository.findById(session.getTargetUserId()).orElse(null);
                    sessionData.put("recipient", targetUser != null ? targetUser.getEmail()
                            : "Unknown User ID: " + session.getTargetUserId());
                } else {
                    sessionData.put("recipient", "Public Link");
                }
                response.add(sessionData);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/{token}")
    public ResponseEntity<?> revokeShare(@PathVariable("token") String token, Authentication authentication,
            jakarta.servlet.http.HttpServletRequest request) {
        try {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User currentUser = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Current user not found"));

            ViewerSession session = viewerSessionRepository.findByShareToken(token)
                    .orElseThrow(() -> new RuntimeException("Share session not found"));

            Document document = session.getDocument();

            // Verify the revoker is the owner of the document
            if (!document.getOwner().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body("Only the document owner can revoke this share link.");
            }

            // Delete the session to revoke access
            viewerSessionRepository.delete(session);

            // Add an audit log for the revocation
            String ipAddress = request.getRemoteAddr();
            if ("0:0:0:0:0:0:1".equals(ipAddress)) {
                ipAddress = "127.0.0.1";
            }
            auditService.logAction("REVOKE_SHARE", document.getId(), currentUser.getEmail(), ipAddress,
                    currentUser.getEmail(), currentUser.getId());

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error revoking share session: " + e.getMessage());
        }
    }
}
