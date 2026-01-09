import { describe, it, expect } from 'vitest';
import {
  isValidAgentId,
  validateAgentId,
  isValidRepositoryUrl,
  validateRepository,
  validateLimit,
  validatePrompt,
  validateBranchName,
  MAX_PROMPT_LENGTH,
  MAX_BRANCH_NAME_LENGTH,
} from './validation';

describe('isValidAgentId', () => {
  it('should return true for valid agent IDs', () => {
    expect(isValidAgentId('bc_abc123')).toBe(true);
    expect(isValidAgentId('bc_ABC123def456')).toBe(true);
    expect(isValidAgentId('bc_a')).toBe(true);
    expect(isValidAgentId('bc_123')).toBe(true);
  });

  it('should return false for invalid agent IDs', () => {
    expect(isValidAgentId('')).toBe(false);
    expect(isValidAgentId('abc123')).toBe(false);
    expect(isValidAgentId('bc_')).toBe(false);
    expect(isValidAgentId('bc_abc-123')).toBe(false);
    expect(isValidAgentId('bc_abc_123')).toBe(false);
    expect(isValidAgentId('BC_abc123')).toBe(false);
    expect(isValidAgentId(' bc_abc123')).toBe(false);
    expect(isValidAgentId('bc_abc123 ')).toBe(false);
  });
});

describe('validateAgentId', () => {
  it('should return the agent ID if valid', () => {
    expect(validateAgentId('bc_abc123')).toBe('bc_abc123');
  });

  it('should throw an error if agent ID is undefined', () => {
    expect(() => validateAgentId(undefined)).toThrow('Agent ID is required');
  });

  it('should throw an error if agent ID format is invalid', () => {
    expect(() => validateAgentId('invalid')).toThrow('Invalid agent ID format');
    expect(() => validateAgentId('bc_')).toThrow('Invalid agent ID format');
  });
});

describe('isValidRepositoryUrl', () => {
  it('should return true for valid GitHub URLs', () => {
    expect(isValidRepositoryUrl('https://github.com/owner/repo')).toBe(true);
    expect(isValidRepositoryUrl('https://github.com/my-org/my-repo')).toBe(true);
    expect(isValidRepositoryUrl('https://github.com/user123/project.js')).toBe(true);
  });

  it('should return true for short format (owner/repo)', () => {
    expect(isValidRepositoryUrl('owner/repo')).toBe(true);
    expect(isValidRepositoryUrl('my-org/my-repo')).toBe(true);
    expect(isValidRepositoryUrl('user123/project.js')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(isValidRepositoryUrl('')).toBe(false);
    expect(isValidRepositoryUrl('https://gitlab.com/owner/repo')).toBe(false);
    expect(isValidRepositoryUrl('https://github.com/owner')).toBe(false);
    expect(isValidRepositoryUrl('owner')).toBe(false);
    expect(isValidRepositoryUrl('http://github.com/owner/repo')).toBe(false);
  });
});

describe('validateLimit', () => {
  it('should return default value when undefined', () => {
    expect(validateLimit(undefined)).toBe(10);
  });

  it('should return the value when within range', () => {
    expect(validateLimit(1)).toBe(1);
    expect(validateLimit(50)).toBe(50);
    expect(validateLimit(100)).toBe(100);
  });

  it('should clamp values below minimum to 1', () => {
    expect(validateLimit(0)).toBe(1);
    expect(validateLimit(-5)).toBe(1);
  });

  it('should clamp values above maximum to max', () => {
    expect(validateLimit(150)).toBe(100);
    expect(validateLimit(1000)).toBe(100);
  });

  it('should respect custom max value', () => {
    expect(validateLimit(50, 25)).toBe(25);
    expect(validateLimit(20, 25)).toBe(20);
  });

  it('should floor decimal values', () => {
    expect(validateLimit(5.7)).toBe(5);
    expect(validateLimit(10.1)).toBe(10);
  });
});

describe('validateRepository', () => {
  it('should return the repository if valid', () => {
    expect(validateRepository('owner/repo')).toBe('owner/repo');
    expect(validateRepository('https://github.com/owner/repo')).toBe(
      'https://github.com/owner/repo'
    );
  });

  it('should throw an error if repository is undefined', () => {
    expect(() => validateRepository(undefined)).toThrow('Repository is required');
  });

  it('should throw an error if repository format is invalid', () => {
    expect(() => validateRepository('invalid')).toThrow('Invalid repository format');
    expect(() => validateRepository('https://gitlab.com/owner/repo')).toThrow(
      'Invalid repository format'
    );
  });
});

describe('validatePrompt', () => {
  it('should return the prompt if valid', () => {
    expect(validatePrompt('Fix the bug')).toBe('Fix the bug');
  });

  it('should throw an error if prompt is undefined', () => {
    expect(() => validatePrompt(undefined)).toThrow('Prompt is required');
  });

  it('should throw an error if prompt is empty', () => {
    expect(() => validatePrompt('')).toThrow('Prompt is required');
  });

  it('should throw an error if prompt exceeds max length', () => {
    const longPrompt = 'a'.repeat(MAX_PROMPT_LENGTH + 1);
    expect(() => validatePrompt(longPrompt)).toThrow('exceeds maximum length');
  });

  it('should accept prompts at exactly max length', () => {
    const maxPrompt = 'a'.repeat(MAX_PROMPT_LENGTH);
    expect(validatePrompt(maxPrompt)).toBe(maxPrompt);
  });
});

describe('validateBranchName', () => {
  it('should return undefined for undefined input', () => {
    expect(validateBranchName(undefined)).toBeUndefined();
  });

  it('should return valid branch names', () => {
    expect(validateBranchName('feature/new-feature')).toBe('feature/new-feature');
    expect(validateBranchName('fix-123')).toBe('fix-123');
    expect(validateBranchName('release/v1.0.0')).toBe('release/v1.0.0');
  });

  it('should throw an error for branch names exceeding max length', () => {
    const longBranch = 'a'.repeat(MAX_BRANCH_NAME_LENGTH + 1);
    expect(() => validateBranchName(longBranch)).toThrow('exceeds maximum length');
  });

  it('should throw an error for invalid branch name characters', () => {
    expect(() => validateBranchName('branch name')).toThrow('Invalid branch name');
    expect(() => validateBranchName('branch@name')).toThrow('Invalid branch name');
    expect(() => validateBranchName('branch:name')).toThrow('Invalid branch name');
  });
});
