// Input validation utilities

/**
 * Agent ID format: bc_[alphanumeric characters]
 * Example: bc_abc123def456
 */
const AGENT_ID_PATTERN = /^bc_[a-zA-Z0-9]+$/;

/**
 * Maximum allowed length for prompts to prevent abuse
 */
export const MAX_PROMPT_LENGTH = 10000;

/**
 * Maximum allowed length for branch names
 */
export const MAX_BRANCH_NAME_LENGTH = 255;

/**
 * Validates an agent ID format
 * @param agentId - The agent ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidAgentId(agentId: string): boolean {
  return AGENT_ID_PATTERN.test(agentId);
}

/**
 * Validates and returns an agent ID, or throws an error
 * @param agentId - The agent ID to validate
 * @throws Error if the agent ID format is invalid
 */
export function validateAgentId(agentId: string | undefined): string {
  if (!agentId) {
    throw new Error('Agent ID is required');
  }

  if (!isValidAgentId(agentId)) {
    throw new Error(
      `Invalid agent ID format. Expected format: bc_[alphanumeric] (e.g., bc_abc123)`
    );
  }

  return agentId;
}

/**
 * Validates repository URL format
 * @param url - The repository URL to validate
 * @returns true if valid GitHub URL format
 */
export function isValidRepositoryUrl(url: string): boolean {
  // Accept both https://github.com/owner/repo and owner/repo formats
  const httpsPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
  const shortPattern = /^[\w.-]+\/[\w.-]+$/;
  return httpsPattern.test(url) || shortPattern.test(url);
}

/**
 * Validates and returns a repository URL, or throws an error
 * @param repository - The repository URL to validate
 * @throws Error if the repository format is invalid
 */
export function validateRepository(repository: string | undefined): string {
  if (!repository) {
    throw new Error('Repository is required');
  }

  if (!isValidRepositoryUrl(repository)) {
    throw new Error(
      'Invalid repository format. Use owner/repo or https://github.com/owner/repo'
    );
  }

  return repository;
}

/**
 * Validates and returns a prompt, or throws an error
 * @param prompt - The prompt to validate
 * @throws Error if the prompt is missing or too long
 */
export function validatePrompt(prompt: string | undefined): string {
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(
      `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`
    );
  }

  return prompt;
}

/**
 * Validates an optional branch name
 * @param branchName - The branch name to validate
 * @returns The validated branch name or undefined
 */
export function validateBranchName(branchName: string | undefined): string | undefined {
  if (!branchName) {
    return undefined;
  }

  if (branchName.length > MAX_BRANCH_NAME_LENGTH) {
    throw new Error(
      `Branch name exceeds maximum length of ${MAX_BRANCH_NAME_LENGTH} characters`
    );
  }

  // Basic branch name validation (no spaces, some special chars restricted)
  const branchPattern = /^[\w./-]+$/;
  if (!branchPattern.test(branchName)) {
    throw new Error(
      'Invalid branch name. Use only alphanumeric characters, dots, hyphens, and forward slashes.'
    );
  }

  return branchName;
}

/**
 * Validates the limit parameter for list operations
 * @param limit - The limit value to validate
 * @param max - Maximum allowed value (default 100)
 * @returns Validated limit value
 */
export function validateLimit(limit: number | undefined, max: number = 100): number {
  if (limit === undefined) return 10; // default
  if (limit < 1) return 1;
  if (limit > max) return max;
  return Math.floor(limit); // ensure integer
}
