import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Play, Volume2, BookOpen } from 'lucide-react'
import MemoryNook from './MemoryNook'

export default function Memories({ user, elderId, setCurrentTab }) {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)

  useEffect(() => {
    fetchMemories()
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const playMemorySpeech = (memory) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      
      if (currentlyPlaying === memory.id) {
        setCurrentlyPlaying(null)
        return
      }

      setCurrentlyPlaying(memory.id)
      const utterance = new SpeechSynthesisUtterance(memory.transcript)
      
      // Auto-detect and default to gu-IN
      const hasGujarati = /[\u0a80-\u0aff]/.test(memory.transcript)
      utterance.lang = 'gu-IN' // Force Gujarati voice system-wide if possible, or fallback if text is Gujarati
      
      // Search available voices specifically for a Gujarati voice
      const voices = window.speechSynthesis.getVoices()
      const guVoice = voices.find(v => v.lang.startsWith('gu') || v.lang.includes('Gujarati'))
      if (guVoice) {
        utterance.voice = guVoice
      }

      // Elder-friendly configurations: slower pace (polite, clear) and normal pitch
      utterance.rate = 0.78 
      utterance.pitch = 1.05
      
      utterance.onend = () => {
        setCurrentlyPlaying(null)
      }
      utterance.onerror = () => {
        setCurrentlyPlaying(null)
      }

      window.speechSynthesis.speak(utterance)
    } else {
      alert("Text-to-speech not supported in this browser.")
    }
  }

  const fetchMemories = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_BASE}/api/memory/list?user_id=${elderId}`)
      const data = await res.json()
      setMemories(data)
      setLoading(false)
    } catch (e) {
      console.error(e)
    }
  }



  return (
    <div className="flex flex-col gap-8 items-center mt-2 max-w-4xl mx-auto w-full pb-36 animate-fade-in text-[#5c4a3d]">
      
      {/* Back navigation */}
      <button 
        onClick={() => setCurrentTab('home')} 
        className="self-start bg-white hover:bg-orange-50/50 border-4 border-[#e8dcc4] text-[#8b5a2b] font-bold text-xl md:text-2xl py-3 px-6 rounded-full shadow-md flex items-center gap-3 transition-all active:scale-95"
      >
        <span className="text-2xl md:text-3xl">⬅️</span> Back
      </button>

      {/* Header Card */}
      <div className="w-full bg-[#fdfbf7] border-4 border-[#e8dcc4] rounded-[2.5rem] p-8 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/30 rounded-full blur-2xl"></div>
        <h2 className="text-4xl md:text-5xl font-display font-black text-[#5c4a3d] mb-2">Your Memories</h2>
        <p className="text-lg md:text-xl font-bold text-[#7a6352]">Your beautiful life stories and sweet memories</p>
      </div>

      {/* Memory Nook - Input & Actions */}
      <MemoryNook user={user} elderId={elderId} />

      {/* Memories Feed */}
      <div className="w-full flex flex-col gap-6 mt-4">
        {loading ? (
          <p className="text-xl md:text-2xl font-bold text-[#7a6352] animate-pulse">Loading...</p>
        ) : memories.length === 0 ? (
          null
        ) : (
          memories.map((m, i) => {
            const isAudio = m.duration_secs > 0
            const Icon = isAudio ? Mic : BookOpen
            
            return (
              <div 
                key={m.id} 
                className="bg-[#fdfbf7] border-4 border-[#e8dcc4] rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-4 shadow-md hover:shadow-lg transition-shadow animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-[#eecbb9] flex items-center justify-center text-[#d9774e] shadow-inner flex-shrink-0">
                      <Icon size={32} />
                    </div>
                    <div>
                      <p className="font-extrabold text-2xl md:text-3xl text-[#5c4a3d] leading-snug">{m.title}</p>
                      <p className="text-lg font-bold text-[#7a6352]">
                        {new Date(m.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => playMemorySpeech(m)}
                    className={`self-end sm:self-auto font-bold px-6 py-3.5 rounded-2xl flex items-center gap-3 transition-all border-4 text-lg md:text-xl shadow-md ${
                      currentlyPlaying === m.id 
                        ? 'bg-red-50 border-red-200 text-red-600 animate-pulse hover:bg-red-100' 
                        : 'bg-[#d9774e]/10 border-[#eecbb9] text-[#b55330] hover:bg-[#d9774e] hover:text-white'
                    }`}
                  >
                    {currentlyPlaying === m.id ? (
                      <Square fill="currentColor" className="w-6 h-6 md:w-7 md:h-7" />
                    ) : (
                      <Play fill="currentColor" className="w-6 h-6 md:w-7 md:h-7" />
                    )}
                    <span className="text-left font-extrabold">
                      {currentlyPlaying === m.id ? (
                        <>Pause</>
                      ) : (
                        <>Listen</>
                      )}
                    </span>
                  </button>
                </div>

                {m.transcript && (
                  <div className="text-xl md:text-2xl text-[#7a6352] font-semibold leading-relaxed border-l-4 border-orange-200 pl-4 bg-orange-50/10 p-4 rounded-2xl">
                    "{m.transcript}"
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
