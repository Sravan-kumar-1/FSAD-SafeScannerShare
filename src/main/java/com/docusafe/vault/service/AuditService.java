package com.docusafe.vault.service;

import com.docusafe.vault.model.AuditLog;
import com.docusafe.vault.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void logAction(String action, Long documentId, String username, String ipAddress) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .documentId(documentId)
                .username(username)
                .ipAddress(ipAddress)
                .build();

        auditLogRepository.save(auditLog);
    }

    public void logAction(String action, Long documentId, String username, String ipAddress, String viewerEmail,
            Long viewerId) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .documentId(documentId)
                .username(username)
                .ipAddress(ipAddress)
                .viewerEmail(viewerEmail)
                .viewerId(viewerId)
                .build();

        auditLogRepository.save(auditLog);
    }
}
