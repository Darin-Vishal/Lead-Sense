import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Mail, TrendingUp, Users, Award, Star, ChevronRight, MessageSquare, Send, Bot, X, ArrowRight, Target, Zap, RefreshCw, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { getLeads, scoreEmail, processEmails, sendReply, getReplyUrl, updateLeadStage } from './services/api';
import LeadManagementPage from './pages/LeadManagementPage';

const getCategoryColor = (category) => {
  switch (category) {
    case 'SUPER': return 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20';
    case 'GOOD': return 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20';
    case 'BAD': return 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20';
    default: return 'text-[#8A8A8A] bg-[#8A8A8A]/10 border-[#8A8A8A]/20';
  }
};

const getCategoryTextColor = (value) => {
  switch(value) {
    case "SUPER": return "text-[#22C55E]";
    case "GOOD": return "text-[#3B82F6]";
    case "BAD": return "text-[#EF4444]";
    default: return "text-white";
  }
};

const ProgressBar = ({ score, colorClass }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="h-2 w-full bg-[#0A0A0A] rounded-full overflow-hidden mt-1">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ease-out progress-fill ${colorClass}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

// --- Quick Score Component ---
const QuickScore = ({ onReply, onLeadScored }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [isScoring, setIsScoring] = useState(false);

  const handleScore = async () => {
    if (!text.trim()) return;
    setIsScoring(true);
    console.log("Scoring in progress...");
    console.log("Request payload:", { text: text.trim() });
    
    try {
      const newLead = await scoreEmail(text.trim());
      console.log("Response data:", newLead);
      
      const normalizedLead = {
        ...newLead,
        id: newLead.id || Math.random().toString(36).substring(7),
        created_at: newLead.created_at || new Date().toISOString(),
        email_body: newLead.email_body || newLead.raw_text || text.trim(),
        nlp_score: newLead.nlp_processed_score || newLead.nlp_part || 0,
        ml_score: newLead.ml_score || newLead.ml_part || 0,
        category: (newLead.category || 'BAD').toUpperCase()
      };
      
      setResult(normalizedLead);
    } catch (err) {
      console.error("Quick Score failed:", err);
    } finally {
      setIsScoring(false);
    }
  };

  return (
    <section className="glass-panel overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-[#121212] flex flex-col gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg"><Zap className="w-5 h-5 text-indigo-400" /></div>
            Quick Score
          </h2>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full flex-1 min-h-[160px] bg-[#000000] border border-[#121212] rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-none text-sm placeholder:text-[#8A8A8A] shadow-none transition-all"
            placeholder="Paste raw email content here to instantly evaluate lead quality..."
          />
          <div className="mt-2 flex gap-3">
            <button 
              onClick={handleScore}
              disabled={!text.trim() || isScoring}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#0A0A0A] disabled:text-[#8A8A8A] text-white font-medium py-3 px-6 rounded-xl transition-all shadow-none flex items-center justify-center gap-2"
            >
              {isScoring ? 'Analyzing Intent...' : 'Score Email'}
              {!isScoring && <ArrowRight className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { setText(''); setResult(null); }}
              disabled={(!text && !result) || isScoring}
              className="px-6 py-3 bg-[#0A0A0A] hover:bg-[#121212] border border-[#1A1A1A] disabled:opacity-50 text-[#8A8A8A] hover:text-white rounded-xl transition-colors font-medium flex items-center justify-center"
            >
              Clear
            </button>
          </div>
        </div>
        
        <div className="p-6 md:p-8 bg-[#050505] flex flex-col justify-center items-center relative">
          {!result ? (
            <div className="text-[#8A8A8A] text-sm flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#0A0A0A] flex items-center justify-center border border-[#121212] shadow-none">
                <Target className="w-8 h-8 text-[#8A8A8A]" />
              </div>
              <p className="max-w-[200px]">Paste an email and click <strong>Score</strong> to see the AI evaluation.</p>
            </div>
          ) : (
            <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full justify-between gap-4">
               <div>
                 <div className="flex justify-between items-start mb-6">
                   <div className={`px-4 py-1.5 text-xs font-bold rounded-lg border shadow-none tracking-wide ${getCategoryColor(result.category)}`}>
                     {result.category} LEAD
                   </div>
                   <div className="text-center bg-[#0A0A0A] rounded-xl p-3 border border-[#121212] shadow-none min-w-[100px]">
                      <div className="text-[10px] text-[#8A8A8A] font-semibold mb-1 tracking-wider uppercase">Final Score</div>
                      <div className="text-4xl font-black text-white tracking-tight">{result.final_score}</div>
                   </div>
                 </div>
                 
                 <div className="space-y-4 bg-[#000000] p-5 rounded-xl border border-[#121212]">
                    <div>
                      <div className="text-xs text-[#8A8A8A] mb-1.5 flex justify-between font-medium"><span>Natural Language (NLP)</span><span className="text-[#8A8A8A]">{result.nlp_score}/100</span></div>
                      <ProgressBar score={result.nlp_score} colorClass="bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
                    </div>
                    <div>
                      <div className="text-xs text-[#8A8A8A] mb-1.5 flex justify-between font-medium"><span>Machine Learning (ML)</span><span className="text-[#8A8A8A]">{result.ml_score}/100</span></div>
                      <ProgressBar score={result.ml_score} colorClass="bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.3)]" />
                    </div>
                 </div>
               </div>

               <div className="flex justify-end">
                  <button 
                    onClick={() => onReply(result)} 
                    className="text-indigo-400 hover:text-white transition-colors bg-indigo-500/10 hover:bg-indigo-600 px-4 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2 border border-indigo-500/20 hover:border-indigo-500 shadow-none w-full justify-center"
                  >
                    <MessageSquare className="w-4 h-4" /> Reply to Lead
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// --- Analytics Section Component ---
const AnalyticsSection = ({ leads }) => {
  const [timeFilter, setTimeFilter] = useState('7D');
  const [hoveredPie, setHoveredPie] = useState(null);
  const [hoveredFunnel, setHoveredFunnel] = useState(null);

  // Filter leads based on timeFilter
  const now = new Date();
  const filteredTimeLeads = leads.filter(lead => {
    const leadDate = new Date(lead.created_at);
    const diffTime = Math.abs(now - leadDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (timeFilter === '7D') return diffDays <= 7;
    if (timeFilter === '30D') return diffDays <= 30;
    if (timeFilter === '90D') return diffDays <= 90;
    if (timeFilter === '1Y') return diffDays <= 365;
    return true;
  });

  // Calculate Chart Data based on DATE grouping rules
  const groupedByDate = {};
  filteredTimeLeads.forEach(l => {
    const date = new Date(l.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });

    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(l.final_score);
  });

  const chartData = Object.entries(groupedByDate).map(([date, scores]) => ({
    date,
    avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)
  })).sort((a,b) => new Date(a.date + " " + new Date().getFullYear()) - new Date(b.date + " " + new Date().getFullYear()));

  // Donut Chart - insights
  const categoryCounts = leads.reduce((acc, lead) => {
    acc[lead.category] = (acc[lead.category] || 0) + 1;
    return acc;
  }, { SUPER: 0, GOOD: 0, BAD: 0 });

  const totalPie = categoryCounts.SUPER + categoryCounts.GOOD + categoryCounts.BAD;
  
  const pieData = [
    { name: 'SUPER', value: categoryCounts.SUPER, colorStart: '#0F5132', colorEnd: '#16A34A', color: '#16A34A' },
    { name: 'GOOD', value: categoryCounts.GOOD, colorStart: '#1E3A8A', colorEnd: '#2563EB', color: '#2563EB' },
    { name: 'BAD', value: categoryCounts.BAD, colorStart: '#8B1E2D', colorEnd: '#DC2626', color: '#DC2626' },
  ];

  const maxCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, 'SUPER');
  const maxPercent = totalPie > 0 ? Math.round((categoryCounts[maxCategory] / totalPie) * 100) : 0;
  const maxColor = pieData.find(d => d.name === maxCategory)?.color || '#fff';

  // Funnel calculations
  const newCount = leads.filter(l => l.stage === "NEW" || !l.stage).length;
  const contactedCount = leads.filter(l => l.stage === "CONTACTED").length;
  const negotiatingCount = leads.filter(l => l.stage === "NEGOTIATING").length;
  const closedCount = leads.filter(l => l.stage === "CLOSED").length;

  const drop1 = newCount > 0 ? Math.round(((newCount - contactedCount) / newCount) * 100) : 0;
  const drop2 = contactedCount > 0 ? Math.round(((contactedCount - negotiatingCount) / contactedCount) * 100) : 0;
  const drop3 = negotiatingCount > 0 ? Math.round(((negotiatingCount - closedCount) / negotiatingCount) * 100) : 0;

  // Find biggest drop
  const drops = [
    { label: "NEW → CONTACTED", val: drop1 },
    { label: "CONTACTED → NEGOTIATING", val: drop2 },
    { label: "NEGOTIATING → CLOSED", val: drop3 }
  ];
  const biggestDrop = drops.reduce((max, cur) => cur.val > max.val ? cur : max, drops[0]);

  const funnelData = [
    { stage: 'NEW', count: newCount, hex: '#6B7280', drop: null },
    { stage: 'CONTACTED', count: contactedCount, hex: '#6366F1', drop: drop1 },
    { stage: 'NEGOTIATING', count: negotiatingCount, hex: '#F59E0B', drop: drop2 },
    { stage: 'CLOSED', count: closedCount, hex: '#10B981', drop: drop3 }
  ];

  return (
    <section className="animate-in fade-in duration-700 space-y-8">
      
      {/* Background container style applied via wrapping divs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative">
        
        {/* DONUT CHART CARD */}
        <div className="bg-[#050505] border border-[#121212] rounded-2xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:bg-[#0A0A0A] hover:scale-[1.01] shadow-[0_0_40px_rgba(99,102,241,0.08)] hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] min-h-[420px]">
           <h3 className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-[0.2em] w-full text-left">
             Category Distribution
           </h3>
          
          <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-between gap-8 my-4">
            
            {/* LEFT: Pie Chart */}
            <div className="flex-1 flex justify-center items-center">
              <div className="relative w-[220px] h-[220px]">
                <svg viewBox="-100 -100 200 200" className="w-full h-full transform -rotate-90 overflow-visible">
                  <defs>
                     {pieData.map((d, i) => (
                        <radialGradient key={`grad-${i}`} id={`grad-${i}`} cx="0" cy="0" r="140" gradientUnits="userSpaceOnUse">
                           <stop offset="0%" stopColor={d.colorStart} />
                           <stop offset="100%" stopColor={d.colorEnd} />
                        </radialGradient>
                     ))}
                     {pieData.map((d, i) => {
                        const baseOpacity = i === 2 ? 0.25 : i === 1 ? 0.20 : 0.15;
                        const hoverOpacity = i === 2 ? 0.40 : i === 1 ? 0.35 : 0.30;
                        return (
                           <filter key={`glowPie-${i}`} id={`glowPie-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="0" stdDeviation={hoveredPie === i ? "6" : "2"} floodColor={d.colorEnd} floodOpacity={hoveredPie === i ? hoverOpacity : baseOpacity} />
                           </filter>
                        )
                     })}
                  </defs>
                  
                  {(() => {
                     let visualPercents = pieData.map(slice => 
                         slice.value === 0 && totalPie > 0 ? 0 : 
                         totalPie === 0 ? 1/3 : 
                         Math.max(0.04, slice.value / totalPie)
                     );
                     
                     const vSum = visualPercents.reduce((a,b)=>a+b, 0);
                     if (vSum > 1) {
                         visualPercents = visualPercents.map(v => v / vSum);
                     }

                     let cumulativePercent = 0;
                     return pieData.map((slice, i) => {
                        if (slice.value === 0 && totalPie > 0) return null;
                        
                        const actualPercent = visualPercents[i];
                        
                        const startAngle = cumulativePercent * 2 * Math.PI;
                        const endAngle = (cumulativePercent + actualPercent) * 2 * Math.PI;
                        
                        const r = 90;
                        const startX = Math.cos(startAngle) * r;
                        const startY = Math.sin(startAngle) * r;
                        const endX = Math.cos(endAngle) * r;
                        const endY = Math.sin(endAngle) * r;
                        
                        const largeArcFlag = actualPercent > 0.5 ? 1 : 0;
                        
                        // Pie wedge coordinates
                        const pathData = `M 0 0 L ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                        
                        cumulativePercent += actualPercent;
                        
                        const isHovered = hoveredPie === i;
                        const notHovered = hoveredPie !== null && hoveredPie !== i;
                        
                        return (
                           <path 
                             key={slice.name} 
                             d={pathData} 
                             fill={`url(#grad-${i})`}
                             stroke="#050505"
                             strokeWidth="3"
                             strokeLinejoin="round"
                             filter={`url(#glowPie-${i})`}
                             onMouseEnter={() => setHoveredPie(i)}
                             onMouseLeave={() => setHoveredPie(null)}
                             style={{ 
                               transformOrigin: 'center', 
                               transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                               opacity: notHovered ? 0.3 : 1,
                               transition: 'all 0.25s ease-out',
                               cursor: 'pointer'
                             }}
                           />
                        )
                     })
                  })()}
                </svg>
              </div>
            </div>

            {/* RIGHT: Stats Panel */}
            <div className="flex-1 flex flex-col justify-center gap-6 sm:pl-4 border-t sm:border-t-0 sm:border-l border-[#121212] pt-6 sm:pt-0">
              {pieData.map((entry, i) => {
                const p = totalPie > 0 ? Math.round((entry.value/totalPie)*100) : 0;
                const isHovered = hoveredPie === i;
                const notHovered = hoveredPie !== null && hoveredPie !== i;
                
                return (
                  <div 
                    key={entry.name} 
                    className="flex flex-col gap-1 cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredPie(i)}
                    onMouseLeave={() => setHoveredPie(null)}
                    style={{ 
                       opacity: notHovered ? 0.3 : 1,
                       transform: isHovered ? 'translateX(8px)' : 'translateX(0)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                       <span className="text-[12px]" style={{ color: entry.color, textShadow: isHovered ? `0 0 10px ${entry.color}` : 'none' }}>●</span>
                       <span className="text-white text-[11px] font-bold tracking-widest uppercase">{entry.name}</span>
                    </div>
                    <span className="text-white text-[24px] font-bold leading-none tracking-tight">{p}%</span>
                    <span className="text-[#8A8A8A] text-[12px] font-medium">{entry.value} leads</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Insight Pill */}
          <div className="w-full mt-auto bg-[#080808] border border-[#121212] rounded-xl p-4 flex items-center gap-3 shadow-inner">
             <span className="text-[#D1D5DB] text-[12px] font-medium leading-relaxed">
               Majority of leads are <span className="font-bold" style={{color: maxColor}}>{maxCategory} ({maxPercent}%)</span> — Improve targeting quality
             </span>
          </div>
        </div>
        
        {/* FUNNEL CHART CARD */}
        <div className="bg-[#050505] border border-[#121212] rounded-2xl p-6 md:p-8 relative flex flex-col transition-all duration-300 hover:bg-[#0A0A0A] hover:scale-[1.01] shadow-[0_0_40px_rgba(99,102,241,0.08)] hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]">
          
          <div className="flex justify-between items-start mb-10 w-full">
            <h3 className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-[0.2em]">
              Conversion Funnel
            </h3>
            {biggestDrop && biggestDrop.val > 0 && (
              <div className="flex items-center gap-2 border border-rose-500/20 bg-rose-500/10 rounded-full px-3 py-1 mt-[-6px]">
                <svg className="w-3 h-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                <span className="text-[10px] text-rose-400 font-bold tracking-wider uppercase">Biggest Drop: {biggestDrop.label} (-{biggestDrop.val}%)</span>
              </div>
            )}
          </div>

          <div className="flex-1 w-full flex flex-col items-center justify-start gap-3">
               {funnelData.map((d, i) => {
                  const isHovered = hoveredFunnel === i;
                  // Fixed shape progression instead of logic sizing
                  const topWidth = 100 - (i * 15);
                  const botWidth = 100 - ((i+1) * 15) + 5;
                  
                  // Compute exactly percentage of total pipeline NEW block
                  const pOfNew = newCount > 0 ? Math.round((d.count / newCount) * 100) : 0;
                  
                  return (
                     <React.Fragment key={d.stage}>
                       <div 
                          className="relative h-[65px] transition-all duration-300 flex justify-center cursor-pointer" 
                          style={{ 
                            width: `${topWidth}%`,
                            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                            zIndex: isHovered ? 20 : 10
                          }}
                          onMouseEnter={() => setHoveredFunnel(i)}
                          onMouseLeave={() => setHoveredFunnel(null)}
                       >
                          <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" className="w-full h-full overflow-visible drop-shadow-xl">
                            <defs>
                              <linearGradient id={`poly-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={d.hex} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={d.hex} stopOpacity="0.05" />
                              </linearGradient>
                              {isHovered && (
                                <filter id={`glow-poly-${i}`}>
                                  <feGaussianBlur stdDeviation="3" result="blur" />
                                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                              )}
                            </defs>
                            
                            {/* Explicit fixed trapezoid matching width shrinking artificially mapped inside local scale */}
                            <polygon 
                              points={`0,0 100,0 ${(100 - botWidth/topWidth*100) / 2 + botWidth/topWidth*100},100 ${(100 - botWidth/topWidth*100) / 2},100`}
                              fill={`url(#poly-${i})`} 
                              stroke={d.hex} 
                              strokeWidth={isHovered ? "2.5" : "1.5"}
                              filter={isHovered ? `url(#glow-poly-${i})` : "none"}
                            />
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                             <span className="text-[12px] font-bold text-white tracking-widest uppercase">{d.stage}</span>
                             <span className="text-[11px] font-semibold text-white mt-[1px]">{d.count} <span className="text-[#8A8A8A] font-normal">leads</span></span>
                             <span className="text-[10px] font-medium text-[#D1D5DB] mt-[1px]">({pOfNew}% of NEW)</span>
                          </div>
                       </div>
                       
                       {/* Drop Arrow BETWEEN stages */}
                       {i < funnelData.length - 1 && (
                          <div className="flex flex-col items-center justify-center my-[-2px] z-30 pointer-events-none">
                             <div className="bg-[#050505] border border-[#1A1A1F] rounded-full px-2.5 py-0.5 flex items-center gap-1.5 text-[10px] text-[#A1A1AA] font-bold shadow-md">
                               <svg className="w-3 h-3 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                               ↓ {funnelData[i+1].drop != null ? `-${funnelData[i+1].drop}%` : '0%'}
                             </div>
                          </div>
                       )}
                     </React.Fragment>
                  );
               })}
          </div>
        </div>
      </div>

      {/* SCORE TREND CHART */}
      <div className="bg-[#050505] border border-[#121212] rounded-2xl p-6 md:p-8 relative flex flex-col transition-all duration-300 hover:bg-[#0A0A0A] hover:scale-[1.01] shadow-[0_0_40px_rgba(99,102,241,0.08)] hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]">
        
        <div className="flex justify-between items-center mb-8 relative z-10 w-full">
           <h3 className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-[0.2em]">
             Score Trend
           </h3>
           <div className="flex gap-1">
             {['7D', '30D', '90D', '1Y'].map(t => (
               <button 
                 key={t}
                 onClick={() => setTimeFilter(t)}
                 className={`px-4 py-1.5 text-[10px] font-bold tracking-widest rounded-md transition-all ${timeFilter === t ? 'bg-[#121212] text-white border border-[#2A2A2A]' : 'text-[#8A8A8A] hover:text-[#E0E0E0] border border-transparent'}`}
               >
                 {t}
               </button>
             ))}
           </div>
        </div>

        <div className="h-[350px] w-full relative z-10 -ml-4 pr-4">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-[#3A3A3A] font-medium border border-[#1A1A1A] rounded-xl ml-4">
              No activity yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                  
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#050505" stopOpacity="0" />
                  </linearGradient>
                  
                  <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
                     <feGaussianBlur stdDeviation="3" result="blur" />
                     <feMerge>
                       <feMergeNode in="blur" />
                       <feMergeNode in="SourceGraphic" />
                     </feMerge>
                  </filter>
                </defs>
                
                <CartesianGrid strokeDasharray="1 4" stroke="#121212" vertical={false} />
                <XAxis dataKey="date" stroke="#8A8A8A" fontSize={11} tickLine={false} axisLine={false} tickMargin={15} />
                <YAxis stroke="#8A8A8A" fontSize={11} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} tickMargin={10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#050505', borderColor: '#121212', borderRadius: '0.5rem', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }} 
                  cursor={{ stroke: '#121212', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                
                <Area 
                  type="monotone" 
                  dataKey="avg" 
                  stroke="url(#lineGrad)" 
                  fill="url(#areaGrad)" 
                  strokeWidth={3} 
                  activeDot={{ r: 6, fill: '#fff', stroke: '#A855F7', strokeWidth: 2, className: "shadow-[0_0_15px_rgba(168,85,247,1)]" }}
                  dot={{ r: 4, fill: '#050505', stroke: '#8B5CF6', strokeWidth: 2 }}
                  style={{ filter: "url(#glow-line)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
    </section>
  );
};


// --- Reply Modal Component ---
const ReplyModal = ({ lead, onClose, onReplySuccess }) => {
  const [draft, setDraft] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const parseEmailOnly = (raw) => {
    if (!raw) return '';
    const match = raw.match(/<([^>]+)>/);
    if (match) return match[1].trim();
    const emailMatch = raw.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) return emailMatch[0];
    return raw.trim();
  };

  useEffect(() => {
    if (lead) {
      setDraft('');
      const cleanEmail = parseEmailOnly(lead.sender) || '';
      setRecipient(cleanEmail);
      setStatus(null);
      setErrorMessage('');
    }
  }, [lead]);

  const handleSend = async () => {
    if (!draft.trim() || !recipient.trim()) return;
    setIsSending(true);
    setStatus(null);
    try {
      await sendReply({
        to: recipient,
        subject: lead.subject ? (lead.subject.toLowerCase().startsWith('re:') ? lead.subject : `Re: ${lead.subject}`) : 'Re: Your Lead',
        body: draft,
        thread_id: lead.thread_id || null,
        id: lead.id || lead.email_id
      });
      setStatus('success');
      if (onReplySuccess) onReplySuccess(lead.id || lead.email_id);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.detail || err.message || 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenGmail = async () => {
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
      console.error(err);
    }
  };

  if (!lead) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-out">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#050505] border border-[#121212] rounded-2xl shadow-none flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#121212] bg-[#050505]">
           <h3 className="font-semibold text-white flex items-center gap-2">
             <div className="p-1.5 bg-indigo-500/10 rounded-lg"><MessageSquare className="w-4 h-4 text-indigo-400" /></div>
             Reply to {lead.sender || 'Lead'}
           </h3>
           <button onClick={onClose} className="text-[#8A8A8A] hover:text-white transition-colors bg-[#0A0A0A] hover:bg-[#0A0A0A] p-1.5 rounded-lg border border-transparent hover:border-[#121212]">
             <X className="w-4 h-4" />
           </button>
        </div>
        <div className="p-6 space-y-6 bg-[#050505]">
           <div className="bg-[#000000] p-5 rounded-xl border border-[#121212] text-sm shadow-none group">
             <div className="text-[#8A8A8A] mb-3 font-medium flex justify-between items-center">
               <span>Original Email Preview</span>
               <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getCategoryColor(lead.category)}`}>{lead.category}</span>
             </div>
             <p className="text-[#8A8A8A] leading-relaxed font-medium line-clamp-4 overflow-y-auto max-h-32">{lead.email_body}</p>
           </div>
           
           {status === 'success' ? (
             <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-center font-medium animate-in fade-in zoom-in">
                Reply sent successfully! Closing...
             </div>
           ) : (
             <div className="space-y-3">
               <div className="flex flex-col gap-1.5 mb-2">
                 <label className="text-sm font-semibold text-[#8A8A8A]">To:</label>
                 <input
                   type="email"
                   value={recipient}
                   onChange={(e) => setRecipient(e.target.value)}
                   disabled={isSending}
                   className="w-full bg-[#000000] border border-[#121212] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm shadow-none transition-all disabled:opacity-50"
                   placeholder="recipient@example.com"
                 />
                 {!recipient && (
                   <div className="text-xs text-rose-400 mt-1 font-medium">No recipient email found. Please enter manually.</div>
                 )}
               </div>
               <div className="flex justify-between items-end">
                 <label className="text-sm font-semibold text-[#8A8A8A]">Draft Reply</label>
                 <div className="flex items-center gap-3">
                   <span className="text-[10px] text-amber-500/80 hidden sm:inline">Make sure you are logged into official account</span>
                   <button onClick={handleOpenGmail} className="text-xs font-medium text-[#8A8A8A] hover:text-white flex items-center gap-1.5 bg-[#0A0A0A] hover:bg-[#0A0A0A] px-2.5 py-1.5 rounded-md transition-colors border border-[#121212] shadow-none">
                     Open in Gmail instead
                   </button>
                 </div>
               </div>
               <textarea 
                 value={draft}
                 onChange={(e) => setDraft(e.target.value)}
                 disabled={isSending}
                 className="w-full h-40 bg-[#000000] border border-[#121212] rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-none text-sm placeholder:text-[#8A8A8A] shadow-none transition-all disabled:opacity-50" 
                 placeholder="Write your professional response here..."
               />
               {status === 'error' && (
                 <div className="text-sm text-rose-400 font-medium">Error: {errorMessage}</div>
               )}
             </div>
           )}
        </div>
        {!status || status === 'error' ? (
        <div className="px-6 py-4 border-t border-[#121212] bg-[#050505] flex justify-end gap-3 items-center">
           <button onClick={onClose} disabled={isSending} className="px-4 py-2 text-sm font-medium text-[#8A8A8A] hover:text-white transition-colors">
             Cancel
           </button>
           <button onClick={handleSend} disabled={isSending || !draft.trim() || !recipient.trim() || !recipient.includes('@')} className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-2 transition-all shadow-none shadow-indigo-900/20 border border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} /> {isSending ? 'Sending...' : 'Send Email'}
           </button>
        </div>
        ) : null}
      </div>
    </div>
  );
};

// --- Reusable Components ---
const LeadCard = ({ lead, onReply }) => (
  <div className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
    <div className="flex justify-between items-start">
      <div className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(lead.category)} shadow-none`}>
        {lead.category} LEAD
      </div>
      <div className="text-xs text-[#8A8A8A]">{new Date(lead.created_at).toLocaleString()}</div>
    </div>
    <p className="text-[#8A8A8A] font-medium leading-relaxed bg-[#000000] p-4 rounded-xl border border-[#121212] backdrop-blur-sm line-clamp-3">
      "{lead.email_body}"
    </p>
    <div className="grid grid-cols-3 gap-4 pt-2">
      <div>
        <div className="text-xs text-[#8A8A8A] mb-1 flex justify-between"><span>NLP</span><span>{lead.nlp_score}/100</span></div>
        <ProgressBar score={lead.nlp_score} colorClass="bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
      </div>
      <div>
        <div className="text-xs text-[#8A8A8A] mb-1 flex justify-between"><span>ML</span><span>{lead.ml_score}/100</span></div>
        <ProgressBar score={lead.ml_score} colorClass="bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
      </div>
      <div className="text-center bg-[#0A0A0A] rounded-lg p-2 border border-[#121212]">
        <div className="text-xs text-[#8A8A8A]">FINAL SCORE</div>
        <div className="text-2xl font-bold text-white tracking-tight">{lead.final_score}</div>
      </div>
    </div>
    <div className="pt-4 mt-2 border-t border-[#121212] flex justify-end items-center gap-3">
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase ${lead.is_replied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-[#0A0A0A] text-[#8A8A8A] border border-[#121212]"}`}>
        {lead.is_replied ? "Replied" : "Pending"}
      </span>
      <button onClick={() => onReply(lead)} className="text-indigo-400 hover:text-white transition-colors bg-indigo-500/10 hover:bg-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 border border-indigo-500/20 hover:border-indigo-500 shadow-none w-full md:w-auto justify-center">
        <MessageSquare className="w-4 h-4" /> Reply
      </button>
    </div>
  </div>
);

const LeadRow = ({ lead, onReply }) => (
  <tr className="hover:bg-[#0A0A0A] transition-colors group border-b border-[#121212] last:border-0">
    <td className="px-6 py-4">
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border text-center inline-block min-w-[65px] ${getCategoryColor(lead.category)}`}>
        {lead.category}
      </span>
    </td>
    <td className="px-6 py-4">
      <div className="max-w-md truncate text-[#8A8A8A] font-medium" title={lead.email_body}>
        {lead.email_body}
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <span className={`font-bold w-6 text-right ${lead.category === 'SUPER' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-white'}`}>{lead.final_score}</span>
        <span className="text-[#8A8A8A]">|</span>
        <span className="text-[#8A8A8A] text-xs w-6 text-right">{lead.nlp_score}</span>
        <span className="text-[#8A8A8A] text-xs w-6 text-right">{lead.ml_score}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-[#8A8A8A] text-xs tracking-wide">
      {new Date(lead.created_at).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 text-right">
      <div className="flex justify-end items-center gap-2">
        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${lead.is_replied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-[#0A0A0A] text-[#8A8A8A] border border-[#121212]"}`}>
          {lead.is_replied ? "Replied" : "Pending"}
        </span>
        <button onClick={() => onReply(lead)} className="text-[#8A8A8A] hover:text-white transition-colors bg-[#0A0A0A] hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border border-[#121212] hover:border-indigo-500 shadow-none">
          <MessageSquare className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Reply
        </button>
      </div>
    </td>
  </tr>
);


// --- All Leads Directory Page ---
const AllLeadsPage = ({ leads, onReply, onBack }) => {
  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#121212]">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
          <Users className="w-6 h-6 text-indigo-400" /> All Leads Directory
        </h2>
        <button 
          onClick={onBack}
          className="text-sm font-medium text-[#8A8A8A] hover:text-white transition-colors flex items-center gap-1.5 bg-[#0A0A0A] hover:bg-[#0A0A0A] px-4 py-2 rounded-xl"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#050505] border-b border-[#121212] text-[#8A8A8A]">
              <tr>
                <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider">Category</th>
                <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider">Email Preview</th>
                <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider">Scores (Final/NLP/ML)</th>
                <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider">Date</th>
                <th className="px-6 py-4 font-medium text-right uppercase text-xs tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#121212]">
              {Array.isArray(leads) && leads.map(lead => (
                <LeadRow key={lead.id} lead={lead} onReply={onReply} />
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#8A8A8A]">
                    No leads match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// --- Dashboard Page ---
const DashboardPage = ({ filteredLeads, sessionLeads, superLeads, onViewAll, onReply, onLeadScored, stats }) => {
  const recentLeads = sessionLeads;

  return (
    <div className="animate-in fade-in duration-300 space-y-10">
      {/* QUICK SCORE SECTION */}
      <QuickScore onReply={onReply} onLeadScored={onLeadScored} />

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-8 flex flex-col gap-2 bg-[#050505] border-[#121212] rounded-2xl hover:bg-[#0A0A0A] transition-colors">
          <div className="flex items-center gap-3 text-[#8A8A8A]">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Mail className="w-5 h-5"/></div>
            <span className="font-medium">Total Leads</span>
          </div>
          <div className="text-4xl font-semibold text-white">{stats.total}</div>
        </div>
        <div className="glass-panel p-8 flex flex-col gap-2 relative overflow-hidden bg-[#050505] border-[#121212] rounded-2xl hover:bg-[#0A0A0A] transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-3 text-[#8A8A8A]">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Award className="w-5 h-5"/></div>
            <span className="font-medium">Super Leads</span>
          </div>
          <div className="text-4xl font-semibold flex items-baseline gap-2 text-white">
            {stats.percent}%
            <span className="text-sm font-normal text-emerald-400 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> High Intent</span>
          </div>
        </div>
        <div className="glass-panel p-8 flex flex-col gap-2 bg-[#050505] border-[#121212] rounded-2xl hover:bg-[#0A0A0A] transition-colors">
          <div className="flex items-center gap-3 text-[#8A8A8A]">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><Star className="w-5 h-5"/></div>
            <span className="font-medium">Average Score</span>
          </div>
          <div className="text-4xl font-semibold text-white">{stats.average || 0}</div>
        </div>
      </div>

      {/* SUPER Leads Section (MOVED UP) */}
      {superLeads.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold text-emerald-400 flex items-center gap-3 border-b border-[#121212] pb-4">
            <svg className="w-8 h-8 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Priority Action Required
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {Array.isArray(superLeads) && superLeads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onReply={onReply} />
            ))}
          </div>
        </section>
      )}

      {/* Analytics Section */}
      <AnalyticsSection leads={filteredLeads} />

      {/* Recently Scored Leads Section */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-white">
            <Users className="w-6 h-6 text-[#8A8A8A]" /> Recently Scored Leads
          </h2>
          <button 
            onClick={onViewAll}
            className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 py-2 px-4 rounded-xl hover:bg-[#0A0A0A] border border-transparent hover:border-[#121212]"
          >
            View All Leads <ArrowRight className="w-4 h-4"/>
          </button>
        </div>
        
        <div className="glass-panel overflow-hidden bg-[#050505] border-[#121212] rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0A0A0A] border-b border-[#121212] text-[#8A8A8A]">
                <tr>
                  <th className="px-6 py-5 font-medium uppercase text-xs tracking-wider">Category</th>
                  <th className="px-6 py-5 font-medium uppercase text-xs tracking-wider">Email Preview</th>
                  <th className="px-6 py-5 font-medium uppercase text-xs tracking-wider">Scores (Final/NLP/ML)</th>
                  <th className="px-6 py-5 font-medium uppercase text-xs tracking-wider">Date</th>
                  <th className="px-6 py-5 font-medium text-right uppercase text-xs tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#121212]">
                {Array.isArray(recentLeads) && recentLeads.map(lead => (
                  <LeadRow key={lead.id} lead={lead} onReply={onReply} />
                ))}
                {recentLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#8A8A8A]">
                      No recent leads match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};


// --- Main App Root Wrapper ---
export default function App() {
  const [route, setRoute] = useState('/dashboard');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activeReplyLead, setActiveReplyLead] = useState(null);

  const [persistentLeads, setPersistentLeads] = useState([]);
  const [sessionLeads, setSessionLeads] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const fetchInitialLeads = async () => {
      try {
        const data = await getLeads();
        const safeData = Array.isArray(data) ? data : [];
        const formatted = safeData.map(l => ({
            ...l,
            id: l.id || l.email_id,
            email_body: l.email_body || l.raw_text || "",
            category: (l.category || 'BAD').toUpperCase(),
            nlp_score: l.nlp_processed_score || l.nlp_part || 0,
            ml_score: l.ml_score || l.ml_part || 0
        }));
        setPersistentLeads(formatted);
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
    };
    fetchInitialLeads();
  }, []);

  const handleLeadScored = (newLead) => {
    setSessionLeads([newLead]);
    setPersistentLeads((prev) => [newLead, ...prev]);
  };

  const handleLeadReplied = (id) => {
    console.log("Marking lead as replied in state:", id);
    
    setPersistentLeads(prev => {
      const match = prev.find(l => l.id === id || l.email_id === id);
      if (!match) return prev;
      const updatedLead = { ...match, is_replied: true, stage: (match.stage === 'NEW' || !match.stage) ? 'CONTACTED' : match.stage };
      return prev.map(l => l.id === updatedLead.id ? updatedLead : l);
    });

    setSessionLeads(prev => {
      const match = prev.find(l => l.id === id || l.email_id === id);
      if (!match) return prev;
      const updatedLead = { ...match, is_replied: true, stage: (match.stage === 'NEW' || !match.stage) ? 'CONTACTED' : match.stage };
      return prev.map(l => l.id === updatedLead.id ? updatedLead : l);
    });
  };

  const handleUpdateStage = async (id, stage) => {
    try {
      await updateLeadStage(id, stage);
      
      setPersistentLeads(prev => {
        const match = prev.find(l => l.id === id || l.email_id === id);
        if (!match) return prev;
        const updatedLead = { ...match, stage };
        return prev.map(l => l.id === updatedLead.id ? updatedLead : l);
      });

      setSessionLeads(prev => {
        const match = prev.find(l => l.id === id || l.email_id === id);
        if (!match) return prev;
        const updatedLead = { ...match, stage };
        return prev.map(l => l.id === updatedLead.id ? updatedLead : l);
      });
    } catch (e) {
      console.error("Failed to update stage:", e);
      alert("Failed to update stage: " + (e.response?.data?.detail || e.message));
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    console.log("Syncing emails...");
    try {
      console.log("Calling processEmails()...");
      const responseLeads = await processEmails();
      console.log("SYNC RESPONSE:", responseLeads);
      
      const newLeads = Array.isArray(responseLeads) ? responseLeads : [];
      
      const formatted = newLeads.map(l => ({
          ...l,
          id: l.id || l.email_id || Math.random().toString(36).substring(7),
          email_body: l.email_body || l.raw_text || "",
          category: (l.category || 'BAD').toUpperCase(),
          nlp_score: l.nlp_processed_score || l.nlp_part || 0,
          ml_score: l.ml_score || l.ml_part || 0
      }));
      
      console.log("Session Leads Updated:", formatted);
      setSessionLeads(formatted);
      
      if (formatted.length === 0) {
        setSyncMessage('No new leads found');
        setTimeout(() => setSyncMessage(''), 3000);
      } else {
        setPersistentLeads(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const filtered = formatted.filter(l => !existingIds.has(l.id));
          return [...filtered, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        });
      }
    } catch (e) {
      console.error("Sync failed:", e);
      setSyncMessage('Sync failed');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return persistentLeads.filter(lead => {
      const matchCat = filter === 'ALL' || lead.category === filter;
      const matchSearch = (lead.email_body || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); 
  }, [filter, search, persistentLeads]);

  const superLeads = useMemo(() => {
    return persistentLeads
      .filter(lead => lead.category === 'SUPER' && !lead.is_replied)
      .sort((a, b) => b.final_score - a.final_score)
      .slice(0, 4);
  }, [persistentLeads]);

  const totalLeads = persistentLeads.length;
  const superLeadsCount = persistentLeads.filter(l => l.category === 'SUPER').length;
  const superPercent = totalLeads === 0 ? 0 : Math.round((superLeadsCount / totalLeads) * 100);
  const avgScore = totalLeads === 0 ? 0 : Math.round(persistentLeads.reduce((acc, curr) => acc + curr.final_score, 0) / totalLeads);

  const stats = { total: totalLeads, percent: superPercent, average: avgScore };

  return (
    <div className="min-h-screen p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <ReplyModal lead={activeReplyLead} onClose={() => setActiveReplyLead(null)} onReplySuccess={handleLeadReplied} />
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => setRoute('/dashboard')} className="text-left focus:outline-none block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#8A8A8A] bg-clip-text text-transparent hover:opacity-90 transition-opacity">
              Elite Lead Qualifier
            </h1>
          </button>
          <p className="text-[#8A8A8A] mt-1">AI-Powered Inbox Intelligence</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setRoute('/lead-management')}
            className={`text-sm font-bold tracking-wide flex items-center gap-1.5 transition-colors px-4 py-2 rounded-xl border ${route === '/lead-management' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' : 'bg-[#0A0A0A] text-[#8A8A8A] border-[#121212] hover:text-white hover:bg-[#0A0A0A]'}`}
          >
            <BarChart2 className="w-4 h-4"/> Pipeline
          </button>
          
          {syncMessage && (
            <span className="text-sm font-medium text-amber-400 animate-pulse px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              {syncMessage}
            </span>
          )}
          <button 
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors text-sm font-semibold shadow-none shadow-indigo-900/20 mr-2 border border-indigo-500/50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All Emails'}
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
            <input 
              type="text" 
              placeholder="Search emails..."
              className="pl-10 pr-4 py-2 bg-[#050505] border border-[#121212] rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-sm transition-all w-64 shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
            <select 
              className={`appearance-none pl-10 pr-8 py-2 bg-[#050505] border border-[#121212] rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm transition-all cursor-pointer shadow-none ${getCategoryTextColor(filter)}`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL" className="bg-black text-white">All Categories</option>
              <option value="SUPER" className="bg-black text-[#22C55E]">SUPER</option>
              <option value="GOOD" className="bg-black text-[#3B82F6]">GOOD</option>
              <option value="BAD" className="bg-black text-[#EF4444]">BAD</option>
            </select>
          </div>
        </div>
      </header>

      {route === '/dashboard' ? (
        <DashboardPage 
          filteredLeads={filteredLeads} 
          sessionLeads={sessionLeads}
          superLeads={superLeads} 
          stats={stats}
          onViewAll={() => setRoute('/all-leads')} 
          onReply={setActiveReplyLead} 
          onLeadScored={handleLeadScored}
        />
      ) : route === '/lead-management' ? (
        <LeadManagementPage
          leads={persistentLeads || []}
          onBack={() => setRoute('/dashboard')}
          onReply={setActiveReplyLead}
          onUpdateStage={handleUpdateStage}
          onSync={handleSyncAll}
          isSyncing={isSyncing}
          syncMessage={syncMessage}
        />
      ) : (
        <AllLeadsPage 
          leads={filteredLeads} 
          onBack={() => setRoute('/dashboard')}
          onReply={setActiveReplyLead}
        />
      )}
    </div>
  );
}
