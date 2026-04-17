import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function Button({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    disabled,
    ...props
}) {
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-none',
        secondary: 'bg-[#0A0A0A] text-white hover:bg-[#0A0A0A]',
        ghost: 'bg-transparent text-[#8A8A8A] hover:bg-[#0A0A0A] hover:text-white',
        outline: 'bg-transparent border border-[#121212] text-[#8A8A8A] hover:bg-[#0A0A0A]',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={twMerge(
                'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
