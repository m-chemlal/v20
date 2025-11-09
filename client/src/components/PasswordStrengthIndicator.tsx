import { useMemo } from 'react';
import { calculatePasswordStrength } from '@/utils/passwordPolicy';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showFeedback?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  showFeedback = true,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    return calculatePasswordStrength(password);
  }, [password]);

  const getStrengthColor = () => {
    switch (strength.score) {
      case 'weak':
        return 'bg-red-500';
      case 'fair':
        return 'bg-amber-500';
      case 'good':
        return 'bg-blue-500';
      case 'strong':
        return 'bg-emerald-500';
    }
  };

  const getStrengthTextColor = () => {
    switch (strength.score) {
      case 'weak':
        return 'text-red-600';
      case 'fair':
        return 'text-amber-600';
      case 'good':
        return 'text-blue-600';
      case 'strong':
        return 'text-emerald-600';
    }
  };

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Password Strength
        </label>
        <span className={`text-sm font-semibold ${getStrengthTextColor()}`}>
          {strength.score.charAt(0).toUpperCase() + strength.score.slice(1)}
        </span>
      </div>

      {/* Strength bar */}
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${getStrengthColor()} transition-all duration-300`}
          style={{ width: `${strength.percentage}%` }}
        />
      </div>

      {/* Feedback */}
      {showFeedback && strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <div key={index} className="flex items-start gap-2">
              {strength.score === 'strong' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-xs text-muted-foreground">{feedback}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
