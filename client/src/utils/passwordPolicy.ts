import { PasswordStrengthResult } from '@/types/auth';

const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPatterns: ['123', 'abc', 'qwerty', 'password', '111', '000'],
};

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`
    );
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (
    PASSWORD_REQUIREMENTS.requireSpecialChars &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  for (const pattern of PASSWORD_REQUIREMENTS.forbiddenPatterns) {
    if (password.toLowerCase().includes(pattern)) {
      errors.push(`Password cannot contain common sequences like "${pattern}"`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function calculatePasswordStrength(
  password: string
): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  // Deduct for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeating characters');
  }

  // Deduct for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(
    password
  )) {
    score -= 10;
    feedback.push('Avoid sequential characters');
  }

  // Ensure minimum score
  score = Math.max(0, Math.min(100, score));

  let strengthLevel: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 40) {
    strengthLevel = 'weak';
    if (!feedback.includes('Password is too weak')) {
      feedback.push('Password is too weak');
    }
  } else if (score < 60) {
    strengthLevel = 'fair';
    if (!feedback.includes('Password could be stronger')) {
      feedback.push('Password could be stronger');
    }
  } else if (score < 80) {
    strengthLevel = 'good';
    if (!feedback.length) {
      feedback.push('Good password strength');
    }
  } else {
    strengthLevel = 'strong';
    if (!feedback.length) {
      feedback.push('Excellent password strength');
    }
  }

  return {
    score: strengthLevel,
    percentage: score,
    feedback,
  };
}
