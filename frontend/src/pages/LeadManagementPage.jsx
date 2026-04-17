import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, MessageSquare, ArrowLeft, RefreshCw, BarChart2, Inbox, TrendingUp, CheckCircle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const parseSender = (raw) => {
  if (!raw || typeof raw !== "string") {
    return { name: "Unknown", email: "" };
  }

  const match = raw.match(/(.*)<(.*)>/);
  if (match) {
    return {
      name: match[1]?.trim() || "Unknown",
      email: match[2]?.trim() || ""
    };
  }

  return {
    name: raw.split("@")[0] || "Unknown",
    email: raw
  };
};

const CustomStageDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStageChipStyle = (stage) => {
    switch(stage) {
      case "CONTACTED": return "bg-[#6366F1]/10 text-[#6366F1]";
      case "NEGOTIATING": return "bg-[#F59E0B]/10 text-[#F59E0B]";
      case "CLOSED": return "bg-[#10B981]/10 text-[#10B981]";
      default: return "bg-[#0A0A0A] text-[#8A8A8A]";
    }
  };

  const stages = [
    { id: "NEW", disabled: true },
    { id: "CONTACTED", disabled: true },
    { id: "NEGOTIATING", disabled: false },
    { id: "CLOSED", disabled: false },
  ];

  return (
    <div className="relative inline-block text-left w-36" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full border border-[#1F1F2E] cursor-pointer transition-all duration-200 group text-[10px] font-bold tracking-wider uppercase hover:opacity-90 ${getStageChipStyle(value)}`}
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-current"></span>
          {value}
        </span>
        <ChevronDown className="w-3 h-3 text-[#8A8A8A] group-hover:text-white transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#050505] border border-[#121212] rounded-lg shadow-xl shadow-black overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <ul className="py-1">
            {stages.map((stage) => (
              <li key={stage.id}>
                <button
                  onClick={() => { if(!stage.disabled) { onChange(stage.id); setIsOpen(false); } }}
                  disabled={stage.disabled}
                  className={`w-full text-left px-3 py-2 text-[10px] font-bold tracking-wider uppercase flex items-center transition-all duration-200 ${stage.disabled ? 'opacity-40 cursor-not-allowed ' + getStageChipStyle(stage.id) : getStageChipStyle(stage.id) + ' hover:opacity-80'}`}
                >
                  <span className="w-2 h-2 rounded-full mr-2 bg-current"></span>
                  {stage.id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const getCategoryTextColor = (value) => {
  switch(value) {
    case "SUPER": return "text-[#22C55E]";
    case "GOOD": return "text-[#3B82F6]";
    case "BAD": return "text-[#EF4444]";
    default: return "text-white";
  }
};

const getStageFilterColor = (value) => {
  switch(value) {
    case "CONTACTED": return "text-[#6366F1]";
    case "NEGOTIATING": return "text-[#F59E0B]";
    case "CLOSED": return "text-[#10B981]";
    case "NEW": return "text-[#8A8A8A]";
    default: return "text-[#8A8A8A]";
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'SUPER': return 'text-[#22C55E] border-[#22C55E]/20 bg-[#22C55E]/10';
    case 'GOOD': return 'text-[#3B82F6] border-[#3B82F6]/20 bg-[#3B82F6]/10';
    case 'BAD': return 'text-[#EF4444] border-[#EF4444]/20 bg-[#EF4444]/10';
    default: return 'text-[#8A8A8A] border-[#8A8A8A]/20 bg-[#8A8A8A]/10';
  }
};

export default function LeadManagementPage({ leads, onBack, onReply, onUpdateStage, onSync, isSyncing, syncMessage }) {
  console.log("Pipeline Leads:", leads);
  const safeLeads = Array.isArray(leads) ? leads : [];

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('LATEST'); // LATEST or SCORE
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Stats derivation
  const stats = useMemo(() => {
    let newCount = 0;
    let contactedCount = 0;
    let negotiatingCount = 0;
    let closedCount = 0;

    safeLeads.forEach(l => {
      if (!l) return;
      const s = l?.stage || 'NEW';
      if (s === 'NEW') newCount++;
      if (s === 'CONTACTED') contactedCount++;
      if (s === 'NEGOTIATING') negotiatingCount++;
      if (s === 'CLOSED') closedCount++;
    });

    return { total: safeLeads.length, new: newCount, contacted: contactedCount, negotiating: negotiatingCount, closed: closedCount };
  }, [safeLeads]);

  // Filter derivation
  const displayLeads = useMemo(() => {
    let res = safeLeads.filter(l => {
      if (!l) return false;
      const targetStage = l?.stage || 'NEW';
      const targetCat = l?.category || 'BAD';
      
      const matchSearch = (l?.sender || "").toLowerCase().includes(search.toLowerCase()) || 
                          (l?.subject || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'ALL' || targetCat === catFilter;
      const matchStage = stageFilter === 'ALL' || targetStage === stageFilter;

      return matchSearch && matchCat && matchStage;
    });

    if (sortOrder === 'LATEST') {
      res = res.sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));
    } else {
      res = res.sort((a, b) => (b?.final_score || 0) - (a?.final_score || 0));
    }
    
    return res;
  }, [safeLeads, search, catFilter, stageFilter, sortOrder]);

  const totalPages = Math.ceil(displayLeads.length / itemsPerPage);
  const currentChunk = displayLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <div className="animate-in fade-in space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#121212] pb-4">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
          <BarChart2 className="w-8 h-8 text-indigo-400" /> Pipeline Management
        </h2>
        <div className="flex items-center gap-3">
          {syncMessage && <span className="text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded">{syncMessage}</span>}
          <button 
            onClick={onSync} disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors font-semibold border border-indigo-500/30 shadow-none disabled:opacity-50 text-sm"
          >
             <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'Syncing...' : 'Sync Emails'}
          </button>
          <button 
            onClick={onBack}
            className="text-sm font-semibold flex items-center gap-1.5 px-4 py-2 bg-[#0A0A0A] hover:bg-[#0A0A0A] text-[#8A8A8A] rounded-xl transition-colors shadow-none"
          >
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
          </button>
        </div>
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4 flex flex-col justify-center shadow-none border-t-2 border-[#121212]">
           <div className="text-[#8A8A8A] text-xs font-bold uppercase tracking-wider mb-1">Total Leads</div>
           <div className="text-3xl font-black text-white">{stats.total}</div>
        </div>
        <div className="glass-panel p-4 flex flex-col justify-center shadow-none border-t-2 border-[#121212]">
           <div className="text-[#8A8A8A] text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Inbox className="w-3 h-3"/> NEW</div>
           <div className="text-3xl font-black text-[#8A8A8A]">{stats.new}</div>
        </div>
        <div className="glass-panel p-4 flex flex-col justify-center shadow-none border-t-2 border-blue-500">
           <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3"/> CONTACTED</div>
           <div className="text-3xl font-black text-white">{stats.contacted}</div>
        </div>
        <div className="glass-panel p-4 flex flex-col justify-center shadow-none border-t-2 border-orange-500">
           <div className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> NEGOTIATING</div>
           <div className="text-3xl font-black text-white">{stats.negotiating}</div>
        </div>
        <div className="glass-panel p-4 flex flex-col justify-center shadow-none border-t-2 border-emerald-500">
           <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> CLOSED</div>
           <div className="text-3xl font-black text-white">{stats.closed}</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
          <input 
            type="text" 
            placeholder="Search leads by sender or subject..."
            className="pl-10 pr-4 py-2 bg-[#050505] border border-[#121212] rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm w-full"
            value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}}
          />
        </div>
        <div className="flex flex-wrap gap-3">
           <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8A8A]" />
             <select 
               className={`appearance-none pl-9 pr-8 py-2 bg-[#050505] border border-[#121212] rounded-xl outline-none text-sm font-medium cursor-pointer ${getCategoryTextColor(catFilter)}`}
               value={catFilter} onChange={(e) => {setCatFilter(e.target.value); setCurrentPage(1);}}
             >
                <option value="ALL" className="bg-black text-white">All Categories</option>
                <option value="SUPER" className="bg-black text-[#22C55E]">SUPER</option>
                <option value="GOOD" className="bg-black text-[#3B82F6]">GOOD</option>
                <option value="BAD" className="bg-black text-[#EF4444]">BAD</option>
             </select>
           </div>
           <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A8A8A]" />
             <select 
               className={`appearance-none pl-9 pr-8 py-2 bg-[#050505] border border-[#121212] rounded-xl outline-none text-sm font-medium cursor-pointer ${getStageFilterColor(stageFilter)}`}
               value={stageFilter} onChange={(e) => {setStageFilter(e.target.value); setCurrentPage(1);}}
             >
                <option value="ALL" className="bg-black text-white">All Stages</option>
                <option value="NEW" className="bg-black text-[#8A8A8A]">NEW</option>
                <option value="CONTACTED" className="bg-black text-[#6366F1]">CONTACTED</option>
                <option value="NEGOTIATING" className="bg-black text-[#F59E0B]">NEGOTIATING</option>
                <option value="CLOSED" className="bg-black text-[#10B981]">CLOSED</option>
             </select>
           </div>
           <select 
               className="appearance-none px-4 py-2 bg-[#050505] border border-[#121212] rounded-xl outline-none text-sm text-[#8A8A8A] font-medium cursor-pointer"
               value={sortOrder} onChange={(e) => {setSortOrder(e.target.value); setCurrentPage(1);}}
           >
              <option value="LATEST">Sort: Latest</option>
              <option value="SCORE">Sort: Highest Score</option>
           </select>
        </div>
      </div>

      {/* Main Table Layer */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
             <thead className="bg-[#050505] border-b border-[#121212] text-[#8A8A8A]">
               <tr>
                 <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Lead Target</th>
                 <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Score</th>
                 <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Category</th>
                 <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Pipeline Stage</th>
                 <th className="px-6 py-4 font-bold text-center uppercase text-xs tracking-wider">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[#121212]">
               {Array.isArray(currentChunk) && currentChunk.map(lead => {
                 if (!lead) return null;
                 const currentStage = lead?.stage || 'NEW';
                 const currentCategory = lead?.category || 'BAD';
                 const currentScore = lead?.final_score || 0;
                 const senderInfo = parseSender(lead?.sender || '');
                 return (
                   <tr key={lead?.id || Math.random()} className="hover:bg-[#0A0A0A] transition-colors group">
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="min-w-[32px] w-8 h-8 rounded-full bg-[#0A0A0A] border border-[#121212] flex items-center justify-center text-sm font-bold text-white uppercase shadow-none">
                           {senderInfo.name ? senderInfo.name[0] : "?"}
                         </div>
                         <div className="flex flex-col">
                           <span className="text-white font-medium">{senderInfo.name}</span>
                           <span className="text-[#8A8A8A] text-xs">{senderInfo.email}</span>
                           <span className="text-[#8A8A8A] text-[10px] truncate max-w-[200px] mt-0.5 opacity-60" title={lead?.subject}>Subject: {lead?.subject || 'None'}</span>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`font-black text-lg ${currentCategory === 'SUPER' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-white'}`}>
                         {currentScore}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border text-center inline-block min-w-[70px] uppercase tracking-wider ${getCategoryColor(currentCategory)}`}>
                         {currentCategory}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                        <CustomStageDropdown 
                          value={currentStage} 
                          onChange={(newStage) => onUpdateStage(lead?.id, newStage)} 
                        />
                     </td>
                     <td className="px-6 py-4 text-right">
                       <div className="flex justify-center items-center">
                         <button 
                           onClick={() => onReply(lead)} 
                           className="text-[#8A8A8A] hover:text-white transition-colors bg-indigo-600/10 hover:bg-indigo-600 px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 border border-indigo-500/20 hover:border-indigo-500 shadow-none"
                         >
                           <MessageSquare className="w-3.5 h-3.5" /> Reply
                         </button>
                       </div>
                     </td>
                   </tr>
                 );
               })}
               {currentChunk.length === 0 && (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-[#8A8A8A] font-medium text-lg">
                     No leads match the active pipeline filters.
                   </td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6 text-sm font-medium text-[#8A8A8A]">
           <button onClick={prevPage} disabled={currentPage === 1} className="p-2 bg-[#0A0A0A] disabled:opacity-30 rounded hover:bg-[#0A0A0A] transition">
             <ChevronLeft className="w-4 h-4"/>
           </button>
           <span className="bg-[#050505] border border-[#121212] px-4 py-1.5 rounded-xl shadow-none">
             Page <strong className="text-white">{currentPage}</strong> of {totalPages}
           </span>
           <button onClick={nextPage} disabled={currentPage === totalPages} className="p-2 bg-[#0A0A0A] disabled:opacity-30 rounded hover:bg-[#0A0A0A] transition">
             <ChevronRight className="w-4 h-4"/>
           </button>
        </div>
      )}

    </div>
  );
}
