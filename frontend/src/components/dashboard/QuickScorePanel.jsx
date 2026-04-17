import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { scoreEmail } from '../../services/api';
import { Loader2 } from 'lucide-react';

export function QuickScorePanel() {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleScore = async () => {
        if (!text.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const data = await scoreEmail(text);
            setResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-full flex flex-col border-0 shadow-none p-0">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Quick Score</h2>
            </div>

            <div className="flex-1 flex flex-col gap-6">
                <textarea
                    className="w-full h-[200px] p-4 rounded-xl border border-[#121212] bg-[#0f1623] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-base text-[#8A8A8A] placeholder:text-[#8A8A8A] shadow-none"
                    placeholder="Paste email content here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <Button
                    onClick={handleScore}
                    isLoading={loading}
                    disabled={!text.trim()}
                    className="w-full h-12 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 shadow-none shadow-blue-900/20 transition-all active:scale-[0.98] text-white"
                >
                    Score Email
                </Button>

                <div className="mt-4 grid grid-cols-2 gap-8">
                    <div>
                        <div className="text-sm font-medium text-[#8A8A8A] mb-1">Final Score</div>
                        <div className="text-5xl font-bold text-white tracking-tight">
                            {result ? result.final_score : '0'}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-[#8A8A8A] mb-1">Category</div>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            {result ? (
                                <span className={
                                    result.category?.toLowerCase() === 'super' ? 'text-emerald-400' :
                                        result.category?.toLowerCase() === 'good' ? 'text-blue-400' : 'text-[#8A8A8A]'
                                }>
                                    {result.category ? result.category.charAt(0).toUpperCase() + result.category.slice(1).toLowerCase() : '-'}
                                </span>
                            ) : '-'}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
