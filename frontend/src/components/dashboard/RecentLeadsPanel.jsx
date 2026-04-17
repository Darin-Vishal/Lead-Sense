import { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { processEmails, getReplyUrl } from '../../services/api';
import { RefreshCw, ChevronRight, Reply } from 'lucide-react';

export function RecentLeadsPanel({ leads, loading, onRefresh }) {
    const [selectedLead, setSelectedLead] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleReply = async (e, lead) => {
        e.stopPropagation();
        try {
            if (lead.rfc_message_id) {
                const messageId = encodeURIComponent(lead.rfc_message_id);
                const gmailUrl = `https://mail.google.com/mail/#search/rfc822msgid:${messageId}`;
                const finalUrl = `https://accounts.google.com/AccountChooser?Email=obsidiancorpofficial@gmail.com&continue=${encodeURIComponent(gmailUrl)}`;
                window.open(finalUrl, '_blank');
            } else {
                const fallbackUrl = await getReplyUrl(lead.id || lead.email_id);
                const finalUrl = `https://accounts.google.com/AccountChooser?Email=obsidiancorpofficial@gmail.com&continue=${encodeURIComponent(fallbackUrl)}`;
                window.open(finalUrl, '_blank');
            }
        } catch (err) {
            console.error("Failed to get reply URL", err);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // 1. Trigger sync
            const response = await fetch('http://localhost:8000/api/process-emails', { method: 'POST' });
            if (!response.ok) throw new Error('Sync failed to start');

            // 2. Poll for status
            await new Promise(r => setTimeout(r, 2000));

            let retries = 5;
            while (retries > 0) {
                if (onRefresh) {
                    await onRefresh();
                }
                await new Promise(r => setTimeout(r, 3000));
                retries--;
            }
        } catch (e) {
            console.error("Sync error:", e);
        } finally {
            setIsSyncing(false);
            if (onRefresh) onRefresh();
        }
    };

    return (
        <Card className="h-full flex flex-col border-0 shadow-none p-0">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white">Recent Leads</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Emails'}
                    </button>
                </div>
            </div>

            <div className="flex-1 space-y-6 mb-8">
                {leads.slice(0, 4).map((lead, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-6 group cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                    >
                        <div className="w-12 text-4xl font-light text-white tabular-nums">
                            {lead.final_score}
                        <Badge variant={lead.category} className="w-16 justify-center uppercase text-[10px] tracking-wider font-bold py-1.5 rounded-md">
                            {lead.category}
                        </Badge>
                            <div className="col-span-3">
                                <p className="text-base text-[#8A8A8A] truncate font-medium">
                                    {lead.raw_text ? lead.raw_text.substring(0, 20) : "No content"}...
                                </p>
                                <div className="h-1.5 w-20 bg-[#0A0A0A] rounded-full mt-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${lead.category === 'super' ? 'bg-emerald-400' :
                                            lead.category === 'good' ? 'bg-blue-400' : 'bg-[#0A0A0A]'
                                            }`}
                                        style={{ width: `${lead.final_score}%` }}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 text-xs text-[#8A8A8A]">
                                <div className="uppercase tracking-wider text-[10px] mb-1">NLP Raw</div>
                                <div className="font-mono text-[#8A8A8A]">
                                    {lead.nlp_raw !== null ? lead.nlp_raw : <span className="text-amber-500" title="NLP Unavailable">—</span>}
                                </div>
                            </div>
                            <div className="col-span-2 text-xs text-[#8A8A8A]">
                                <div className="uppercase tracking-wider text-[10px] mb-1">NLP Part</div>
                                <div className="font-mono text-[#8A8A8A]">{lead.nlp_part}</div>
                            </div>
                            <div className="col-span-2 text-xs text-[#8A8A8A]">
                                <div className="uppercase tracking-wider text-[10px] mb-1">ML Part</div>
                                <div className="font-mono text-[#8A8A8A]">{lead.ml_part}</div>
                            </div>

                            <div className="col-span-3 flex justify-end items-center gap-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${lead.is_replied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-[#0A0A0A] text-[#8A8A8A] border border-[#121212]"}`}>
                                    {lead.is_replied ? "Replied" : "Pending"}
                                </span>
                                <button
                                    onClick={(e) => handleReply(e, lead)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#0A0A0A] text-[#8A8A8A] rounded-md transition-colors text-xs font-medium border border-[#121212]"
                                >
                                    <Reply className="h-3 w-3" />
                                    Reply
                                </button>
                            </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-[#8A8A8A] group-hover:text-[#8A8A8A] transition-colors" />
                    </div>
                ))}
            </div>

            <Modal
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                title="Lead Details"
            >
                {selectedLead && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-[#0f1623] rounded-lg border border-[#121212]">
                            <div>
                                <div className="text-sm text-[#8A8A8A]">Category</div>
                                <Badge variant={selectedLead.category} className="mt-1">
                                    {selectedLead.category.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-[#8A8A8A]">Final Score</div>
                                <div className="text-3xl font-bold text-white">{selectedLead.final_score}</div>
                                <div className="text-xs text-[#8A8A8A] mt-1">
                                    NLP: {selectedLead.nlp_part} + ML: {selectedLead.ml_part}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-white mb-2">Email Content</h4>
                            <div className="p-4 bg-[#0f1623] rounded-lg text-sm text-[#8A8A8A] whitespace-pre-wrap leading-relaxed border border-[#121212]">
                                {selectedLead.raw_text || selectedLead.text}
                            </div>
                            {selectedLead.nlp_raw === null && (
                                <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-100 flex items-center gap-2">
                                    <span>⚠️</span>
                                    NLP unavailable — using ML-only scores
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </Card>
    );
}
