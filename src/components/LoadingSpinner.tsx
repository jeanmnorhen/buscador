import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <Loader2
      style={{ width: size, height: size }}
      className={cn('animate-spin text-primary', className)}
      aria-label="Loading"
    />
  );
}

// Helper cn function if not globally available (it is in this project via lib/utils)
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
