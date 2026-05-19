import type { ScanPattern } from "./types.js";

/**
 * High-risk security patterns that should block publishing.
 */
export const HIGH_RISK_PATTERNS: ScanPattern[] = [
  {
    id: "HR-001",
    name: "Destructive file removal",
    severity: "high",
    category: "dangerous-command",
    pattern: /rm\s+-rf\s+\//gi,
    message: "Skill contains command to recursively force-delete from root (/)",
    recommendation: "Remove any destructive file system commands from the skill.",
  },
  {
    id: "HR-002",
    name: "Curl pipe to shell",
    severity: "high",
    category: "dangerous-command",
    pattern: /curl\s+.*\|\s*(?:sh|bash|zsh)/gi,
    message: "Skill contains curl-to-shell pattern that downloads and executes remote code",
    recommendation: "Avoid downloading and executing remote scripts directly.",
  },
  {
    id: "HR-003",
    name: "Wget pipe to shell",
    severity: "high",
    category: "dangerous-command",
    pattern: /wget\s+.*\|\s*(?:sh|bash|zsh)/gi,
    message: "Skill contains wget-to-shell pattern that downloads and executes remote code",
    recommendation: "Avoid downloading and executing remote scripts directly.",
  },
  {
    id: "HR-004",
    name: "World-writable permissions",
    severity: "high",
    category: "dangerous-command",
    pattern: /chmod\s+777/gi,
    message: "Skill uses chmod 777 to set world-writable permissions",
    recommendation: "Use more restrictive permissions instead of 777.",
  },
  {
    id: "HR-005",
    name: "Un-contextualized sudo",
    severity: "medium",
    category: "dangerous-command",
    pattern: /^\s*sudo\s/igm,
    message: "Skill contains a sudo command without context or justification",
    recommendation: "Explain why sudo is needed and suggest alternatives if possible.",
  },
  {
    id: "HR-006",
    name: "Hardcoded API key or secret",
    severity: "high",
    category: "hardcoded-secret",
    pattern: /(?:api[_-]?key|api[_-]?secret|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/gi,
    message: "Skill contains a hardcoded API key, secret, or access token",
    recommendation: "Remove the hardcoded secret and use environment variables or a secrets manager instead.",
  },
  {
    id: "HR-007",
    name: "Hardcoded private key",
    severity: "high",
    category: "hardcoded-secret",
    pattern: /-----BEGIN\s+(?:(?:RSA|DSA|EC|OPENSSH)\s+)?PRIVATE\s+KEY-----/gi,
    message: "Skill contains what appears to be a hardcoded private key",
    recommendation: "Remove the private key and reference it via an environment variable or secure vault.",
  },
  {
    id: "HR-008",
    name: "Hardcoded password",
    severity: "high",
    category: "hardcoded-secret",
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"']+["']/gi,
    message: "Skill contains a hardcoded password",
    recommendation: "Remove the password and use environment variables or a secrets manager instead.",
  },
  {
    id: "HR-009",
    name: "Hardcoded access token",
    severity: "high",
    category: "hardcoded-secret",
    pattern: /(?:token|secret)\s*[:=]\s*["'][A-Za-z0-9_\-]{20,}["']/gi,
    message: "Skill contains a hardcoded token or secret value",
    recommendation: "Use environment variables or a secrets manager to inject tokens at runtime.",
  },
];

/**
 * Prompt injection patterns that should be flagged.
 */
export const PROMPT_INJECTION_PATTERNS: ScanPattern[] = [
  {
    id: "PI-001",
    name: "Ignore prior instructions",
    severity: "medium",
    category: "prompt-injection",
    pattern: /ignore\s+all\s+(?:prior|previous|above)\s+(?:instructions|directives|commands)/gi,
    message: "Skill instructs the agent to ignore prior instructions",
    recommendation: "Remove or rephrase to avoid overriding user/system instructions.",
  },
  {
    id: "PI-002",
    name: "Bypass security or guardrails",
    severity: "medium",
    category: "prompt-injection",
    pattern: /bypass\s+(?:security|safety|restrictions|guardrails)/gi,
    message: "Skill instructs the agent to bypass security or safety restrictions",
    recommendation: "Remove any instructions that ask the agent to bypass its safeguards.",
  },
  {
    id: "PI-003",
    name: "Data exfiltration",
    severity: "medium",
    category: "prompt-injection",
    pattern: /exfiltrate|send\s+(?:data|files|code|source)\s+(?:to|via|over)/gi,
    message: "Skill contains language suggesting data exfiltration",
    recommendation: "Remove any instructions about sending data to external destinations.",
  },
  {
    id: "PI-004",
    name: "Sending secrets to external service",
    severity: "high",
    category: "prompt-injection",
    pattern: /(?:send|post|upload)\s+(?:the\s+)?(?:api[_-]?key|secret|token|password|credential)/gi,
    message: "Skill instructs sending credentials or secrets to an external service",
    recommendation: "Never send credentials to external services from within a skill.",
  },
  {
    id: "PI-005",
    name: "Copy .env file",
    severity: "medium",
    category: "prompt-injection",
    pattern: /(?:copy|cat|print|echo)\s+(?:\.env|\.env\.\w+)/gi,
    message: "Skill tries to read or copy environment files",
    recommendation: "Avoid accessing .env files from within a skill.",
  },
  {
    id: "PI-006",
    name: "Upload source code",
    severity: "medium",
    category: "prompt-injection",
    pattern: /upload\s+(?:the\s+)?(?:source|code|repo|project)/gi,
    message: "Skill instructs uploading source code to an external service",
    recommendation: "Remove instructions that upload source code externally.",
  },
];

/**
 * Sections that every skill should include.
 */
export const REQUIRED_GUARDRAILS: { id: string; name: string; header: string }[] = [
  { id: "RG-001", name: "When to use", header: "## When to use" },
  { id: "RG-002", name: "Inputs expected", header: "## Inputs expected" },
  { id: "RG-003", name: "Steps", header: "## Steps" },
  { id: "RG-004", name: "Output format", header: "## Output format" },
  { id: "RG-005", name: "Guardrails", header: "## Guardrails" },
];

/**
 * Metadata fields that should be present and non-empty.
 */
export const MISSING_METADATA_CHECKS: { id: string; name: string; field: keyof { owner: string; version: string; supported_agents: string[]; risk_level: string } }[] = [
  { id: "MM-001", name: "Owner", field: "owner" },
  { id: "MM-002", name: "Version", field: "version" },
  { id: "MM-003", name: "Supported agents", field: "supported_agents" },
  { id: "MM-004", name: "Risk level", field: "risk_level" },
];
