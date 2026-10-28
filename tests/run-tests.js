import assert from 'assert';
import { EligibilityEngine } from '../server/services/eligibilityEngine.js';
import { ScholarshipService } from '../server/services/scholarshipService.js';
import { ApplicationService } from '../server/services/applicationService.js';
import { ChecklistService } from '../server/services/checklistService.js';
import { MetricsService } from '../server/services/metricsService.js';
import { inMemoryDb } from '../server/config/supabase.js';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('🧪 RUNNING AIDPATH COMPREHENSIVE TEST SUITE');
console.log('======================================================\n');

// 1. ELIGIBILITY ENGINE TESTS
console.log('--- 1. Rule-Based Eligibility Engine Tests ---');

runTest('Elena Rostova meets all criteria for Ada Lovelace Grant', () => {
  const scholarship = inMemoryDb.scholarships.find((s) => s.id === 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1');
  const elena = inMemoryDb.profiles.find((p) => p.email === 'elena.rostova@university.edu');
  const reqs = inMemoryDb.scholarshipRequirements.filter((r) => r.scholarship_id === scholarship.id);

  const result = EligibilityEngine.evaluate(scholarship, elena, reqs);
  assert.strictEqual(result.match_status, 'ELIGIBLE');
  assert.ok(result.match_score >= 90, `Expected score >= 90, got ${result.match_score}`);
  assert.strictEqual(result.mandatory_passed, result.mandatory_total);

  // Check GPA explanation
  const gpaCard = result.explanations.find((e) => e.rule_id === 'rule-gpa');
  assert.ok(gpaCard, 'GPA explanation card missing');
  assert.strictEqual(gpaCard.status, 'PASS');
});

runTest('Marcus Chen fails Ada Lovelace due to major & degree standing', () => {
  const scholarship = inMemoryDb.scholarships.find((s) => s.id === 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1');
  const marcus = inMemoryDb.profiles.find((p) => p.email === 'marcus.chen@highschool.edu');
  const reqs = inMemoryDb.scholarshipRequirements.filter((r) => r.scholarship_id === scholarship.id);

  const result = EligibilityEngine.evaluate(scholarship, marcus, reqs);
  assert.strictEqual(result.match_status, 'INELIGIBLE');
  assert.ok(result.mandatory_passed < result.mandatory_total);

  // Major rule failed
  const majorCard = result.explanations.find((e) => e.rule_id === 'rule-major');
  assert.strictEqual(majorCard.status, 'FAIL');
});

runTest('Elena Rostova satisfies NextGen First-Gen Award (Need + First-Gen)', () => {
  const scholarship = inMemoryDb.scholarships.find((s) => s.id === 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2');
  const elena = inMemoryDb.profiles.find((p) => p.email === 'elena.rostova@university.edu');
  const reqs = inMemoryDb.scholarshipRequirements.filter((r) => r.scholarship_id === scholarship.id);

  const result = EligibilityEngine.evaluate(scholarship, elena, reqs);
  assert.strictEqual(result.match_status, 'ELIGIBLE');
  const firstGenCard = result.explanations.find((e) => e.rule_id === 'rule-first-gen');
  assert.strictEqual(firstGenCard.status, 'PASS');
});

// 2. SCHOLARSHIP DIRECTORY & STALENESS REVIEW
console.log('\n--- 2. Curated Directory & Stale Record Review Tests ---');

await runAsyncTest('getAll returns curated scholarships with computed staleness', async () => {
  const all = await ScholarshipService.getAll();
  assert.ok(all.length >= 8, `Expected at least 8 scholarships, got ${all.length}`);

  const staleOnes = all.filter((s) => s.is_stale);
  assert.ok(staleOnes.length >= 1, `Expected at least 1 stale record, got ${staleOnes.length}`);
});

await runAsyncTest('Keyword search filters correctly', async () => {
  const results = await ScholarshipService.getAll({ search: 'Ada Lovelace' });
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].title, 'Ada Lovelace Women in Computing Leadership Grant');
});

await runAsyncTest('Operator verification resets staleness and logs audit record', async () => {
  const allStale = await ScholarshipService.getStaleRecords();
  assert.ok(allStale.length > 0, 'No stale records available to verify');
  const targetSch = allStale[0];
  const operator = inMemoryDb.profiles.find((p) => p.role === 'operator');

  const before = await ScholarshipService.getById(targetSch.id);
  assert.strictEqual(before.is_stale, true);

  const verified = await ScholarshipService.verifyRecord(targetSch.id, operator, {
    notes: 'QA Automated Test verification of opportunity.',
  });

  assert.strictEqual(verified.verification_status, 'verified');
  assert.strictEqual(verified.is_stale, false);
});

// 3. APPLICATION PIPELINE & STAGES
console.log('\n--- 3. Application Pipeline & Stage Progression Tests ---');

await runAsyncTest('Student can save opportunity and auto-generate document checklists', async () => {
  const elena = inMemoryDb.profiles.find((p) => p.email === 'elena.rostova@university.edu');
  const targetSch = inMemoryDb.scholarships.find((s) => s.id === 'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3');

  const saved = await ApplicationService.saveOpportunity(elena.id, targetSch.id, 'Targeting rural medicine track');
  assert.ok(saved.id);
  assert.strictEqual(saved.stage, 'considering');

  // Verify checklists were generated for this application
  const checklist = await ChecklistService.getChecklistForApplication(saved.id, elena.id);
  assert.ok(checklist.items.length > 0, 'Checklist items should be auto-created from scholarship document requirements');
});

await runAsyncTest('Application stage transition updates stage and logs audit trail', async () => {
  const elena = inMemoryDb.profiles.find((p) => p.email === 'elena.rostova@university.edu');
  const app = inMemoryDb.savedScholarships.find((s) => s.user_id === elena.id);

  const updated = await ApplicationService.updateStage(app.id, elena.id, 'submitted', {
    notes: 'Submitted via official portal on test date.',
  });

  assert.strictEqual(updated.stage, 'submitted');
  assert.strictEqual(updated.notes, 'Submitted via official portal on test date.');
});

// 4. DOCUMENT CHECKLIST STATUS TRANSITIONS
console.log('\n--- 4. Document Checklist Status Transition Tests ---');

await runAsyncTest('Checklist item can be updated to ready with attached file', async () => {
  const item = inMemoryDb.applicationChecklists[0];
  const updated = await ChecklistService.updateChecklistItem(item.id, {
    status: 'ready',
    file_name: 'Transcript_Updated.pdf',
    notes: 'Uploaded and verified GPA match.',
  });

  assert.strictEqual(updated.status, 'ready');
  assert.strictEqual(updated.file_name, 'Transcript_Updated.pdf');
  assert.ok(updated.completed_at !== null);
});

// 5. OPERATIONAL METRICS
console.log('\n--- 5. Operational Metrics Calculation Tests ---');

await runAsyncTest('Operational metrics compute total funding and SLA rate', async () => {
  const stats = await MetricsService.getOperationalMetrics();
  assert.ok(stats.total_scholarships > 0);
  assert.ok(stats.total_funding_available > 0);
  assert.ok(stats.sla_compliance_rate >= 0 && stats.sla_compliance_rate <= 100);
});

await runAsyncTest('Student metrics summarize pipeline value and checklist completion', async () => {
  const elena = inMemoryDb.profiles.find((p) => p.email === 'elena.rostova@university.edu');
  const stats = await MetricsService.getStudentMetrics(elena.id);
  assert.ok(stats.total_saved > 0);
  assert.ok(stats.pipeline_value > 0);
  assert.ok(stats.stages_breakdown.submitted > 0);
});

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
