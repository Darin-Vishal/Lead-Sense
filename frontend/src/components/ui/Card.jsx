import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ className, children, ...props }) {
    return (
        <div
            className={twMerge(
                'bg-[#1e293b] rounded-xl shadow-none border border-[#121212] p-6',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
