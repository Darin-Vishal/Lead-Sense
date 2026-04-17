import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({ variant = 'default', className, children }) {
    const variants = {
        default: 'bg-[#0A0A0A] text-[#8A8A8A]',
        super: 'bg-emerald-500 text-white border-transparent', // Green for Super
        good: 'bg-blue-500 text-white border-transparent',    // Blue for Good
        bad: 'bg-[#0A0A0A] text-[#8A8A8A] border-transparent', // Gray for Bad (as per image)
        // bad: 'bg-blue-500 text-white border-transparent', // Image shows "Bad" as Blue in one place? No, wait.
        // Looking at image:
        // 91 Super -> Green bg, White text
        // 77 Good -> Blue bg, White text
        // 64 Bad -> Blue bg, White text (Wait, 64 Bad is Blue? 38 Bad is Gray?)
        // Let's look closer at the image.
        // 91 Super [Green]
        // 77 Good [Blue]
        // 64 Bad [Blue] - This might be a mistake in the mockup or "Bad" is also blue?
        // 38 Bad [Gray] - This looks like "Bad"
        // Let's stick to semantic colors but match the style.
        // Super -> Emerald/Green
        // Good -> Blue
        // Bad -> Gray/Slate (or maybe Red if we want to be semantic, but image shows Gray for 38)
    };

    // Refined variants based on image analysis
    const refinedVariants = {
        default: 'bg-[#0A0A0A] text-[#8A8A8A]',
        super: 'bg-emerald-500 text-white',
        good: 'bg-blue-500 text-white',
        bad: 'bg-blue-500 text-white', // The image shows 64 Bad as Blue. Let's make Bad Blue for now to match 64, or maybe Gray for 38.
        // Actually, 38 Bad is Gray. 64 Bad is Blue. Maybe 40-60 is "Bad" but Blue?
        // Let's stick to a safe semantic mapping that looks good.
        // Super -> Emerald-500
        // Good -> Blue-500
        // Bad -> Slate-200 text-[#8A8A8A] (like the 38)
    };

    // Final decision:
    // Super: Emerald-500 (White text)
    // Good: Blue-500 (White text)
    // Bad: Blue-500 (White text) OR Slate-200.
    // The user said "Bad Lead (score < 40)".
    // In image: 64 is Bad? Wait, 64 should be Good (>40).
    // Ah, the image might have dummy data.
    // 91 -> Super
    // 77 -> Good
    // 64 -> Bad (Label says Bad, Color is Blue).
    // 38 -> Bad (Label says Bad, Color is Gray).
    // I will use:
    // Super: Emerald-500
    // Good: Blue-500
    // Bad: Slate-200 text-[#8A8A8A] (The gray one looks cleaner for low scores)

    const finalVariants = {
        default: 'bg-[#0A0A0A] text-[#8A8A8A] border-[#121212]',
        super: 'text-[#22C55E] bg-[#22C55E]/10',
        good: 'text-[#3B82F6] bg-[#3B82F6]/10',
        bad: 'text-[#EF4444] bg-[#EF4444]/10',
        contacted: 'text-[#6366F1] bg-[#6366F1]/10',
        negotiating: 'text-[#F59E0B] bg-[#F59E0B]/10',
        closed: 'text-[#10B981] bg-[#10B981]/10',
    };

    return (
        <span
            className={twMerge(
                'inline-flex items-center px-3 py-1 rounded-md text-sm font-medium',
                finalVariants[variant],
                className
            )}
        >
            {children}
        </span>
    );
}
