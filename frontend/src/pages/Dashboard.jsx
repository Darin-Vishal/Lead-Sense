import { useState, useEffect } from 'react';
import { QuickScorePanel } from '../components/dashboard/QuickScorePanel';
import { RecentLeadsPanel } from '../components/dashboard/RecentLeadsPanel';
import { SuperLeadsSection } from '../components/dashboard/SuperLeadsSection';
import { getLeads } from '../services/api';
import { Star, Menu } from 'lucide-react';

export default function Dashboard() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const data = await getLeads();
            setLeads(data);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    return (
        <div className="min-h-screen bg-[#0b1220] p-4 md:p-8 font-sans text-[#8A8A8A] flex justify-center">
            <div className="w-full max-w-6xl bg-[#131b2c] rounded-3xl shadow-none overflow-hidden min-h-[800px] flex flex-col border border-[#121212]">
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-6 border-b border-[#121212]">
                    <div className="flex items-center gap-3">
                        <Star className="h-6 w-6 text-indigo-500 fill-indigo-500" />
                        <h1 className="text-xl font-bold text-white tracking-tight">Elite Lead Qualifier</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-sm font-medium text-[#8A8A8A] cursor-pointer hover:text-white transition-colors">Dashboard</span>
                        <Menu className="h-5 w-5 text-[#8A8A8A] cursor-pointer hover:text-[#8A8A8A] transition-colors" />
                    </div>
                </header>

                <div className="p-8 flex-1 bg-[#0f1623]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Panel - Quick Score */}
                        <div className="lg:col-span-5">
                            <QuickScorePanel />
                        </div>

                        {/* Right Panel - Recent Leads */}
                        <div className="lg:col-span-7">
                            <RecentLeadsPanel
                                leads={leads}
                                loading={loading}
                                onRefresh={fetchLeads}
                            />
                        </div>
                    </div>

                    {/* Bottom Section - Super Leads */}
                    <SuperLeadsSection leads={leads} />
                </div>
            </div>
        </div>
    );
}
