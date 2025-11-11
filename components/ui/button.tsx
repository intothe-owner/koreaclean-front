// components/ui/button.tsx
import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export const Button = ({ className, children, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className={clsx(
        'px-4 py-2 rounded text-sm font-medium transition-colors duration-200',
        className
      )}
    >
      {children}
    </button>
  );
};
