// Jaxon Travis — Role Fit Scoring Rubric
// Source of truth: Design Docs/jaxon_fit_rubric.md (cited verbatim by the scoring model).
// For use in the Claude API-powered portfolio site (jaxontravis.com).
//
// NOTE: This object encodes amendments layered on top of the source MD:
//   1. hardGaps framing softened to "complementary team members / short ramp" language
//   2. subThresholdFraming appends a sub-7.0 qualifier sentence
//   3. comp floor/acceptable stored internally only — compNotSurfaced gates public output
//   4. scoringModifiers array (not in source MD)
//   5. systemPromptInstructions string (not in source MD)

export default {
  purpose: `This rubric is used to score a pasted job description against Jaxon's background, producing a 0–10 fit score plus a written analysis. The tone should be a confident, evidence-based advocate — lean toward putting Jaxon's best foot forward and emphasizing his proven ability to learn new tools/domains quickly, but never fabricate, never invent metrics or tools, and never claim experience he doesn't have. If a gap is real, name it honestly and then explain how his track record of fast ramp-up (blank-CRM builds, zero-to-process infrastructure, AI-assisted self-study) mitigates it.`,

  dimensions: [
    {
      id: 'core_mechanics',
      label: 'Core Role Mechanics Fit',
      weight: 0.25,
      description: `Do the day-to-day responsibilities in the JD map to things Jaxon has actually done (CS/AM motions, RevOps/GTM systems building, ops/BizOps 0-to-1 work)?`
    },
    {
      id: 'years_experience',
      label: 'Years of Experience',
      weight: 0.20,
      description: `Does Jaxon's ~3 years of client-facing/operations experience (Springbig, NACB, HŪMNZ) meet the JD's stated floor?`
    },
    {
      id: 'technical_depth',
      label: 'Technical / Domain Depth',
      weight: 0.20,
      description: `Does the role require specific technical or vertical-domain knowledge (coding, infra, specific industry expertise) Jaxon lacks?`
    },
    {
      id: 'tools_match',
      label: 'Tools Match',
      weight: 0.15,
      description: `Does the JD's required tech stack overlap with Jaxon's actual tools (see Tools Inventory below)?`
    },
    {
      id: 'company_logistics',
      label: 'Company & Logistics Fit',
      weight: 0.10,
      description: `Company stage/size, location/remote policy, work hours/on-call expectations, comp range vs. Jaxon's targets.`
    },
    {
      id: 'buyer_org_profile',
      label: 'Buyer / Org Profile',
      weight: 0.10,
      description: `How sophisticated/technical are the JD's described customers or stakeholders vs. Jaxon's prior buyer exposure (SMB retail, mid-market, C-suite)?`
    }
  ],

  threshold: 7.0,

  background: {
    narrative: `"Building operational infrastructure that makes early-stage companies function like real companies" — outcomes over titles. Two director-level titles (HŪMNZ, NACB) reflect scope at small startups, not large-team management experience.`,
    experience: [
      {
        company: 'HŪMNZ',
        title: 'Senior Director, Strategic Growth / Dir. of Operations',
        dates: 'May 2025–present',
        highlights: [
          `Built full GTM/CRM infrastructure from a blank Membrain instance — pipeline architecture, workflow automation, reporting dashboards, SLA frameworks, diagnostic scorecards.`,
          `Deployed AI-powered workflows (prospect research, content generation, sales-training tooling).`,
          `Built a client-facing MVP portal in Softr.`
        ]
      },
      {
        company: 'NACB',
        title: 'Director of Client Success',
        dates: 'Oct 2023–Sep 2024',
        highlights: [
          `Rebuilt operations from a blank Zoho CRM instance — pipeline, stage logic, reporting.`,
          `Managed team of 4.`,
          `Signed 56 accounts in 4 weeks of a beta launch.`,
          `Ran outbound at ~3,000 emails/week across a 9,000-contact database with automated multi-touch sequences.`
        ]
      },
      {
        company: 'Springbig',
        title: 'CSM / Retail Account Manager',
        dates: 'Feb 2022–May 2023',
        highlights: [
          `Managed 86 B2B SaaS accounts, kept churn below 5%, generated $250K+ in expansion ARR via upsell/cross-sell, built account health dashboards and renewal workflows.`
        ]
      },
      {
        company: 'McKinney Alternative Investments',
        title: 'Executive Assistant',
        dates: 'Jan 2021–Oct 2021',
        highlights: [
          `Supported $55M real estate portfolio (CA/MI/CO); ~$38K cost savings via vendor negotiation; supported $100K capital raise via networking.`
        ]
      },
      {
        company: 'Vujà Dé Digital / Jaxon Travis Marketing',
        title: 'Founder / Operator',
        dates: 'Self-directed',
        highlights: [
          `Project workflow design, SOPs, client CRM management, marketing collateral for SMB clients.`
        ]
      }
    ],
    tools: {
      crm_built: [
        `Zoho (NACB, blank instance)`,
        `Membrain (HŪMNZ, blank instance)`
      ],
      crm_used: [
        `Salesforce (Springbig era)`
      ],
      automation: [
        `Zapier — familiar/working level, not advanced/enterprise admin`
      ],
      noCode: [
        `Softr (built client-facing MVP portal)`
      ],
      analytics: [
        `Tableau — dashboard usage/consumption only, NOT a builder/admin`
      ],
      ai: [
        `Claude, ChatGPT — genuine differentiator; used for prospect research pipelines, content generation, market intelligence, workflow automation`
      ],
      notInToolkit: [
        `SQL`,
        `advanced Excel/Power Query modeling`,
        `Salesforce admin certification`,
        `Gainsight`,
        `marketing automation platforms (HubSpot, Marketo, Eloqua)`,
        `coding languages (Python/Java etc.)`,
        `test automation / DevOps / cloud infrastructure tooling`
      ]
    },
    education: `BA/BBA, International Business — UC San Diego (graduation year intentionally omitted). Study abroad credit in Finance — ISCTE, Lisbon.`,
    targetProfile: {
      roles: [
        `RevOps`,
        `CS/Account Management`,
        `Strategic Ops/BizOps/Chief of Staff/Founder's Associate`,
        `0-to-1 systems builder roles`
      ],
      companyStage: `funded startup through mid-market preferred (11–200 employees ideal for "first builder" mandates); enterprise acceptable`,
      geography: `West Coast preferred, open to all of US`,
      workModel: `remote/hybrid preferred, onsite acceptable`,
      // AMENDMENT 3: comp values retained for internal reference only.
      // compNotSurfaced (outputFormat) MUST gate these out of any public-facing output.
      comp: {
        ideal: '80000-100000',
        acceptable: 70000,
        floor: 60000
      }
    }
  },

  // AMENDMENT 1: gap names are factually exact; the surrounding framing is softened from
  // "these dimensions consistently score low and should NOT be inflated" to areas where
  // complementary team members or a short ramp period would be needed.
  hardGaps: [
    `Required SQL proficiency`,
    `Advanced Excel/Power Query modeling`,
    `Salesforce administrator certification`,
    `Gainsight`,
    `Marketing automation platforms (HubSpot, Marketo, Eloqua)`,
    `Coding/programming language requirements`,
    `Deep technical/infrastructure domains (cloud infra, DevSecOps, AppSec, test automation, ML engineering)`,
    `Hard experience floors above ~5 years`,
    `Team management scope significantly larger than 4 direct reports`
  ],

  hardGapsFraming: `These are areas where complementary team members or a short ramp period would be needed. Acknowledge them honestly by name when present in a JD; do not inflate them. When one appears, name it plainly, then pivot to the fast-learner / blank-instance-builder evidence as the mitigating argument.`,

  differentiators: [
    `Speed of learning new systems: built two separate CRM stacks (Zoho, Membrain) from completely blank instances, learning architecture from scratch under real business pressure — this is direct evidence of rapid ramp capability for ANY new tool/platform a JD names.`,
    `AI fluency as a working tool, not just a buzzword — used daily for research, automation, content, and workflow design.`,
    `0-to-1 builder mindset: comfortable when "the infrastructure doesn't exist yet and needs to be designed."`,
    `Cross-functional range: has operated at both strategic/CEO-partner level and IC/account-execution level.`,
    `Demonstrated results: 56 accounts in 4 weeks from a cold beta launch; sub-5% churn and $250K+ expansion ARR on an 86-account portfolio.`
  ],

  // AMENDMENT 4: scoringModifiers — not present in the source MD.
  scoringModifiers: [
    {
      condition: 'JD explicitly mentions AI fluency, AI-native workflows, or AI tooling as a requirement or differentiator',
      modifier: +0.5,
      rationale: 'Direct signal this role is calibrated for Jaxon\'s genuine differentiator'
    },
    {
      condition: 'JD uses language like "no playbook", "zero to one", "first ops hire", "build from scratch", or "founder\'s associate"',
      modifier: +0.5,
      rationale: 'Direct signal this role needs a builder mindset — Jaxon\'s core strength'
    },
    {
      condition: 'JD requires SQL, coding languages, Salesforce admin certification, Gainsight, or HubSpot/Marketo admin',
      modifier: -0.5,
      rationale: 'Confirmed hard gap — modifier applied regardless of other dimension scores'
    }
  ],

  honestyGuardrails: [
    `Never claim Jaxon has built/administered Salesforce, HubSpot, Gainsight, or any platform he has only used as an end-user or not at all.`,
    `Never imply SQL, coding, or technical infrastructure experience.`,
    `Never inflate team size, budget ownership, or revenue figures beyond documented numbers ($250K+ expansion ARR, $55M portfolio support, $38K cost savings, $100K capital raised, 56 accounts/4 weeks, 86 accounts, ~3,000 emails/week, 9,000-contact database).`,
    `When a gap is real, say so plainly, then pivot to the "fast learner / blank-instance builder" evidence as the mitigating argument — do not pretend the gap doesn't exist.`,
    `Two director titles at small startups (HŪMNZ, NACB) should be framed as scope-appropriate for company size, not as senior-management experience equivalent to a director role at a larger company.`
  ],

  outputFormat: {
    sections: [
      'one_line_verdict',
      'weighted_score',
      'dimension_table',
      'closing_paragraph'
    ],
    // Weighted score formula: sum(dimension_score × weight), each dimension scored 0–10.
    // Application threshold: 7.0/10. Below that, be direct that it's a stretch — but for a
    // portfolio tool, frame sub-threshold scores as "here's what would need to be true for
    // this to be a strong match" rather than a flat rejection, since the recruiter reading it
    // is evaluating Jaxon's honesty and self-awareness as much as the fit itself.
    //
    // AMENDMENT 2: the closing qualifier sentence is appended below.
    subThresholdFraming: `For each scored role, return: (1) a one-line overall verdict (e.g., "Strong mechanics match with one notable gap"); (2) the weighted score (e.g., "7.2/10"); (3) a dimension-by-dimension table (dimension, weight, score, 1–2 sentence rationale); (4) a short closing paragraph: if score ≥7.0, why Jaxon is worth a serious look; if <7.0, what gap(s) exist and how his rapid-learning track record narrows them — framed kindly and confidently, never as disqualifying. Append to all sub-7.0 scores: 'Scores below 7.0 on this rubric reflect specific technical requirements rather than overall operational capability. Jaxon's track record of learning new systems under real business pressure has historically closed skill gaps faster than hiring timelines suggest — a conversation is worth having.'`,
    compNotSurfaced: true
  },

  // AMENDMENT 5: systemPromptInstructions — not present in the source MD.
  systemPromptInstructions: `You are scoring a job description against Jaxon Travis's professional background. Tone: confident, evidence-based advocate. Lead with genuine strengths. Acknowledge real gaps honestly by name, then immediately pivot to the fast-learner and blank-instance-builder evidence as the mitigating argument. Never fabricate experience, metrics, or tool proficiency. Apply scoring modifiers where conditions are met. The recruiter reading this output is evaluating Jaxon's judgment and self-awareness as much as his fit score — a well-reasoned 6.5 with honest gap analysis is more valuable than an inflated 8.0 that erodes trust at interview.`
};
