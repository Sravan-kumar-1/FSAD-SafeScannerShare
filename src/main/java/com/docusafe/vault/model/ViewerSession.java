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
@Table(name = "viewer_sessions")
public class ViewerSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(unique = true, nullable = false)
    private String shareToken;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "target_user_id", nullable = true)
    private Long targetUserId;

    @Column(name = "one_time_view", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean oneTimeView = false;

    @Column(name = "is_consumed", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean isConsumed = false;

    @Column(name = "watermark_text", nullable = true, length = 255)
    private String watermarkText;

    @Column(name = "watermark_opacity")
    @Builder.Default
    private Float watermarkOpacity = 15f;

    @Column(name = "watermark_size")
    @Builder.Default
    private Integer watermarkSize = 14;

    @Column(name = "watermark_density")
    @Builder.Default
    private Integer watermarkDensity = 100;
}
