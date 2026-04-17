import React, { useState, useEffect } from "react";

export default function LeadQualifierFrontend() {
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [leads, setLeads] = useState([]);
  const [superLeads, setSuperLeads] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // initial fetch of recent leads (non-destructive)
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data);
      const supers = data.filter((l) => l.category === "super");
      setSuperLeads(supers);
    } catch (e) {
      console.error(e);
      setError("Could not load leads. Is the backend running?");
    }
  }

  async function handleScore(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: emailText }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to score. Check backend and network.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setError(null);
    await fetchLeads();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6 md:p-10">
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">Lead Qualifier — Dashboard</h1>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Scoring panel */}
          <div className="p-4 border rounded-lg">
            <h2 className="font-medium mb-2">Quick Score (paste email)</h2>
            <form onSubmit={handleScore}>
              <textarea
                className="w-full h-40 p-3 border rounded-md focus:outline-none"
                placeholder="Paste full email text here..."
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm disabled:opacity-60"
                  disabled={loading || !emailText.trim()}
                >
                  {loading ? "Scoring..." : "Score"}
                </button>
                <button
                  type="button"
                  className="px-3 py-2 border rounded-md"
                  onClick={() => { setEmailText(""); setResult(null); }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="ml-auto px-3 py-2 bg-gray-100 rounded-md"
                  onClick={handleRefresh}
                >
                  Refresh Leads
                </button>
              </div>
            </form>
            <div className="mt-4">
              {error && <div className="text-red-600">{error}</div>}
              {result && (
                <div className="mt-3 p-3 border rounded-md bg-gray-50">
                  <div className="text-lg font-semibold">Final score: {result.final_score}</div>
                  <div className="text-sm text-gray-600">Category: {result.category}</div>
                  <div className="mt-2 text-sm">
                    <strong>NLP raw:</strong> {result.nlp_raw} → <strong>NLP part:</strong> {result.nlp_part}
                    <br />
                    <strong>ML prob:</strong> {result.ml_prob} → <strong>ML part:</strong> {result.ml_part}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Leads list */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <h2 className="font-medium mb-2">Recent Leads</h2>
              <div className="text-sm text-gray-500">Total: {leads.length}</div>
            </div>
            <div className="space-y-3 max-h-96 overflow-auto mt-2">
              {leads.length === 0 && <div className="text-gray-500">No leads yet — run the processor or refresh.</div>}
              {leads.map((l) => (
                <div key={l.email_id} className="p-3 border rounded-md bg-white flex justify-between items-start">
                  <div className="w-3/4">
                    <div className="text-sm font-semibold">Score: {l.final_score} — {l.category.toUpperCase()}</div>
                    <div className="text-xs text-gray-600 mt-1 truncate">{l.raw_text}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">NLP: {l.nlp_raw || '—'}</div>
                    <div className="text-xs text-gray-500">ML: {l.ml_part}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <a href="/api/download/good" className="px-3 py-2 bg-green-600 text-white rounded-md text-sm">Download Good</a>
              <a href="/api/download/bad" className="px-3 py-2 bg-red-600 text-white rounded-md text-sm">Download Bad</a>
              <button className="px-3 py-2 border rounded-md ml-auto" onClick={handleRefresh}>Refresh</button>
            </div>
          </div>
        </div>

        {/* Super leads section */}
        <div className="mt-6">
          <h3 className="text-lg font-medium">Super Leads</h3>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            {superLeads.length === 0 && <div className="text-gray-500">No super leads yet.</div>}
            {superLeads.map((s) => (
              <div key={s.email_id} className="p-3 border rounded-lg bg-yellow-50">
                <div className="font-semibold">Score: {s.final_score}</div>
                <div className="text-xs text-gray-700 mt-1 truncate">{s.raw_text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-4 text-xs text-gray-500">Note: This frontend expects backend endpoints: <code>/api/score (POST)</code> and <code>/api/leads (GET)</code>. Adjust the URLs if your API runs on another path or port.</div>
    </div>
  );
}

