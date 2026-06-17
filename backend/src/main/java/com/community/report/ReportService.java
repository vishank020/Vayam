package com.community.report;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ReportService {

    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @Transactional
    public void report(UUID reporterId, UUID reportedUserId, String reason) {
        if (reporterId.equals(reportedUserId)) {
            throw new IllegalArgumentException("Cannot report yourself");
        }
        Report report = new Report();
        report.setReporterId(reporterId);
        report.setReportedUserId(reportedUserId);
        report.setReason(reason);
        reportRepository.save(report);
    }
}
