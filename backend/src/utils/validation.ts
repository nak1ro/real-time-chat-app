import { ValidationError } from '../middleware/errorMiddleware';

/**
 * Validation Result
 */
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Email Validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password Validation
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber;
};

/**
 * Name Validation
 * - Minimum 2 characters
 * - Maximum 50 characters
 * - Only letters, numbers, spaces, hyphens, and underscores
 */
export const isValidName = (name: string): boolean => {
  if (name.length < 2 || name.length > 50) return false;
  const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
  return nameRegex.test(name.trim());
};

/**
 * URL Validation
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate Registration Data
 */
export const validateRegistration = (data: {
  name: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate name (required)
  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  } else if (!isValidName(data.name)) {
    errors.name = 'Name must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and underscores';
  }

  // Validate email (optional but must be valid if provided)
  if (data.email !== undefined) {
    if (!data.email.trim()) {
      errors.email = 'Email cannot be empty if provided';
    } else if (!isValidEmail(data.email)) {
      errors.email = 'Invalid email format';
    }
  }

  // Validate password (optional but must be valid if provided)
  if (data.password !== undefined) {
    if (!data.password) {
      errors.password = 'Password cannot be empty if provided';
    } else if (!isValidPassword(data.password)) {
      errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
  }

  // Validate avatarUrl (optional)
  if (data.avatarUrl && !isValidUrl(data.avatarUrl)) {
    errors.avatarUrl = 'Invalid avatar URL format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate Login Data
 */
export const validateLogin = (data: {
  email: string;
  password: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.email || !data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!data.password || !data.password.trim()) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate and Throw on Error
 */
export const validateOrThrow = (
  validationFn: () => ValidationResult,
  customMessage?: string
): void => {
  const result = validationFn();
  if (!result.isValid) {
    throw new ValidationError(
      customMessage || 'Validation failed',
      result.errors
    );
  }
};

/**
 * Sanitize String Input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * Check if String is Empty or Whitespace
 */
export const isEmpty = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};


