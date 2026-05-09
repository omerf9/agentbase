import { useState, useEffect, useRef } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// ── Score badge ──
function ScoreBadge({ score }) {
  const config = {
    HOT: { bg: "#ff4444", color: "#fff", label: "🔥 HOT" },
    WARM: { bg: "#ff9800", color: "#fff", label: "⚡ WARM" },
    COLD: { bg: "#2196F3", color: "#fff", label: "❄️ COLD" },
  };
  const c = config[score] || config.COLD;
  return (
    <span style={{
      background: c.bg, color: c.color, fontSize: "10px", fontWeight: "700",
      padding: "3px 8px", borderRadius: "6px", fontFamily: "'DM Mono', monospace",
      letterSpacing: "0.5px"
    }}>{c.label}</span>
  );
}

// ── Chat Widget ──
function ChatWidget({ business, onLeadUpdate }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = async () => {
    const res = await fetch(`${BACKEND_URL}/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: business.id })
    });
    const data = await res.json();
    setSessionId(data.session_id);
    setMessages([{ role: "assistant", content: data.greeting }]);
    setStarted(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !sessionId || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, business_id: business.id, message: text })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      if (data.lead_id) onLeadUpdate();
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const reset = () => {
    setSessionId(null); setMessages([]); setInput(""); setStarted(false);
  };

  return (
    <div style={{
      background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: "20px",
      overflow: "hidden", display: "flex", flexDirection: "column", height: "520px"
    }}>
      {/* Chat header */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid #1a1a1a",
        background: "linear-gradient(135deg, #0d0d0d, #141414)",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: `linear-gradient(135deg, ${business.color}, ${business.color2})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px"
          }}>{business.icon}</div>
          <div>
            <div style={{ color: "#fff", fontSize: "13px", fontWeight: "700" }}>{business.name}</div>
            <div style={{ color: "#4CAF50", fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4CAF50" }} />
              AI Agent Online
            </div>
          </div>
        </div>
        {started && (
          <button onClick={reset} style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: "7px", color: "#555", cursor: "pointer", padding: "5px 10px", fontSize: "11px" }}>
            New Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {!started ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "14px" }}>{business.icon}</div>
            <h3 style={{ color: "#fff", fontFamily: "'Clash Display', sans-serif", fontSize: "18px", marginBottom: "8px" }}>{business.name}</h3>
            <p style={{ color: "#555", fontSize: "13px", marginBottom: "24px", lineHeight: "1.6" }}>
              Our AI agent is ready to help qualify leads and book appointments 24/7.
            </p>
            <button onClick={startSession} style={{
              padding: "12px 28px", background: `linear-gradient(135deg, ${business.color}, ${business.color2})`,
              border: "none", borderRadius: "12px", color: "#fff", cursor: "pointer",
              fontSize: "14px", fontWeight: "700"
            }}>Start Conversation →</button>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0, marginRight: "8px",
                    background: `linear-gradient(135deg, ${business.color}, ${business.color2})`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", marginTop: "2px"
                  }}>{business.icon}</div>
                )}
                <div style={{
                  maxWidth: "75%", padding: "10px 14px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
                  background: msg.role === "user" ? `linear-gradient(135deg, ${business.color}, ${business.color2})` : "#1a1a1a",
                  color: "#e0e0e0", fontSize: "13px", lineHeight: "1.6",
                  border: msg.role === "user" ? "none" : "1px solid #252525"
                }}>{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `linear-gradient(135deg, ${business.color}, ${business.color2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>{business.icon}</div>
                <div style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", display: "flex", gap: "4px" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: business.color, animation: `pulse 1.2s ${i*0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      {started && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", gap: "8px", background: "#1a1a1a", borderRadius: "12px", padding: "8px 12px", border: "1px solid #252525" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
              placeholder="Type your message..."
              style={{ flex: 1, background: "none", border: "none", color: "#e0e0e0", fontSize: "13px", outline: "none" }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading} style={{
              width: "30px", height: "30px", borderRadius: "8px", border: "none",
              background: input.trim() && !loading ? `linear-gradient(135deg, ${business.color}, ${business.color2})` : "#2a2a2a",
              color: "#fff", cursor: input.trim() && !loading ? "pointer" : "default", fontSize: "14px"
            }}>↑</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Lead card ──
function LeadCard({ lead, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "12px",
      padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
      borderLeft: `3px solid ${lead.score === "HOT" ? "#ff4444" : lead.score === "WARM" ? "#ff9800" : "#2196F3"}`
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "#2a2a2a"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1a"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          <div style={{ color: "#e0e0e0", fontSize: "13px", fontWeight: "700" }}>{lead.name || "Anonymous Lead"}</div>
          <div style={{ color: "#555", fontSize: "10px", marginTop: "2px", fontFamily: "'DM Mono', monospace" }}>{lead.business_name}</div>
        </div>
        <ScoreBadge score={lead.score || "COLD"} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {lead.budget && <span style={{ background: "#1a1a1a", color: "#888", fontSize: "10px", padding: "2px 7px", borderRadius: "4px" }}>💰 {lead.budget}</span>}
        {lead.timeline && <span style={{ background: "#1a1a1a", color: "#888", fontSize: "10px", padding: "2px 7px", borderRadius: "4px" }}>⏱ {lead.timeline}</span>}
        {lead.appointment_requested && <span style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50", fontSize: "10px", padding: "2px 7px", borderRadius: "4px" }}>📅 Appt. Requested</span>}
        {lead.message_count && <span style={{ background: "#1a1a1a", color: "#555", fontSize: "10px", padding: "2px 7px", borderRadius: "4px" }}>💬 {lead.message_count} msgs</span>}
      </div>
    </div>
  );
}

// ── Conversation modal ──
function ConversationModal({ lead, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/leads/${lead.lead_id}/conversation`)
      .then(r => r.json()).then(setData);
  }, [lead.lead_id]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "20px", maxWidth: "580px", width: "100%", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: "700", fontSize: "14px" }}>{lead.name || "Anonymous Lead"}</div>
            <div style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>{lead.business_name} · <ScoreBadge score={lead.score || "COLD"} /></div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>

        {/* Lead details */}
        {data && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1a1a1a", display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {Object.entries(data.lead).filter(([k]) => !["lead_id","session_id","business_id","created_at","updated_at","message_count","score","appointment_requested"].includes(k)).map(([k, v]) => v && (
              <div key={k} style={{ background: "#1a1a1a", borderRadius: "6px", padding: "4px 10px" }}>
                <span style={{ color: "#555", fontSize: "9px", textTransform: "capitalize" }}>{k.replace(/_/g," ")}: </span>
                <span style={{ color: "#aaa", fontSize: "11px" }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {data?.messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "75%", padding: "8px 12px", borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "4px 12px 12px 12px",
                background: msg.role === "user" ? "#1e3a5f" : "#1a1a1a",
                color: "#d0d0d0", fontSize: "12px", lineHeight: "1.6",
                border: "1px solid " + (msg.role === "user" ? "#1e3a5f" : "#252525")
              }}>{msg.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──
function Dashboard({ leads, stats, onRefresh, businesses }) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [filter, setFilter] = useState("all");
  const [bizFilter, setBizFilter] = useState("all");

  const filtered = leads.filter(l => {
    const scoreMatch = filter === "all" || l.score === filter.toUpperCase();
    const bizMatch = bizFilter === "all" || l.business_id === bizFilter;
    return scoreMatch && bizMatch;
  });

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: "TOTAL LEADS", value: stats.total, color: "#6C63FF" },
          { label: "🔥 HOT", value: stats.hot, color: "#ff4444" },
          { label: "⚡ WARM", value: stats.warm, color: "#ff9800" },
          { label: "❄️ COLD", value: stats.cold, color: "#2196F3" },
          { label: "📅 APPOINTMENTS", value: stats.appointments, color: "#4CAF50" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "12px", padding: "14px", textAlign: "center" }}>
            <div style={{ color: s.color, fontFamily: "'Clash Display', sans-serif", fontSize: "26px", fontWeight: "700" }}>{s.value}</div>
            <div style={{ color: "#444", fontSize: "8px", letterSpacing: "1px", marginTop: "3px", fontFamily: "'DM Mono', monospace" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {["all", "hot", "warm", "cold"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
              background: filter === f ? "#1a1a1a" : "transparent",
              border: `1px solid ${filter === f ? "#2a2a2a" : "transparent"}`,
              color: filter === f ? "#fff" : "#555", textTransform: "capitalize"
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setBizFilter("all")} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "11px", cursor: "pointer", background: bizFilter === "all" ? "#1a1a1a" : "transparent", border: `1px solid ${bizFilter === "all" ? "#2a2a2a" : "transparent"}`, color: bizFilter === "all" ? "#fff" : "#555" }}>All</button>
          {businesses.map(b => (
            <button key={b.id} onClick={() => setBizFilter(b.id)} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "11px", cursor: "pointer", background: bizFilter === b.id ? "#1a1a1a" : "transparent", border: `1px solid ${bizFilter === b.id ? "#2a2a2a" : "transparent"}`, color: bizFilter === b.id ? "#fff" : "#555" }}>{b.icon} {b.name}</button>
          ))}
          <button onClick={onRefresh} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "11px", cursor: "pointer", background: "transparent", border: "1px solid #1a1a1a", color: "#555" }}>↻ Refresh</button>
        </div>
      </div>

      {/* Lead list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#2a2a2a", fontSize: "13px" }}>
          No leads yet. Start a conversation to generate leads.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(lead => (
            <LeadCard key={lead.lead_id} lead={lead} onClick={() => setSelectedLead(lead)} />
          ))}
        </div>
      )}

      {selectedLead && <ConversationModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
}

// ── Businesses config (frontend) ──
const BUSINESSES = [
  { id: "dealership", name: "AutoPrime Motors", icon: "🚗", color: "#FF6B35", color2: "#FF8C42" },
  { id: "realestate", name: "Prestige Properties", icon: "🏡", color: "#6C63FF", color2: "#8B5CF6" },
  { id: "medical", name: "CarePoint Clinic", icon: "🏥", color: "#00BCD4", color2: "#0097A7" },
  { id: "barbershop", name: "Sharp Cuts", icon: "✂️", color: "#FF4081", color2: "#F50057" },
  { id: "lawfirm", name: "Apex Legal", icon: "⚖️", color: "#FFB300", color2: "#FF8F00" },
];

// ── Main App ──
export default function AgentBase() {
  const [activeTab, setActiveTab] = useState("demo");
  const [activeBiz, setActiveBiz] = useState(0);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, hot: 0, warm: 0, cold: 0, appointments: 0 });

  const fetchLeads = async () => {
    try {
      const [leadsRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/leads`),
        fetch(`${BACKEND_URL}/stats`)
      ]);
      setLeads(await leadsRes.json());
      setStats(await statsRes.json());
    } catch (e) {}
  };

  useEffect(() => { fetchLeads(); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e0e0e0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:4px}
      `}</style>

      {/* Header */}
      <header style={{ padding: "16px 28px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(8,8,8,0.95)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #6C63FF, #FF6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>⚡</div>
          <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px" }}>AgentBase</span>
          <span style={{ background: "rgba(108,99,255,0.15)", color: "#6C63FF", fontSize: "9px", padding: "2px 7px", borderRadius: "4px", fontFamily: "'DM Mono', monospace" }}>AI AGENTS</span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {[["demo", "🎯 Demo"], ["dashboard", "📊 Dashboard"]].map(([t, l]) => (
            <button key={t} onClick={() => { setActiveTab(t); if (t === "dashboard") fetchLeads(); }} style={{
              padding: "8px 16px", borderRadius: "9px", border: "none", cursor: "pointer",
              background: activeTab === t ? "#1a1a1a" : "transparent",
              color: activeTab === t ? "#fff" : "#555", fontSize: "12px", fontWeight: "600"
            }}>{l}</button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 20px 60px" }}>

        {/* Demo tab */}
        {activeTab === "demo" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: "28px" }}>
              <div style={{ color: "#6C63FF", fontSize: "10px", letterSpacing: "4px", fontFamily: "'DM Mono', monospace", marginBottom: "10px" }}>LIVE DEMO</div>
              <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: "700", letterSpacing: "-1px", marginBottom: "8px" }}>
                AI Agents, plug & play.
              </h1>
              <p style={{ color: "#555", fontSize: "14px", maxWidth: "480px", lineHeight: "1.6" }}>
                Each agent qualifies leads, books appointments, and scores prospects automatically. Switch between businesses below.
              </p>
            </div>

            {/* Business switcher */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {BUSINESSES.map((b, i) => (
                <button key={b.id} onClick={() => setActiveBiz(i)} style={{
                  padding: "10px 18px", borderRadius: "12px", cursor: "pointer",
                  border: `1.5px solid ${activeBiz === i ? b.color : "#1a1a1a"}`,
                  background: activeBiz === i ? `rgba(${b.color === "#FF6B35" ? "255,107,53" : "108,99,255"},0.1)` : "#0d0d0d",
                  color: activeBiz === i ? "#fff" : "#555",
                  fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "7px",
                  transition: "all 0.15s"
                }}>
                  {b.icon} {b.name}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
              <ChatWidget key={activeBiz} business={BUSINESSES[activeBiz]} onLeadUpdate={fetchLeads} />

              {/* How it works */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "20px" }}>
                  <div style={{ color: "#555", fontSize: "9px", letterSpacing: "2px", fontFamily: "'DM Mono', monospace", marginBottom: "14px" }}>HOW IT WORKS</div>
                  {[
                    { icon: "💬", title: "Visitor chats", desc: "24/7 AI handles all inbound inquiries instantly" },
                    { icon: "🎯", title: "AI qualifies", desc: "Extracts budget, timeline, requirements automatically" },
                    { icon: "📅", title: "Books appointment", desc: "Offers and confirms viewings or test drives" },
                    { icon: "🔥", title: "Scores the lead", desc: "HOT / WARM / COLD based on intent signals" },
                    { icon: "📊", title: "Dashboard updates", desc: "You see everything in real-time, no manual work" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: i < 4 ? "1px solid #111" : "none" }}>
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>{s.icon}</span>
                      <div>
                        <div style={{ color: "#ccc", fontSize: "12px", fontWeight: "600" }}>{s.title}</div>
                        <div style={{ color: "#444", fontSize: "11px", marginTop: "2px" }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick stats */}
                <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "16px" }}>
                  <div style={{ color: "#555", fontSize: "9px", letterSpacing: "2px", fontFamily: "'DM Mono', monospace", marginBottom: "12px" }}>LIVE STATS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {[
                      { label: "Total Leads", value: stats.total, color: "#6C63FF" },
                      { label: "Hot Leads", value: stats.hot, color: "#ff4444" },
                      { label: "Appointments", value: stats.appointments, color: "#4CAF50" },
                      { label: "Warm Leads", value: stats.warm, color: "#ff9800" },
                    ].map(s => (
                      <div key={s.label} style={{ background: "#111", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                        <div style={{ color: s.color, fontFamily: "'Clash Display', sans-serif", fontSize: "22px", fontWeight: "700" }}>{s.value}</div>
                        <div style={{ color: "#333", fontSize: "9px", letterSpacing: "1px", fontFamily: "'DM Mono', monospace" }}>{s.label.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard tab */}
        {activeTab === "dashboard" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ color: "#6C63FF", fontSize: "10px", letterSpacing: "4px", fontFamily: "'DM Mono', monospace", marginBottom: "10px" }}>LEAD DASHBOARD</div>
              <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "700", letterSpacing: "-1px" }}>All Leads</h1>
            </div>
            <Dashboard leads={leads} stats={stats} onRefresh={fetchLeads} businesses={BUSINESSES} />
          </div>
        )}
      </main>
    </div>
  );
}
