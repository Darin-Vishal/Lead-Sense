import { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Trophy } from 'lucide-react';

export function SuperLeadsSection({ leads }) {
    const [selectedLead, setSelectedLead] = useState(null);
    const superLeads = leads.filter(l => l.final_score > 80);

    if (superLeads.length === 0) return null;

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Super Leads</h2>
                <div className="p-2 bg-[#1e293b] rounded-lg border border-[#121212]">
                    <div className="h-1 w-6 bg-[#0A0A0A] rounded-full mb-1"></div>
                    <div className="h-1 w-4 bg-[#0A0A0A] rounded-full"></div>
                </div>
            </div>

            <div className="space-y-4">
                {superLeads.map((lead, index) => (
                    <Card
                        key={index}
                        className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 border border-[#121212] shadow-none hover:shadow-none transition-all bg-[#1e293b]"
                    >
                        <div className="flex items-center gap-4 min-w-[120px]">
                            <div className="text-5xl font-bold text-white tabular-nums">{lead.final_score}</div>
                            <Badge variant="super" className="uppercase tracking-wider font-bold text-xs py-1.5 px-3">
                                Super
                            </Badge>
                        </div>

                        <div className="flex-1 min-w-0 w-full">
                            <p className="text-base text-[#8A8A8A] font-medium truncate mb-3">
                                {lead.raw_text ? lead.raw_text.substring(0, 60) : "No content"}...
                            </p>
                            {/* Progress bars visual from image */}
                            <div className="space-y-1.5 max-w-md">
                                <div className="h-1.5 w-full bg-[#0A0A0A] rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: '90%' }}></div>
                                </div>
                                <div className="h-1.5 w-2/3 bg-[#0A0A0A] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#0A0A0A] rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setSelectedLead(lead)}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-lg shadow-none shadow-blue-900/20"
                        >
                            View Full Email
                        </Button>
                    </Card>
                ))}
            </div>

            <Modal
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                title="Super Lead Details"
            >
                {selectedLead && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-emerald-900/20 rounded-lg border border-emerald-500/20">
                            <div>
                                <div className="text-sm text-emerald-400/70">Category</div>
                                <Badge variant="super" className="mt-1">SUPER</Badge>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-emerald-400/70">Final Score</div>
                                <div className="text-3xl font-bold text-emerald-400">{selectedLead.final_score}</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-white mb-2">Email Content</h4>
                            <div className="p-4 bg-[#0f1623] rounded-lg text-sm text-[#8A8A8A] whitespace-pre-wrap leading-relaxed border border-[#121212] shadow-none">
                                {selectedLead.raw_text || selectedLead.text}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
