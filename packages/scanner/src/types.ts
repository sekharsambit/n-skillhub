/**
 * Severity level for a scan finding.
 */
export type FindingSeverity = "high" | "medium" | "low" | "info";

/**
 * A single scan finding.
 */
export interface ScanFinding {
  ruleId: string;
  severity: FindingSeverity;
  category: string;
  message: string;
  lineNumber?: number;
  lineContent?: string;
  recommendation?: string;
}

/**
 * The overall result of a scan.
 */
export interface ScanResult {
  skillName: string;
  passed: boolean;
  findings: ScanFinding[];
  summary: {
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  scannedAt: string;
}

/**
 * A pattern definition for scanning.
 */
export interface ScanPattern {
  id: string;
  name: string;
  severity: FindingSeverity;
  category: string;
  pattern: RegExp;
  message: string;
  recommendation: string;
}
