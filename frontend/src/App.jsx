import { useState, useEffect } from 'react'
import { Home as HomeIcon, Mic, Pill, LayoutDashboard, Users, Settings, Bell, Search, HeartPulse, LogOut, Globe, Image as ImageIcon, X, Cpu } from 'lucide-react'
import Home from './components/Home'
import Memories from './components/Memories'
import Medicine from './components/Medicine'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import FamilyGroup from './components/FamilyGroup'
import SettingsView from './components/SettingsView'
import VoiceAssistant from './components/VoiceAssistant'
import MemoryNook from './components/MemoryNook'
import WorldwideCircles from './components/WorldwideCircles'
import FamilyCircles from './components/FamilyCircles'
import ElderSettings from './components/ElderSettings'
import MedicineTracker from './components/MedicineTracker'
import AiAnalytics from './components/AiAnalytics'

export default function App() {
  const [currentTab, setCurrentTab] = useState('home')
  const [currentView, setCurrentView] = useState('overview')
  const [alerts, setAlerts] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showElderNotifications, setShowElderNotifications] = useState(false)
  const [elderNotifications, setElderNotifications] = useState([])
  const [feedNotifications, setFeedNotifications] = useState([])
  const [user, setUser] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [appointments, setAppointments] = useState([])
  const [initialCircleCategory, setInitialCircleCategory] = useState(null)
  const [hideBottomNav, setHideBottomNav] = useState(false)
  const [elder, setElder] = useState(null)

  useEffect(() => {
    const handleModalState = (e) => {
      setHideBottomNav(!!e.detail?.open)
    }
    window.addEventListener('modal-state', handleModalState)
    return () => window.removeEventListener('modal-state', handleModalState)
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('modal-state', { detail: { open: showElderNotifications } }))
  }, [showElderNotifications])

  useEffect(() => {
    if (!user || !user.is_elder) return
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const loadElderNotifications = async () => {
      try {
        const tempNotifs = []
        const medRes = await fetch(`${API_BASE}/api/medicine/today?user_id=${user.id}`)
        if (medRes.ok) {
          const medData = await medRes.json()
          const now = new Date()
          medData.forEach(m => {
            if (m.taken) return
            
            const schedTime = new Date(m.scheduled_at)
            const diffMs = now - schedTime
            
            if (diffMs >= 15 * 60 * 1000) {
              // 15+ minutes overdue
              tempNotifs.push({
                id: `med-missed-${m.medicine_id}-${m.scheduled_at}`,
                type: 'medicine_missed',
                titleGu: `Missed medicine: ${m.name} (${m.dose})`,
                titleEn: `Missed medicine: ${m.name} (${m.dose})`,
                time: m.scheduled_at,
                icon: '🚨'
              })
            } else if (diffMs >= 0 && diffMs < 15 * 60 * 1000) {
              // Due right now (up to 15 mins after scheduled time)
              tempNotifs.push({
                id: `med-due-${m.medicine_id}-${m.scheduled_at}`,
                type: 'medicine_due',
                titleGu: `Time to take medicine: ${m.name} (${m.dose})`,
                titleEn: `Time to take medicine: ${m.name} (${m.dose})`,
                time: m.scheduled_at,
                icon: '💊'
              })
            } else if (diffMs < 0 && Math.abs(diffMs) <= 30 * 60 * 1000) {
              // Upcoming in the next 30 minutes
              tempNotifs.push({
                id: `med-upcoming-${m.medicine_id}-${m.scheduled_at}`,
                type: 'medicine_upcoming',
                titleGu: `Upcoming medicine: ${m.name} (${m.dose})`,
                titleEn: `Upcoming medicine reminder: ${m.name} (${m.dose})`,
                time: m.scheduled_at,
                icon: '⏰'
              })
            }
          })
        }
        
        if (user.family_group_id) {
          const feedRes = await fetch(`${API_BASE}/api/family/feed?family_group_id=${user.family_group_id}`)
          if (feedRes.ok) {
            const feedData = await feedRes.json()
            const messages = feedData.filter(evt => evt.event_type === 'voice_message' || evt.event_type === 'nudge_sent')
            messages.slice(0, 5).forEach(msg => {
              const payload = JSON.parse(msg.payload)
              const isNudge = msg.event_type === 'nudge_sent'
              tempNotifs.push({
                id: `${isNudge ? 'nudge' : 'msg'}-${msg.id}`,
                type: isNudge ? 'nudge' : 'message',
                titleGu: isNudge ? `Attention: "${payload.message}"` : `Family message: "${payload.message}"`,
                titleEn: isNudge ? `Nudge: "${payload.message}"` : `Family love: "${payload.message}"`,
                time: msg.created_at,
                icon: isNudge ? '🔔' : '💬'
              })
            })
          }
        }
        setElderNotifications(tempNotifs)
      } catch (err) {
        console.error(err)
      }
    }

    loadElderNotifications()
    const interval = setInterval(loadElderNotifications, 10000)
    return () => clearInterval(interval)
  }, [user, medicines])

  useEffect(() => {
    // Check elder permanent session
    const savedElder = localStorage.getItem('elderUser')
    if (savedElder) {
      setUser(JSON.parse(savedElder))
      return
    }

    // Check family session
    const savedFamily = sessionStorage.getItem('familyUser')
    if (savedFamily) {
      setUser(JSON.parse(savedFamily))
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    fetch(`${API_BASE}/api/auth/users?is_elder=true`)
      .then(res => res.json())
      .then(data => {
        const currentElder = data.find(u => u.family_group_id === user.family_group_id && u.is_elder) || data.find(u => u.is_elder) || data[0]
        setElder(currentElder)
      })
      .catch(err => console.error('Error loading elder info:', err))
  }, [user])

  const elderId = 1 // Default elder user
  const familyGroupId = user?.family_group_id || 1

  const getDynamicAppointments = () => {
    const now = new Date()
    const appt1Time = new Date(now.getTime() + 15 * 60 * 1000) // 15 mins from now
    const appt1HHMM = `${String(appt1Time.getHours()).padStart(2, '0')}:${String(appt1Time.getMinutes()).padStart(2, '0')}`
    
    const appt2Time = new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours from now
    const appt2HHMM = `${String(appt2Time.getHours()).padStart(2, '0')}:${String(appt2Time.getMinutes()).padStart(2, '0')}`

    return [
      { id: 1, title: 'Doctor Checkup', titleGu: 'Doctor Checkup', time: appt1HHMM },
      { id: 2, title: 'Physiotherapy Session', titleGu: 'Physiotherapy Session', time: appt2HHMM }
    ]
  }

  useEffect(() => {
    if (user && user.is_elder) {
      setAppointments(getDynamicAppointments())
    }
  }, [user])

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
  };

  useEffect(() => {
    if (!user) return
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const targetId = user.is_elder ? user.id : elderId
    
    const fetchTodayMedicinesAndFeed = () => {
      fetch(`${API_BASE}/api/medicine/today?user_id=${targetId}`)
        .then(res => res.json())
        .then(data => {
          setMedicines(data)
          if (!user.is_elder) {
            const now = new Date()
            const emergencyMissed = data.filter(m => !m.taken && now - new Date(m.scheduled_at) > 900000) // 15 mins
            const standardMissed = data.filter(m => !m.taken && now - new Date(m.scheduled_at) > 3600000) // 1 hour
            
            const newAlerts = []
            const newFeedNotifs = []
            emergencyMissed.forEach(m => {
              const msg = `🚨 EMERGENCY: ${m.name} was not taken! (15+ minutes overdue) — Overdue since ${getDualTimeText(m.scheduled_at)}`
              newAlerts.push(msg)
              newFeedNotifs.push(msg)
            })
            standardMissed.forEach(m => {
              if (!emergencyMissed.find(em => em.medicine_id === m.medicine_id)) {
                const msg = `Missed medicine: ${m.name} (${m.dose}) at ${getDualTimeText(m.scheduled_at)}`
                newAlerts.push(msg)
                newFeedNotifs.push(msg)
              }
            })

            fetch(`${API_BASE}/api/family/feed?family_group_id=${familyGroupId}`)
              .then(res => res.json())
              .then(feedData => {
                feedData.slice(0, 10).forEach(evt => {
                  const payload = JSON.parse(evt.payload)
                  const dtText = getDualTimeText(evt.created_at);
                  if (evt.event_type === 'memory_recorded') {
                    newFeedNotifs.push(`📸 New Memory: Recorded "${payload.title}" (${dtText})`)
                  } else if (evt.event_type === 'medicine_taken') {
                    newFeedNotifs.push(`✅ Medicine Taken: Taken "${payload.medicine_name}" (${payload.dose}) (${dtText})`)
                  } else if (evt.event_type === 'mood_logged') {
                    newFeedNotifs.push(`😊 Mood Logged: Elder logged feeling "${payload.mood}" (${dtText})`)
                  } else if (evt.event_type === 'photo_uploaded') {
                    newFeedNotifs.push(`🖼️ Photo Added: Tagged "${payload.event_tag}" (${dtText})`)
                  } else if (evt.event_type === 'emergency_alert') {
                    const msg = `⚠️ ALERT: ${payload.message} (${dtText})`
                    newAlerts.push(msg)
                    newFeedNotifs.push(msg)
                  }
                })
                setAlerts(newAlerts)
                setFeedNotifications(newFeedNotifs)
              })
              .catch(e => {
                console.error(e)
                setAlerts(newAlerts)
                setFeedNotifications(newFeedNotifs)
              })
          }
        })
        .catch(e => console.error(e))
    }

    fetchTodayMedicinesAndFeed()
    window.addEventListener('medicine-taken-updated', fetchTodayMedicinesAndFeed)
    const interval = setInterval(fetchTodayMedicinesAndFeed, 10000)
    return () => {
      window.removeEventListener('medicine-taken-updated', fetchTodayMedicinesAndFeed)
      clearInterval(interval)
    }
  }, [elderId, user, familyGroupId, elder])


  const handleLoginSuccess = (userData, role) => {
    if (role === 'elder') {
      localStorage.setItem('elderUser', JSON.stringify(userData))
    } else {
      sessionStorage.setItem('familyUser', JSON.stringify(userData))
    }
    setUser(userData)
  }

  const handleLogout = () => {
    if (user?.is_elder) {
      localStorage.removeItem('elderUser')
    } else {
      sessionStorage.removeItem('familyUser')
    }
    setUser(null)
    setCurrentTab('home')
    setCurrentView('overview')
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen pb-32 flex flex-col relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login_bg.png')" }}
      >
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  // --- ELDER VIEW ---
  if (user.is_elder) {
    return (
      <div className="min-h-screen flex flex-col relative bg-elder-cream text-elder-brown pb-36">
        {/* Decorative Blobs for Glassmorphism Background */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/40 rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-[#4F46E5]/10 rounded-full blur-3xl mix-blend-overlay pointer-events-none" style={{animationDelay: '2s'}}></div>

        <header className="p-8 pt-12 px-8 flex justify-between items-center relative z-10 w-full max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="HeartBridge Logo" className="h-16 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-4 z-20">
            <button
              onClick={() => setShowElderNotifications(true)}
              className="bg-white/60 hover:bg-white border-2 border-[#e8dcc4] text-[#5c4a3d] p-3.5 rounded-2xl shadow transition-all active:scale-95 relative"
              title="Notifications"
            >
              <Bell size={28} />
              {elderNotifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black border-2 border-white animate-bounce">
                  {elderNotifications.length}
                </span>
              )}
            </button>
            
            <button 
              onClick={handleLogout}
              className="bg-red-50/60 hover:bg-red-100/90 border-2 border-red-200/60 text-red-700 text-lg md:text-xl font-bold py-2.5 px-6 rounded-2xl shadow transition-all active:scale-95"
            >
              "Log Out"
            </button>
          </div>
        </header>

        {/* Main Content with subtle transition */}
        <main className="flex-1 p-6 px-8 pb-10 relative z-10 animate-fade-in">
          {currentTab === 'home' && <Home user={user} elderId={user.id} setCurrentTab={setCurrentTab} setInitialCircleCategory={setInitialCircleCategory} />}
          {currentTab === 'memories' && <Memories user={user} elderId={user.id} setCurrentTab={setCurrentTab} />}
          {currentTab === 'medicine' && <Medicine user={user} elderId={user.id} setCurrentTab={setCurrentTab} />}
          {currentTab === 'worldwide' && <WorldwideCircles user={user} initialCategory={initialCircleCategory} onClearCategory={() => setInitialCircleCategory(null)} />}
          {currentTab === 'profile' && <ElderSettings user={user} onLogout={handleLogout} />}
        </main>

        {/* Floating Glassmorphic Bottom Nav */}
        {!hideBottomNav && (
          <div className="fixed bottom-8 left-0 w-full px-6 z-50">
            <nav className="glass-panel rounded-full flex justify-around p-4 shadow-2xl border border-white/60 bg-white/50 backdrop-blur-md">
              <button 
                onClick={() => setCurrentTab('home')}
                className={`flex flex-col items-center p-3 rounded-[2rem] transition-all duration-300 ${currentTab === 'home' ? 'bg-[#4F46E5] text-white shadow-md transform scale-110' : 'text-elder-brown hover:bg-white/50'}`}
              >
                <HomeIcon size={44} strokeWidth={currentTab === 'home' ? 3 : 2} />
                <span className="font-bold mt-2 text-xl tracking-wide">"Home"</span>
              </button>
              
              <button 
                onClick={() => setCurrentTab('memories')}
                className={`flex flex-col items-center p-3 rounded-[2rem] transition-all duration-300 ${currentTab === 'memories' ? 'bg-[#4F46E5] text-white shadow-md transform scale-110' : 'text-elder-brown hover:bg-white/50'}`}
              >
                <Mic size={44} strokeWidth={currentTab === 'memories' ? 3 : 2} />
                <span className="font-bold mt-2 text-xl tracking-wide">"Memories"</span>
              </button>
              
              <button 
                onClick={() => setCurrentTab('medicine')}
                className={`flex flex-col items-center p-3 rounded-[2rem] transition-all duration-300 ${currentTab === 'medicine' ? 'bg-[#4F46E5] text-white shadow-md transform scale-110' : 'text-elder-brown hover:bg-white/50'}`}
              >
                <Pill size={44} strokeWidth={currentTab === 'medicine' ? 3 : 2} />
                <span className="font-bold mt-2 text-xl tracking-wide">"Medicine"</span>
              </button>
              
              <button 
                onClick={() => setCurrentTab('worldwide')}
                className={`flex flex-col items-center p-3 rounded-[2rem] transition-all duration-300 ${currentTab === 'worldwide' ? 'bg-[#4F46E5] text-white shadow-md transform scale-110' : 'text-elder-brown hover:bg-white/50'}`}
              >
                <Globe size={44} strokeWidth={currentTab === 'worldwide' ? 3 : 2} />
                <span className="font-bold mt-2 text-xl tracking-wide">"World"</span>
              </button>

              <button 
                onClick={() => setCurrentTab('profile')}
                className={`flex flex-col items-center p-3 rounded-[2rem] transition-all duration-300 ${currentTab === 'profile' ? 'bg-[#4F46E5] text-white shadow-md transform scale-110' : 'text-elder-brown hover:bg-white/50'}`}
              >
                <Settings size={44} strokeWidth={currentTab === 'profile' ? 3 : 2} />
                <span className="font-bold mt-2 text-xl tracking-wide">"Profile"</span>
              </button>
            </nav>
          </div>
        )}

        <VoiceAssistant 
          user={user} 
          elderId={user.id} 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          medicines={medicines}
          appointments={appointments}
        />

        {/* Elder Notifications Modal */}
        {showElderNotifications && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in text-elder-brown">
            <div className="bg-[#fdfbf7] border-4 border-[#e8dcc4] rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowElderNotifications(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-[#5c4a3d] transition-colors"
              >
                <X size={28} />
              </button>

              <h2 className="text-3xl font-black text-center mb-6 flex items-center justify-center gap-2">
                <span>🔔</span> Notifications (Notifications)
              </h2>

              {elderNotifications.length === 0 ? (
                <p className="text-xl text-center text-gray-500 font-bold py-10">No new notifications.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {elderNotifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`border-4 p-5 rounded-3xl shadow-sm flex gap-4 items-start ${
                        n.type === 'medicine' ? 'bg-red-50 border-red-200 text-[#9b4a3a]' : 'bg-orange-50 border-orange-200 text-[#8b5a2b]'
                      }`}
                    >
                      <span className="text-4xl">{n.icon}</span>
                      <div>
                        <p className="text-xl font-black leading-snug">{n.titleGu}</p>
                        <p className="text-sm font-bold text-gray-500 mt-1">({n.titleEn})</p>
                        <span className="text-xs text-gray-400 font-semibold block mt-1.5">
                          ⏰ {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setShowElderNotifications(false)}
                className="mt-6 w-full bg-[#d9774e] hover:bg-[#c2653e] text-white text-xl font-bold py-3.5 rounded-2xl shadow-md transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- FAMILY CAREGIVER VIEW ---
  return (
    <div className="min-h-screen bg-family-bg flex overflow-hidden w-full">
      {/* Sleek Sidebar */}
      <aside className="w-64 glass-sidebar hidden md:flex flex-col z-20 border-r border-gray-100 bg-white">
        <div className="p-4 flex items-center justify-start border-b border-gray-100 flex-shrink-0">
          <img src="/logo.png" alt="HeartBridge Logo" className="h-14 w-auto object-contain" />
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <button onClick={() => setCurrentView('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${currentView === 'overview' ? 'bg-family-primary/10 text-family-primary' : 'text-family-muted hover:bg-gray-50'}`}>
            <LayoutDashboard size={20} />
            Overview
          </button>
          <button onClick={() => setCurrentView('family')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${currentView === 'family' ? 'bg-family-primary/10 text-family-primary' : 'text-family-muted hover:bg-gray-50'}`}>
            <Users size={20} />
            Family Group
          </button>
          <button onClick={() => setCurrentView('memory_nook')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${currentView === 'memory_nook' ? 'bg-[#d9774e]/10 text-[#d9774e]' : 'text-family-muted hover:bg-gray-50'}`}>
            <ImageIcon size={20} />
            Memory Nook
          </button>
          <button onClick={() => setCurrentView('circles')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${currentView === 'circles' ? 'bg-[#769b76]/10 text-[#769b76]' : 'text-family-muted hover:bg-gray-50'}`}>
            <Globe size={20} />
            Elder Circles
          </button>
          <button onClick={() => setCurrentView('medicine')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${currentView === 'medicine' ? 'bg-green-50/80 text-green-700' : 'text-family-muted hover:bg-gray-50'}`}>
            <Pill size={20} />
            Medicines
          </button>
          <button onClick={() => setCurrentView('ai_analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${currentView === 'ai_analytics' ? 'bg-indigo-50/80 text-indigo-700' : 'text-family-muted hover:bg-gray-50'}`}>
            <Cpu size={20} />
            AI Engine Console
          </button>
          <button onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${currentView === 'settings' ? 'bg-family-primary/10 text-family-primary' : 'text-family-muted hover:bg-gray-50'}`}>
            <Settings size={20} />
            Settings
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors text-red-500 hover:bg-red-50/50">
            <LogOut size={20} />
            Logout
          </button>
        </nav>
        
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <img src="/arjun_avatar.png" alt={user.name} className="w-10 h-10 rounded-full shadow-sm object-cover bg-gray-200" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff` }} />
            <div>
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              <p className="text-xs text-family-muted font-medium">Family Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-30">
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm w-96">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="Search memories, events..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-family-primary transition-colors"
            >
              <Bell size={24} />
              {feedNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-fade-in">
                <h3 className="font-bold text-gray-900 mb-3 px-2">Notifications</h3>
                {feedNotifications.length === 0 ? (
                  <p className="text-gray-500 text-sm px-2 py-4">No new notifications.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                    {feedNotifications.map((a, i) => {
                      const isEmergency = a.includes('🚨') || a.includes('⚠️') || a.includes('Missed');
                      return (
                        <div key={i} className={`p-3 rounded-xl border ${isEmergency ? 'bg-red-50 border-red-100 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                          <p className="text-sm font-medium">{a}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        
        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold font-display text-gray-900">
                  Welcome back, {user.name.split(' ')[0]}
                </h2>
                <p className="text-family-muted mt-1">
                  Here is how {elder?.preferred_name || elder?.name || 'Margaret'} is doing today.
                </p>
              </div>
            </div>
            
            <div className="animate-fade-in">
              {currentView === 'overview' && <Dashboard familyGroupId={familyGroupId} elderId={elderId} alerts={alerts} setAlerts={setAlerts} setCurrentView={setCurrentView} user={user} />}
              {currentView === 'family' && <FamilyGroup />}
              {currentView === 'settings' && <SettingsView />}
              {currentView === 'memory_nook' && <MemoryNook isFamilyView={true} user={user} elderId={elderId} />}
              {currentView === 'circles' && <FamilyCircles familyGroupId={familyGroupId} />}
              {currentView === 'medicine' && (
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-soft">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-500">
                      <Pill size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Medicine Adherence</h2>
                  </div>
                  <MedicineTracker elderId={elderId} />
                </div>
              )}
              {currentView === 'ai_analytics' && <AiAnalytics familyGroupId={familyGroupId} elderId={elderId} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
