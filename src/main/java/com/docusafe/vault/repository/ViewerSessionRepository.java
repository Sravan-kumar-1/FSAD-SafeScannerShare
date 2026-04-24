package com.docusafe.vault.repository;

import com.docusafe.vault.model.ViewerSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface ViewerSessionRepository extends JpaRepository<ViewerSession, Long> {
    Optional<ViewerSession> findByShareToken(String shareToken);

    @Query("SELECT vs FROM ViewerSession vs WHERE vs.document.owner.id = :userId AND vs.expiresAt > :now")
    List<ViewerSession> findActiveSessionsByDocumentOwner(@Param("userId") Long userId,
            @Param("now") LocalDateTime now);
}
