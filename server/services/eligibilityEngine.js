/**
 * Rule-Based Eligibility Explanation Engine
 * Evaluates student profiles against scholarship criteria and requirements.
 * Produces structured, human-readable explanations and actionable recommendations.
 */

export class EligibilityEngine {
  /**
   * Evaluate a single scholarship against a student profile
   * @param {Object} scholarship
   * @param {Object} profile
   * @param {Array} requirements Optional granular requirements array
   * @returns {Object} Structured eligibility evaluation
   */
  static evaluate(scholarship, profile, requirements = []) {
    if (!profile) {
      return {
        scholarship_id: scholarship.id,
        match_status: 'UNKNOWN',
        match_score: 0,
        summary: 'Log in or provide a profile to see personalized eligibility explanations.',
        explanations: [],
        passed_count: 0,
        total_rules: 0,
      };
    }

    const explanations = [];
    let mandatoryTotal = 0;
    let mandatoryPassed = 0;
    let optionalTotal = 0;
    let optionalPassed = 0;

    // 1. GPA Evaluation
    if (scholarship.min_gpa !== null && scholarship.min_gpa !== undefined) {
      mandatoryTotal++;
      const userGpa = parseFloat(profile.gpa) || 0.0;
      const minGpa = parseFloat(scholarship.min_gpa);

      if (userGpa >= minGpa) {
        mandatoryPassed++;
        explanations.push({
          rule_id: 'rule-gpa',
          category: 'academic',
          title: 'Minimum GPA Requirement',
          is_mandatory: true,
          status: 'PASS',
          badge: 'Meets Criteria',
          user_value: `${userGpa.toFixed(2)} GPA`,
          required_value: `Minimum ${minGpa.toFixed(2)} GPA`,
          explanation: `Your cumulative GPA of ${userGpa.toFixed(2)} meets the minimum threshold of ${minGpa.toFixed(2)}.`,
          tip: userGpa >= minGpa + 0.3 ? 'Strong academic record strengthens your merit ranking.' : 'Maintain your current GPA through the grading cycle.',
        });
      } else if (userGpa >= minGpa - 0.15) {
        // Close gap warning
        explanations.push({
          rule_id: 'rule-gpa',
          category: 'academic',
          title: 'Minimum GPA Requirement',
          is_mandatory: true,
          status: 'WARNING',
          badge: 'Borderline Range',
          user_value: `${userGpa.toFixed(2)} GPA`,
          required_value: `Minimum ${minGpa.toFixed(2)} GPA`,
          explanation: `Your GPA of ${userGpa.toFixed(2)} is just under the ${minGpa.toFixed(2)} benchmark. Some committees consider holistic appeals or upward grade trends.`,
          tip: 'Highlight major-specific coursework or include a brief explanation in your personal essay.',
        });
      } else {
        explanations.push({
          rule_id: 'rule-gpa',
          category: 'academic',
          title: 'Minimum GPA Requirement',
          is_mandatory: true,
          status: 'FAIL',
          badge: 'Below Minimum',
          user_value: `${userGpa.toFixed(2)} GPA`,
          required_value: `Minimum ${minGpa.toFixed(2)} GPA`,
          explanation: `Current cumulative GPA (${userGpa.toFixed(2)}) is below the required ${minGpa.toFixed(2)}.`,
          tip: 'Focus on other opportunities that match your GPA range or offer holistic review.',
        });
      }
    }

    // 2. Degree Level Evaluation
    if (scholarship.education_levels && scholarship.education_levels.length > 0) {
      mandatoryTotal++;
      const userLevel = profile.degree_level || '';
      const allowedLevels = scholarship.education_levels;
      const isLevelMatch = allowedLevels.includes('All') || allowedLevels.some((l) => l.toLowerCase() === userLevel.toLowerCase());

      if (isLevelMatch) {
        mandatoryPassed++;
        explanations.push({
          rule_id: 'rule-degree-level',
          category: 'education',
          title: 'Education Degree Level',
          is_mandatory: true,
          status: 'PASS',
          badge: 'Level Match',
          user_value: userLevel,
          required_value: allowedLevels.join(', '),
          explanation: `Enrolled as ${userLevel}, matching the target cohort (${allowedLevels.join(', ')}).`,
          tip: 'Verify you will be registered during the disbursement term.',
        });
      } else {
        explanations.push({
          rule_id: 'rule-degree-level',
          category: 'education',
          title: 'Education Degree Level',
          is_mandatory: true,
          status: 'FAIL',
          badge: 'Level Mismatch',
          user_value: userLevel,
          required_value: allowedLevels.join(', '),
          explanation: `This award is reserved specifically for: ${allowedLevels.join(', ')}. Your registered standing is ${userLevel}.`,
          tip: 'Filter the directory by your specific degree level to find matching opportunities.',
        });
      }
    }

    // 3. Major / Field of Study
    if (scholarship.eligible_majors && scholarship.eligible_majors.length > 0) {
      mandatoryTotal++;
      const userMajor = (profile.major || '').toLowerCase().trim();
      const majors = scholarship.eligible_majors;
      const isAllMajors = majors.some((m) => m.toLowerCase().includes('all major'));
      
      const isMajorMatch =
        isAllMajors ||
        majors.some((m) => {
          const lowerM = m.toLowerCase().trim();
          return lowerM === userMajor || userMajor.includes(lowerM) || lowerM.includes(userMajor);
        });

      if (isMajorMatch) {
        mandatoryPassed++;
        explanations.push({
          rule_id: 'rule-major',
          category: 'major',
          title: 'Field of Study / Major',
          is_mandatory: true,
          status: 'PASS',
          badge: 'Major Aligned',
          user_value: profile.major || 'Undeclared',
          required_value: isAllMajors ? 'Open to All Majors' : majors.join(', '),
          explanation: isAllMajors
            ? 'Open to scholars from all academic departments and disciplines.'
            : `Your field of study (${profile.major}) directly qualifies under the scholarship scope.`,
          tip: 'Relate your upcoming coursework and career plans to the sponsor mission.',
        });
      } else {
        explanations.push({
          rule_id: 'rule-major',
          category: 'major',
          title: 'Field of Study / Major',
          is_mandatory: true,
          status: 'FAIL',
          badge: 'Major Excluded',
          user_value: profile.major || 'None',
          required_value: majors.join(', '),
          explanation: `This sponsor specifically funds: ${majors.join(', ')}. Your recorded major is ${profile.major}.`,
          tip: 'If you have a double major or minor related to this field, reach out to the sponsor for review.',
        });
      }
    }

    // 4. Residency Status
    if (scholarship.residency_requirements && scholarship.residency_requirements.length > 0) {
      mandatoryTotal++;
      const userResidency = profile.residency_status || '';
      const allowedResidencies = scholarship.residency_requirements;
      const isResidencyMatch =
        allowedResidencies.includes('Any') ||
        allowedResidencies.some((r) => r.toLowerCase() === userResidency.toLowerCase());

      if (isResidencyMatch) {
        mandatoryPassed++;
        explanations.push({
          rule_id: 'rule-residency',
          category: 'residency',
          title: 'Citizenship & Legal Residency',
          is_mandatory: true,
          status: 'PASS',
          badge: 'Residency Eligible',
          user_value: userResidency,
          required_value: allowedResidencies.join(', '),
          explanation: `Your status as ${userResidency} fulfills sponsor requirements.`,
          tip: 'Keep government ID or proof of residency ready if requested.',
        });
      } else {
        explanations.push({
          rule_id: 'rule-residency',
          category: 'residency',
          title: 'Citizenship & Legal Residency',
          is_mandatory: true,
          status: 'FAIL',
          badge: 'Residency Ineligible',
          user_value: userResidency,
          required_value: allowedResidencies.join(', '),
          explanation: `Requires status in: ${allowedResidencies.join(', ')}. Recorded profile status is ${userResidency}.`,
          tip: 'Check for international student or DACA-specific funding directories.',
        });
      }
    }

    // 5. Need-Based / Household Income
    if (scholarship.need_based) {
      mandatoryTotal++;
      const userIncome = parseFloat(profile.household_income) || 0;
      const maxIncome = scholarship.max_household_income ? parseFloat(scholarship.max_household_income) : null;

      if (!maxIncome || userIncome <= maxIncome) {
        mandatoryPassed++;
        explanations.push({
          rule_id: 'rule-need',
          category: 'financial',
          title: 'Financial Need Assessment',
          is_mandatory: true,
          status: 'PASS',
          badge: 'Need Demonstrated',
          user_value: `$${userIncome.toLocaleString()}/yr`,
          required_value: maxIncome ? `Income <= $${maxIncome.toLocaleString()}` : 'Need-Based Demonstration',
          explanation: maxIncome
            ? `Reported annual household income ($${userIncome.toLocaleString()}) falls within the need cap of $${maxIncome.toLocaleString()}.`
            : 'You meet the general need-based guidelines for this endowment.',
          tip: 'Provide your FAFSA Student Aid Index (SAI) or latest W-2 for expedited verification.',
        });
      } else {
        explanations.push({
          rule_id: 'rule-need',
          category: 'financial',
          title: 'Financial Need Assessment',
          is_mandatory: true,
          status: 'FAIL',
          badge: 'Exceeds Income Cap',
          user_value: `$${userIncome.toLocaleString()}/yr`,
          required_value: `Income <= $${maxIncome.toLocaleString()}`,
          explanation: `Household income ($${userIncome.toLocaleString()}) exceeds the allowable financial need ceiling ($${maxIncome.toLocaleString()}).`,
          tip: 'Look into merit-based awards that do not factor family income.',
        });
      }
    } else {
      // Optional info rule
      explanations.push({
        rule_id: 'rule-merit',
        category: 'financial',
        title: 'Financial Need Policy',
        is_mandatory: false,
        status: 'INFO',
        badge: 'Merit Open',
        user_value: 'N/A',
        required_value: 'Open to All Incomes',
        explanation: 'This is a non-need-based / merit award. Household income does not restrict your eligibility.',
        tip: 'Focus strongly on your personal essay and achievements.',
      });
    }

    // 6. First-Generation Requirement (Check granular requirements or criteria)
    const firstGenReq = requirements.find((r) => r.requirement_type === 'first_gen');
    if (firstGenReq || (scholarship.demographic_criteria && scholarship.demographic_criteria.includes('First-Generation College Student'))) {
      mandatoryTotal++;
      if (profile.is_first_generation) {
        mandatoryPassed++;
        explanations.push({
          rule_id: 'rule-first-gen',
          category: 'demographic',
          title: 'First-Generation Scholar',
          is_mandatory: true,
          status: 'PASS',
          badge: 'First-Gen Confirmed',
          user_value: 'Yes (First in family)',
          required_value: 'First-Generation Student',
          explanation: 'Your profile confirms first-generation college standing, matching the targeted endowment mission.',
          tip: 'Be sure to articulate family background in your personal statement.',
        });
      } else {
        explanations.push({
          rule_id: 'rule-first-gen',
          category: 'demographic',
          title: 'First-Generation Scholar',
          is_mandatory: true,
          status: 'FAIL',
          badge: 'Requirement Not Met',
          user_value: 'Not First-Gen',
          required_value: 'First-Generation Student Only',
          explanation: 'This fund specifically supports students who are the first in their immediate family to attend college.',
          tip: 'Explore general community and discipline-specific grants.',
        });
      }
    }

    // 7. Demographic / Identity Preferences (soft criteria)
    if (scholarship.demographic_criteria && scholarship.demographic_criteria.length > 0) {
      scholarship.demographic_criteria.forEach((criterion, idx) => {
        if (criterion === 'First-Generation College Student') return; // already handled
        optionalTotal++;
        const userTags = profile.demographic_tags || [];
        const hasTag = userTags.some((tag) => tag.toLowerCase().includes(criterion.toLowerCase()) || criterion.toLowerCase().includes(tag.toLowerCase()));

        if (hasTag) {
          optionalPassed++;
          explanations.push({
            rule_id: `rule-demo-${idx}`,
            category: 'demographic',
            title: `Preferred Demographic: ${criterion}`,
            is_mandatory: false,
            status: 'PASS',
            badge: 'Target Match',
            user_value: criterion,
            required_value: criterion,
            explanation: `Your profile highlights affiliation with: ${criterion}. Priority review applies.`,
            tip: 'Mention community involvement related to this community in your application.',
          });
        } else {
          explanations.push({
            rule_id: `rule-demo-${idx}`,
            category: 'demographic',
            title: `Target Focus: ${criterion}`,
            is_mandatory: false,
            status: 'INFO',
            badge: 'Preference / Open',
            user_value: 'Not indicated on profile',
            required_value: `Encouraged: ${criterion}`,
            explanation: `Applicants identifying with "${criterion}" are strongly encouraged to apply.`,
            tip: 'Update your profile tags if you identify with this community.',
          });
        }
      });
    }

    // Calculate overall match score & status
    const mandatoryScore = mandatoryTotal > 0 ? (mandatoryPassed / mandatoryTotal) * 80 : 80;
    const optionalScore = optionalTotal > 0 ? (optionalPassed / optionalTotal) * 20 : 20;
    const totalScore = Math.round(mandatoryScore + optionalScore);

    let matchStatus = 'ELIGIBLE';
    if (mandatoryPassed < mandatoryTotal) {
      if (mandatoryPassed >= mandatoryTotal - 1 && mandatoryTotal > 1) {
        matchStatus = 'PARTIALLY_ELIGIBLE';
      } else {
        matchStatus = 'INELIGIBLE';
      }
    }

    let summary = '';
    if (matchStatus === 'ELIGIBLE') {
      summary = `Excellent fit! You meet all ${mandatoryPassed}/${mandatoryTotal} mandatory criteria with a ${totalScore}% match score.`;
    } else if (matchStatus === 'PARTIALLY_ELIGIBLE') {
      summary = `Potential opportunity: You meet ${mandatoryPassed}/${mandatoryTotal} mandatory criteria with 1 requirement needing attention or appeal (${totalScore}% match score).`;
    } else {
      summary = `Criteria mismatch: You do not currently meet key mandatory eligibility requirements (${mandatoryPassed}/${mandatoryTotal} met).`;
    }

    return {
      scholarship_id: scholarship.id,
      match_status: matchStatus,
      match_score: totalScore,
      summary,
      mandatory_passed: mandatoryPassed,
      mandatory_total: mandatoryTotal,
      optional_passed: optionalPassed,
      optional_total: optionalTotal,
      explanations,
    };
  }

  /**
   * Evaluate a batch of scholarships for a student profile
   */
  static evaluateMany(scholarships, profile, allRequirements = []) {
    return scholarships.map((scholarship) => {
      const scholarshipReqs = allRequirements.filter((r) => r.scholarship_id === scholarship.id);
      const evalResult = this.evaluate(scholarship, profile, scholarshipReqs);
      return {
        ...scholarship,
        eligibility: evalResult,
      };
    });
  }
}
