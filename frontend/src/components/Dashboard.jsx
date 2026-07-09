import { useState, useEffect } from 'react'
import { 
  Heart, Camera, Mic, Edit3, Clock, Sparkles, CheckCircle2, 
  AlertTriangle, ChevronRight, X, Volume2, ShieldCheck, RefreshCw 
} from 'lucide-react'

export default function Dashboard({ familyGroupId, elderId, alerts, setAlerts, setCurrentView, user }) {
  const [elder, setElder] = useState(null)
  const [activities, setActivities] = useState([])
  const [photos, setPhotos] = useState([])
  const [isOnline, setIsOnline] = useState(false)
  const [lastActiveTime, setLastActiveTime] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeModal, setActiveModal] = useState(null) // 'voice' | 'photo' | 'note' | 'wellbeing'
  
  // Note Modal States
  const [noteText, setNoteText] = useState('')
  
  // Photo Modal States
  const [uploadPhoto, setUploadPhoto] = useState(null)
  const [uploadTag, setUploadTag] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  
  // Voice Modal States
  const [isRecording, setIsRecording] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [recognition, setRecognition] = useState(null)

  // Well-being reminder states
  const [wellbeingReminder, setWellbeingReminder] = useState({
    enabled: false,
    time: '10:00',
    type: 'daily'
  })

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Elder User profile
      const userRes = await fetch(`${API_BASE}/api/auth/users?is_elder=true`)
      let currentElder = null
      if (userRes.ok) {
        const users = await userRes.json()
        currentElder = users.find(u => u.family_group_id === familyGroupId && u.is_elder) || users.find(u => u.is_elder) || users[0]
        setElder(currentElder)
      }

      const targetElderId = currentElder ? currentElder.id : elderId

      // 2. Fetch Activity Feed (Baa's Day at a Glance)
      const feedRes = await fetch(`${API_BASE}/api/family/feed?family_group_id=${familyGroupId}`)
      if (feedRes.ok) {
        const feedData = await feedRes.json()
        setActivities(feedData.slice(0, 5)) // Get latest 5 events
      }

      // 3. Fetch Recent Memories (Baa's Memory Nook photos)
      const photoRes = await fetch(`${API_BASE}/api/photo/list?user_id=${targetElderId}`)
      if (photoRes.ok) {
        const groupedPhotos = await photoRes.json()
        // Flatten photos
        const flatPhotos = groupedPhotos.flatMap(group => 
          group.photos.map(p => ({ ...p, event_tag: group.event_tag }))
        ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setPhotos(flatPhotos)
      }
      // 4. Fetch Elder online status heartbeat
      if (targetElderId) {
        const statusRes = await fetch(`${API_BASE}/api/elder/${targetElderId}/status`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setIsOnline(statusData.online)
          setLastActiveTime(statusData.last_active)
        }
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 10000)
    return () => clearInterval(interval)
  }, [elderId, familyGroupId])

  // Set up Speech Recognition for voice message helper
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onresult = (e) => {
        const text = e.results[0][0].transcript
        setVoiceText(text)
        setIsRecording(false)
      }

      rec.onerror = () => {
        setIsRecording(false)
      }

      setRecognition(rec)
    }
  }, [])

  const startVoiceRecording = () => {
    if (recognition) {
      setVoiceText('')
      setIsRecording(true)
      recognition.start()
    } else {
      alert('Speech recognition is not supported in this browser. Please type your note instead.')
    }
  }

  const stopVoiceRecording = () => {
    if (recognition) {
      recognition.stop()
      setIsRecording(false)
    }
  }

  const handleSendNudge = async (medicineName) => {
    try {
      await fetch(`${API_BASE}/api/family/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: elderId, message: `Reminder for medicine: ${medicineName}` })
      })
      setAlerts(prev => prev.filter(a => !a.includes(medicineName)))
      fetchDashboardData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/family/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: elderId, message: noteText.trim() })
      })
      if (res.ok) {
        setNoteText('')
        setActiveModal(null)
        fetchDashboardData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendVoice = async (e) => {
    e.preventDefault()
    if (!voiceText.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/family/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: elderId, message: voiceText.trim() })
      })
      if (res.ok) {
        setVoiceText('')
        setActiveModal(null)
        fetchDashboardData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    e.preventDefault()
    if (!uploadPhoto) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('user_id', elderId)
      formData.append('photo', uploadPhoto)
      if (uploadTag.trim()) {
        formData.append('event_tag', uploadTag.trim())
      }
      
      const res = await fetch(`${API_BASE}/api/photo/upload`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        setUploadPhoto(null)
        setUploadTag('')
        setPhotoPreview(null)
        setActiveModal(null)
        fetchDashboardData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const formatActivityText = (event) => {
    try {
      const payload = JSON.parse(event.payload)
      const elderName = elder?.name || 'Baa'
      
      switch (event.event_type) {
        case 'memory_recorded':
          return `Shared a new memory: "${payload.title || 'Untitled'}"`
        case 'mood_logged':
          return `Felt ${payload.mood || 'Good'} ${payload.emoji || '😌'}`
        case 'medicine_taken':
          return `Took medicine: ${payload.medicine_name || 'Prescription'}`
        case 'emergency_alert':
          return `🚨 Emergency Alert: ${payload.message}`
        case 'nudge_sent':
          return `Caregiver sent a medicine nudge reminder: "${payload.message}"`
        case 'voice_message':
          return `Received a family note: "${payload.message}"`
        case 'photo_shared':
          return `Added photos to the Memory Nook`
        case 'circle_post_created':
          return `Shared a new post in "${payload.category || 'Worldwide Circles'}"`
        default:
          return `Logged activity: ${event.event_type}`
      }
    } catch (err) {
      return `Logged activity: ${event.event_type}`
    }
  }

  const formatTimeAgo = (dateStr) => {
    const now = new Date()
    const past = new Date(dateStr)
    const diffMs = now - past
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays}d ago`
  }

  const getDualTimeText = (dateStr) => {
    if (!dateStr) return '';
    const elderTz = elder?.timezone || 'Asia/Kolkata';
    const familyTz = user?.timezone || 'America/Toronto';
    const elderLoc = elder?.location?.split(',')[0] || 'Ahmedabad';
    const familyLoc = user?.location?.split(',')[0] || 'Toronto';

    try {
      const date = new Date(dateStr);
      const elderTime = date.toLocaleTimeString([], { timeZone: elderTz, hour: '2-digit', minute: '2-digit', hour12: true });
      const familyTime = date.toLocaleTimeString([], { timeZone: familyTz, hour: '2-digit', minute: '2-digit', hour12: true });
      return `${familyTime} ${familyLoc} time / ${elderTime} ${elderLoc} time`;
    } catch (e) {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  const getElderNameString = () => {
    if (!elder) return 'Baa (Kamala Shah)'
    return `Baa (${elder.preferred_name || elder.name})`
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
      
      {/* Alert Header if any medicine overdue */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-100 p-5 rounded-3xl shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-red-900 font-bold text-lg">Action Required</h3>
              {alerts.map((a, i) => <p key={i} className="text-red-700 text-sm font-medium">{a}</p>)}
            </div>
          </div>
          <button 
            onClick={() => handleSendNudge(alerts[0].split('medicine: ')[1]?.split(' (')[0] || '')}
            className="bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-2xl font-bold hover:bg-red-50 transition-colors shadow-sm active:scale-95 text-sm"
          >
            Send Nudge
          </button>
        </div>
      )}

      {/* 1. Header Card (Connected Status) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-3xl">
            🤝
          </div>
          <div>
            <h1 className="text-2xl font-black font-display text-gray-900 tracking-tight">HeartBridge Family</h1>
            {elder?.location && user?.location && (
              <div className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-0.5 mt-1 tracking-wide inline-flex items-center gap-1.5 shadow-sm">
                ✈️ {elder.preferred_name || elder.name.split(' ')[0]} ({elder.location}) ➔ You ({user.name.split(' ')[0]}) ({user.location})
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-gray-500 font-semibold">
              <span>Connected to:</span>
              <span className="text-family-primary">{getElderNameString()}</span>
              <span className="text-gray-300">•</span>
              <span>Last active:</span>
              <span className="text-gray-700">
                {isOnline ? 'Just now' : (lastActiveTime && lastActiveTime !== 'Never' ? formatTimeAgo(lastActiveTime) : 'Today')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDashboardData}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl transition-all border border-gray-100 active:scale-95"
            title="Refresh Dashboard"
          >
            <RefreshCw size={18} />
          </button>
          <div className={`${isOnline ? 'bg-green-50 text-green-700 border-green-100/60' : 'bg-gray-50 text-gray-500 border-gray-200'} font-extrabold px-4 py-2 rounded-2xl text-xs border flex items-center gap-2`}>
            <span className={`w-2.5 h-2.5 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'} rounded-full`}></span>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 2. Baa's Day at a Glance Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold font-display text-gray-900 flex items-center gap-2">
                <span>🌞</span> {elder?.name ? `${elder.name.toUpperCase()}'S` : "BAA'S"} DAY AT A GLANCE
              </h2>
            </div>
            
            <div className="flex flex-col gap-4">
              {activities.length === 0 ? (
                <p className="text-gray-400 font-medium py-4 text-center">No activities recorded today.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex gap-3 items-start border-l-2 border-indigo-50 pl-4 py-1 relative">
                    <div className="absolute -left-1.5 top-2.5 w-2.5 h-2.5 bg-[#4F46E5] rounded-full border-2 border-white shadow-sm"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">
                        {formatActivityText(act)}
                      </p>
                      <span className="text-xs text-gray-400 font-medium flex flex-col gap-0.5 mt-1">
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatTimeAgo(act.created_at)}</span>
                        <span className="text-[10px] text-gray-400/80 font-bold tracking-wide">{getDualTimeText(act.created_at)}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <button 
            onClick={() => setCurrentView('overview')}
            className="mt-6 w-full text-center py-3 bg-gray-50 hover:bg-gray-100 text-sm font-bold text-gray-600 rounded-2xl transition-colors active:scale-[0.99]"
          >
            View Full Activity
          </button>
        </div>

        {/* 3. Recent Memories Panel */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-gray-900 mb-5 flex items-center gap-2">
              <span>📸</span> RECENT MEMORIES
            </h2>
            
            {photos.length === 0 ? (
              <div className="h-44 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-gray-50/50">
                <Camera size={32} className="text-gray-300 mb-2" />
                <p className="text-gray-400 font-medium text-sm">No photos in the Memory Nook yet.</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                {photos.slice(0, 5).map((p) => (
                  <div key={p.id} className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 group shadow-sm">
                    <img 
                      src={`${API_BASE}/${p.file_path}`} 
                      alt={p.event_tag} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2">
                      <span className="text-[10px] bg-white/20 backdrop-blur text-white font-extrabold px-1.5 py-0.5 rounded-md">
                        {p.event_tag || 'Memory'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setCurrentView('memory_nook')}
            className="mt-6 w-full text-center py-3 bg-indigo-50/60 hover:bg-indigo-100/60 text-sm font-bold text-family-primary rounded-2xl transition-colors active:scale-[0.99]"
          >
            See Memory Nook
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 4. Send Some Love Actions Panel */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-gray-900 mb-5 flex items-center gap-2">
              <span>💌</span> SEND SOME LOVE
            </h2>
            <p className="text-gray-500 text-sm font-semibold mb-6">Send messages, voice recordings, or photos directly to Baa's screen.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setActiveModal('voice')}
                className="flex items-center justify-between p-4 bg-red-50/40 hover:bg-red-50 text-red-700 border border-red-100/40 rounded-2xl font-bold transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎤</span>
                  <span>Record a Voice Message</span>
                </div>
                <ChevronRight size={16} />
              </button>
              
              <button 
                onClick={() => setActiveModal('photo')}
                className="flex items-center justify-between p-4 bg-orange-50/40 hover:bg-orange-50 text-orange-700 border border-orange-100/40 rounded-2xl font-bold transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📸</span>
                  <span>Send a Photo to Memory Nook</span>
                </div>
                <ChevronRight size={16} />
              </button>
              
              <button 
                onClick={() => setActiveModal('note')}
                className="flex items-center justify-between p-4 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 border border-indigo-100/40 rounded-2xl font-bold transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  <span>Write a Note</span>
                </div>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 5. Well-being Bento Box */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-gray-900 mb-4 flex items-center gap-2">
              <span>🤍</span> WELL-BEING <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">Opt-in only</span>
            </h2>
            
            <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-2xl mb-4 flex items-start gap-3">
              <ShieldCheck className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-emerald-900 text-sm font-bold">Baa has been active recently.</p>
                <p className="text-emerald-700 text-xs font-semibold mt-0.5">
                  Her daily mood check-ins are logged and medicine status is normal.
                </p>
              </div>
            </div>

            {wellbeingReminder.enabled ? (
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-indigo-900">Check-in Reminder Active</p>
                  <p className="text-indigo-700 text-xs font-semibold mt-0.5">
                    {wellbeingReminder.type === 'daily' ? 'Daily' : 'Weekly'} notification set for {wellbeingReminder.time}
                  </p>
                </div>
                <button 
                  onClick={() => setWellbeingReminder(prev => ({ ...prev, enabled: false }))}
                  className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                >
                  Disable
                </button>
              </div>
            ) : (
              <p className="text-gray-400 font-semibold text-xs leading-normal">
                Set up automated gentle check-in reminders. If Baa doesn't log her mood or take medicine on time, we will send you an SMS or notification request.
              </p>
            )}
          </div>
          
          <button 
            onClick={() => setActiveModal('wellbeing')}
            className="mt-6 w-full text-center py-3 bg-gray-50 hover:bg-gray-100 text-sm font-bold text-gray-600 rounded-2xl transition-colors active:scale-[0.99]"
          >
            {wellbeingReminder.enabled ? 'Configure Reminder settings' : 'Set up gentle check-in reminder'}
          </button>
        </div>

      </div>

      {/* --- MODALS --- */}
      
      {/* Note Modal */}
      {activeModal === 'note' && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📝</span> Write a Note for Baa
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSendNote} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Note Content</label>
                <textarea 
                  required 
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-family-primary outline-none text-sm min-h-[120px]" 
                  placeholder="e.g. Good morning Baa, hope you have a wonderful day! Sending love."
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-family-primary text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-colors active:scale-95 text-sm shadow-md flex justify-center items-center"
              >
                {loading ? 'Sending...' : 'Send Note'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Voice Modal */}
      {activeModal === 'voice' && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🎤</span> Record a Voice Message
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSendVoice} className="flex flex-col gap-5 items-center py-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  <Mic size={36} />
                </button>
                <span className="text-sm font-bold text-gray-600">
                  {isRecording ? 'Listening... Tap to stop' : 'Tap to Start Recording'}
                </span>
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Voice Transcript</label>
                <textarea
                  value={voiceText}
                  onChange={e => setVoiceText(e.target.value)}
                  placeholder="Your spoken words will appear here. You can also edit it manually."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-family-primary outline-none text-sm min-h-[80px]"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !voiceText.trim()}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-2xl hover:bg-red-700 transition-colors active:scale-95 text-sm shadow-md flex justify-center items-center disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Voice Note'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {activeModal === 'photo' && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>📸</span> Send a Photo to Memory Nook
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePhotoUpload} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Select Image</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-family-primary bg-gray-50 rounded-2xl p-6 cursor-pointer hover:bg-indigo-50/20 transition-all text-center">
                  <input 
                    required
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="max-h-32 object-contain rounded-lg" />
                  ) : (
                    <>
                      <Camera size={32} className="text-gray-400 mb-1.5" />
                      <span className="text-sm font-bold text-gray-600">Choose file from device</span>
                    </>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Event Folder Tag (Optional)</label>
                <input 
                  type="text" 
                  value={uploadTag}
                  onChange={e => setUploadTag(e.target.value)}
                  placeholder="e.g. Holi, Birthday, Picnic"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-family-primary outline-none text-sm" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !uploadPhoto}
                className="bg-orange-600 text-white font-bold py-3 rounded-2xl hover:bg-orange-700 transition-colors active:scale-95 text-sm shadow-md flex justify-center items-center disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Send Photo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Well-being Configuration Modal */}
      {activeModal === 'wellbeing' && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🤍</span> Well-being Reminder Config
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Gentle check-in reminder</span>
                <button 
                  onClick={() => setWellbeingReminder(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all border ${wellbeingReminder.enabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                >
                  {wellbeingReminder.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {wellbeingReminder.enabled && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Reminder Frequency</label>
                    <div className="flex gap-2">
                      {['daily', 'weekly'].map(freq => (
                        <button
                          key={freq}
                          onClick={() => setWellbeingReminder(prev => ({ ...prev, type: freq }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${wellbeingReminder.type === freq ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Time of Day</label>
                    <input 
                      type="time" 
                      value={wellbeingReminder.time}
                      onChange={e => setWellbeingReminder(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-family-primary outline-none text-sm" 
                    />
                  </div>
                </>
              )}

              <button 
                onClick={() => setActiveModal(null)}
                className="bg-family-primary text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-colors active:scale-95 text-sm shadow-md mt-2"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
