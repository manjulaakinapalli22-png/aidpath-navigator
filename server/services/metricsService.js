import { inMemoryDb } from '../config/supabase.js';
import { ScholarshipService } from './scholarshipService.js';
import { ApplicationService } from './applicationService.js';

export class MetricsService {
  /**
   * Get personalized operational and progress metrics for a student
   */
  static async getStudentMetrics(userId) {
    const applications = await ApplicationService.getUserApplications(userId);

    const totalSaved = applications.length;
    let pipelineTotalAmount = 0;
    let awardedAmount = 0;
    let urgentCount = 0;
    let totalDocsCount = 0;
    let completedDocsCount = 0;

    const stages = {
      considering: 0,
      preparing: 0,
      submitted: 0,
      under_review: 0,
      awarded: 0,
      declined: 0,
    };

    applications.forEach((app) => {
      const award = parseFloat(app.scholarship.award_amount) || 0;
      pipelineTotalAmount += award;

      if (app.stage === 'awarded') {
        awardedAmount += parseFloat(app.award_amount_won || award);
      }

      if (stages[app.stage] !== undefined) {
        stages[app.stage]++;
      }

      if (app.deadline_info && (app.deadline_info.urgency === 'critical' || app.deadline_info.urgency === 'urgent')) {
        urgentCount++;
      }

      totalDocsCount += app.checklist_summary.total;
      completedDocsCount += app.checklist_summary.completed;
    });

    const checklistHealthPercent = totalDocsCount > 0 ? Math.round((completedDocsCount / totalDocsCount) * 100) : 100;

    return {
      total_saved: totalSaved,
      pipeline_value: pipelineTotalAmount,
      awarded_value: awardedAmount,
      urgent_deadlines_count: urgentCount,
      checklist_health_percent: checklistHealthPercent,
      documents_total: totalDocsCount,
      documents_completed: completedDocsCount,
      stages_breakdown: stages,
    };
  }

  /**
   * Get operational metrics for operators and admins
   */
  static async getOperationalMetrics() {
    const allScholarships = await ScholarshipService.getAll({ is_active: true });
    const staleRecords = allScholarships.filter((s) => s.is_stale || s.verification_status === 'flagged_stale');
    const verifiedRecords = allScholarships.filter((s) => !s.is_stale && s.verification_status === 'verified');

    const totalAwardFunding = allScholarships.reduce((acc, s) => acc + (parseFloat(s.award_amount) || 0), 0);

    const totalCount = allScholarships.length;
    const slaComplianceRate = totalCount > 0 ? Math.round((verifiedRecords.length / totalCount) * 100) : 100;

    // Recent reviews count (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentReviews = inMemoryDb.verificationReviews.filter((r) => new Date(r.created_at) >= thirtyDaysAgo);

    return {
      total_scholarships: totalCount,
      total_funding_available: totalAwardFunding,
      verified_count: verifiedRecords.length,
      stale_records_count: staleRecords.length,
      sla_compliance_rate: slaComplianceRate,
      recent_reviews_count: recentReviews.length,
      audit_events_count: inMemoryDb.auditLogs.length,
      active_students_count: inMemoryDb.profiles.filter((p) => p.role === 'student').length,
    };
  }
}
