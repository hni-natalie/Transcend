import { useState, useEffect } from 'react';
import { apiClient } from '@api/api.client';

interface PasswordRules {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

interface RequirementStatus {
  key: string;
  label: string;
  met: boolean;
}

export const usePasswordValidation = () => {
  const [rules, setRules] = useState<PasswordRules | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<{ success: boolean; rules: PasswordRules }>('/users/password-rules');
        if (response?.success && response?.rules) {
          setRules(response.rules);
          setErrors([]);
        } else {
          // Fallback to default rules if API fails
          setRules({
            minLength: 8,
            maxLength: 64,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
          });
        }
      } catch (error) {
        console.error('Failed to fetch password rules:', error);
        // Set default rules as fallback so it doesn't stay loading
        setRules({
          minLength: 8,
          maxLength: 64,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRules();
  }, []);

  const validatePassword = (password: string) => {
    if (!rules) {
      return { isValid: false, errors: ['Password rules not loaded'] };
    }

    const newErrors: string[] = [];

    if (password.length < rules.minLength) {
      newErrors.push(`At least ${rules.minLength} characters`);
    }
    if (password.length > rules.maxLength) {
      newErrors.push(`Less than ${rules.maxLength} characters`);
    }
    if (rules.requireUppercase && !/[A-Z]/.test(password)) {
      newErrors.push('At least one uppercase letter');
    }
    if (rules.requireLowercase && !/[a-z]/.test(password)) {
      newErrors.push('At least one lowercase letter');
    }
    if (rules.requireNumbers && !/\d/.test(password)) {
      newErrors.push('At least one number');
    }
    if (rules.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      newErrors.push('At least one special character');
    }

    setErrors(newErrors);
    setIsValid(newErrors.length === 0);
    return { isValid: newErrors.length === 0, errors: newErrors };
  };

  const getRequirements = (password: string): RequirementStatus[] => {
    if (!rules) {
      return [
        { key: 'loading', label: 'Loading rules...', met: false }
      ];
    }

    return [
      {
        key: 'minLength',
        label: `At least ${rules.minLength} characters`,
        met: password.length >= rules.minLength
      },
      {
        key: 'uppercase',
        label: 'At least one uppercase letter',
        met: /[A-Z]/.test(password)
      },
      {
        key: 'lowercase',
        label: 'At least one lowercase letter',
        met: /[a-z]/.test(password)
      },
      {
        key: 'number',
        label: 'At least one number',
        met: /\d/.test(password)
      },
      {
        key: 'special',
        label: 'At least one special character',
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      },
    ];
  };

  return {
    rules,
    errors,
    isValid,
    isLoading,
    validatePassword,
    getRequirements,
  };
};