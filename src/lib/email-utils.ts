export interface EmailCredential {
  email: string;
  password: string;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an email address using a comprehensive regex pattern
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Validates multiple email addresses and returns valid ones
 */
export function validateEmails(emails: string[]): {
  valid: string[];
  invalid: Array<{ email: string; error: string }>;
} {
  const valid: string[] = [];
  const invalid: Array<{ email: string; error: string }> = [];

  emails.forEach(email => {
    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      const validation = validateEmail(trimmedEmail);
      if (validation.isValid) {
        if (!valid.includes(trimmedEmail)) {
          valid.push(trimmedEmail);
        }
      } else {
        invalid.push({ email: trimmedEmail, error: validation.error || 'Invalid email' });
      }
    }
  });

  return { valid, invalid };
}

/**
 * Sanitizes email content to prevent injection attacks
 */
export function sanitizeEmailContent(content: string): string {
  return content
    .replace(/[<>]/g, '') // Remove potential HTML tags for text emails
    .trim();
}

/**
 * Sanitizes HTML email content while preserving basic HTML tags
 */
export function sanitizeHtmlContent(content: string): string {
  // Basic HTML sanitization - in production, consider using a library like DOMPurify
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Creates a plain text version from HTML content
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Generates a random delay between email sends to avoid being flagged as spam
 */
export function getRandomDelay(min: number = 1000, max: number = 3000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Formats email statistics for display
 */
export function formatEmailStats(sent: number, failed: number): string {
  const total = sent + failed;
  if (total === 0) return 'No emails processed';
  
  const successRate = ((sent / total) * 100).toFixed(1);
  return `${sent}/${total} sent successfully (${successRate}% success rate)`;
}
