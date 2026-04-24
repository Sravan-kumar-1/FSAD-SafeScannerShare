package com.docusafe.vault.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private Long documentId;

    private String username;

    private String ipAddress;

    @Column(name = "viewer_email")
    private String viewerEmail;

    @Column(name = "viewer_id")
    private Long viewerId;

    @CreationTimestamp
    private LocalDateTime timestamp;
}
