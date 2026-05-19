import type { ParsedSkill } from "@nitor-skillhub/core";
import type { ScanFinding, ScanResult, FindingSeverity } from "./types.js";
import {
  HIGH_RISK_PATTERNS,
  PROMPT_INJECTION_PATTERNS,
  REQUIRED_GUARDRAILS,
  MISSING_METADATA_CHECKS,
} from "./patterns.js";

export class SkillScanner {
  /**
   * Scan a parsed skill for security issues, dangerous patterns, and quality checks.
   */
  scan(parsed: ParsedSkill): ScanResult {
    const findings: ScanFinding[] = [];

    // Scan against all pattern groups
    this.scanPatterns(parsed, HIGH_RISK_PATTERNS, findings);
    this.scanPatterns(parsed, PROMPT_INJECTION_PATTERNS, findings);
    this.scanMissingGuardrails(parsed, findings);
    this.scanMissingMetadata(parsed, findings);

    const summary = this.computeSummary(findings);

    return {
      skillName: parsed.metadata.name,
      passed: summary.high === 0,
      findings,
      summary,
      scannedAt: new Date().toISOString(),
    };
  }

  /**
   * Scan raw skill content line-by-line against a set of regex patterns.
   */
  private scanPatterns(
    parsed: ParsedSkill,
    patterns: { id: string; name: string; severity: FindingSeverity; category: string; pattern: RegExp; message: string; recommendation: string }[],
    findings: ScanFinding[]
  ): void {
    const lines = (parsed.raw || "").split("\n");

    for (const pattern of patterns) {
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(pattern.pattern);
        if (match) {
          findings.push({
            ruleId: pattern.id,
            severity: pattern.severity,
            category: pattern.category,
            message: pattern.message,
            lineNumber: i + 1,
            lineContent: lines[i].trim(),
            recommendation: pattern.recommendation,
          });
          break;
        }
      }
    }
  }

  /**
   * Check that required guardrail sections exist in the skill body.
   */
  private scanMissingGuardrails(
    parsed: ParsedSkill,
    findings: ScanFinding[]
  ): void {
    const body = parsed.body || "";

    for (const guardrail of REQUIRED_GUARDRAILS) {
      if (!body.includes(guardrail.header)) {
        findings.push({
          ruleId: guardrail.id,
          severity: "low" as FindingSeverity,
          category: "missing-guardrail",
          message: `Skill is missing the "${guardrail.name}" section`,
          recommendation: `Add a "${guardrail.header}" section to the skill body.`,
        });
      }
    }
  }

  /**
   * Check that mandatory metadata fields are populated.
   */
  private scanMissingMetadata(
    parsed: ParsedSkill,
    findings: ScanFinding[]
  ): void {
    for (const check of MISSING_METADATA_CHECKS) {
      const value = parsed.metadata[check.field];
      const isEmpty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        findings.push({
          ruleId: check.id,
          severity: "low" as FindingSeverity,
          category: "missing-metadata",
          message: `Skill is missing required metadata field: ${check.name}`,
          recommendation: `Add "${check.field}" to the skill's frontmatter.`,
        });
      }
    }
  }

  /**
   * Count findings by severity level.
   */
  private computeSummary(findings: ScanFinding[]): ScanResult["summary"] {
    return {
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      info: findings.filter((f) => f.severity === "info").length,
    };
  }
}
