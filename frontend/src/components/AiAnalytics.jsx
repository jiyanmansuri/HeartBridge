import React, { useState, useEffect } from 'react'
import { Cpu, TrendingDown, Clock, Database, Send, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react'

const API_BASE = 'http://localhost:8000'

export default function AiAnalytics({ familyGroupId, elderId }) {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({
    total_requests: 0,
    total_cost: 0.0,
    baseline_cost: 0.0,
    savings_usd: 0.0,
    savings_pct: 0,
    avg_latency: 0
  })
  const [loading, setLoading] = useState(true)
  const [simText, setSimText] = useState('')
  const [simulating, setSimulating] = useState(false)
  const [expandedLog, setExpandedLog] = useState(null)

  const fetchAuditData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/checkin/audit?family_group_id=${familyGroupId}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setStats(data.stats)
      }
    } catch (err) {
      console.error("Failed to fetch audit data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditData()
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchAuditData, 5000)
    return () => clearInterval(interval)
  }, [familyGroupId])

  const handleSimulate = async (text) => {
    if (!text.trim() || simulating) return
    setSimulating(true)
    try {
      const res = await fetch(`${API_BASE}/api/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: elderId, message: text })
      })
      if (res.ok) {
        setSimText('')
        await fetchAuditData()
      }
    } catch (err) {
      console.error("Failed to simulate checkin", err)
    } finally {
      setSimulating(false)
    }
  }

  const preFills = [
    { text: "I had a warm oatmeal breakfast and took my green vitamin pills.", type: "routine" },
    { text: "My left shoulder is aching and I feel a bit nauseous and dizzy.", type: "distress" },
    { text: "Tell Thomas I found the old photo album in the drawer, it made me smile.", type: "memory" }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Simulation Box */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-soft">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">CascadeFlow & Hindsight Simulation Sandbox</h2>
            <p className="text-sm text-gray-500">Simulate elder messages to test real-time model routing and memory recall logs.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            value={simText}
            onChange={(e) => setSimText(e.target.value)}
            placeholder="Type a simulated elder message... (e.g. 'I feel dizzy today' or 'I took my medicine')"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button
            onClick={() => handleSimulate(simText)}
            disabled={simulating || !simText.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
          >
            <Send size={16} />
            {simulating ? 'Processing...' : 'Run Simulation'}
          </button>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Suggested Test Scenarios</p>
          <div className="flex flex-wrap gap-2">
            {preFills.map((pf, idx) => (
              <button
                key={idx}
                onClick={() => setSimText(pf.text)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  pf.type === 'distress' 
                    ? 'border-red-100 bg-red-50/50 hover:bg-red-50 text-red-700' 
                    : pf.type === 'memory'
                    ? 'border-amber-100 bg-amber-50/50 hover:bg-amber-50 text-amber-700'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                {pf.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Cost Savings Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500">API Cost Savings</span>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
              <TrendingDown size={18} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-green-600">-{stats.savings_pct}%</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Saved ${stats.savings_usd} cumulative</p>
          </div>
        </div>

        {/* Total Cost Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500">Actual API Cost</span>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <span className="font-extrabold text-sm">$</span>
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-gray-900">${stats.total_cost.toFixed(5)}</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Vs. ${stats.baseline_cost.toFixed(5)} baseline</p>
          </div>
        </div>

        {/* Latency Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500">Average Latency</span>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-gray-900">{stats.avg_latency}ms</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Llama-3 response in &lt;300ms</p>
          </div>
        </div>

        {/* Hindsight Memory Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500">Hindsight Memory</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <Database size={18} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-gray-900">{stats.total_requests} Logs</p>
            <p className="text-xs text-gray-400 font-medium mt-1">100% Vector DB context recall</p>
          </div>
        </div>
      </div>

      {/* Real-time Audit Trail Feed */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-950 text-lg">CascadeFlow Routing & Decision Logs</h3>
            <p className="text-xs text-gray-400 font-medium">Real-time audit trail of runtime model select rationale and vector memory fetches.</p>
          </div>
          <button 
            onClick={fetchAuditData} 
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No routing decisions logged yet. Run a simulation above to start!</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => {
              const isExpanded = expandedLog === log.id
              const isFast = log.model_name === 'llama-3.3-70b-versatile'
              return (
                <div key={log.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isFast ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {log.model_name}
                        </span>
                        <span className="text-xs text-gray-400 font-bold">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {log.task_type}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-2">
                        "{log.input_text}"
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold">COST</p>
                        <p className="text-sm font-black text-gray-900">${log.cost.toFixed(5)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold">LATENCY</p>
                        <p className="text-sm font-black text-gray-900">{log.latency_ms}ms</p>
                      </div>
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Decision Audit Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">CascadeFlow Routing Rationale</p>
                          <p className="text-gray-700 leading-relaxed font-medium bg-indigo-50/30 p-3 rounded-xl border border-indigo-50/50">
                            {log.rationale}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-green-700 uppercase tracking-wider mb-1">Agent Response Text</p>
                          <p className="text-gray-700 leading-relaxed italic bg-green-50/20 p-3 rounded-xl border border-green-50/30">
                            "{log.response_text}"
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">Hindsight Vector Memory Recall</p>
                        {log.memories_recalled.length === 0 ? (
                          <p className="text-gray-400 italic text-xs py-2">No historical health context required for this routine request.</p>
                        ) : (
                          <div className="space-y-2">
                            {log.memories_recalled.map((mem, idx) => (
                              <div key={idx} className="bg-amber-50/30 border border-amber-100 p-2.5 rounded-lg text-xs text-amber-900 font-medium">
                                {mem}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
