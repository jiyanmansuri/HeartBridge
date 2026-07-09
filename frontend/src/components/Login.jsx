import { useState, useEffect } from 'react'
import { HeartPulse, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react'

export default function Login({ onLoginSuccess }) {
  const [role, setRole] = useState(null) // 'elder' or 'family'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customName, setCustomName] = useState('')
  const [familyPassword, setFamilyPassword] = useState('')

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const [singleMode, setSingleMode] = useState(localStorage.getItem('singleElderMode') === 'true')

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/auth/users?is_elder=true`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load profiles')
        return res.json()
      })
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Could not connect to server')
        setLoading(false)
      })
  }, [API_BASE])

  const handleElderLogin = async (name) => {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), is_elder: true })
      })
      if (!res.ok) throw new Error('User not found')
      const userData = await res.json()
      onLoginSuccess(userData, 'elder')
    } catch (err) {
      console.error(err)
      setError('Profile not found. Please try again.')
      setLoading(false)
    }
  }

  const handleFamilyLogin = async (e) => {
    e.preventDefault()
    if (!customName.trim()) {
      setError('Please enter your name.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customName.trim(), is_elder: false })
      })
      if (!res.ok) throw new Error('User not found')
      const userData = await res.json()
      onLoginSuccess(userData, 'family')
    } catch (err) {
      console.error(err)
      setError('Invalid username or role. Please try again (e.g., Thomas).')
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    setRole(null)
    setError('')
    setCustomName('')
    setFamilyPassword('')
  }

  // --- Landing Screen (Choose Role) ---
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 relative animate-fade-in">
        <div className="glass-card w-full max-w-2xl p-10 md:p-14 text-center flex flex-col gap-10 shadow-2xl rounded-[3rem] border border-white/40">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center justify-center">
            <img src="/logo.png" alt="HeartBridge Logo" className="w-64 md:w-80 h-auto object-contain drop-shadow-sm" />
          </div>

          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>

          {/* Onboarding Text */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl md:text-4xl font-bold text-elder-brown leading-snug">
              Welcome!
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 font-semibold mt-2">
              Please choose who you are:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg mx-auto">
            {/* Elder Mode */}
            <button
              onClick={() => setRole('elder')}
              className="group flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-white/50 hover:bg-white border-2 border-white/60 hover:border-[#4F46E5] transition-all duration-300 hover:scale-105 shadow-md hover:shadow-xl text-elder-brown"
            >
              <span className="text-6xl md:text-7xl group-hover:scale-110 transition-transform duration-300">👵</span>
              <span className="text-2xl md:text-3xl font-extrabold mt-4">
                Elder
                {users.length > 0 && (
                  <span className="block text-lg text-gray-500 font-bold mt-1">
                    ({singleMode 
                      ? (users.find(u => u.name.toLowerCase().includes('popat'))?.name || 'Popat dada')
                      : (users.find(u => u.name.toLowerCase().includes('kamala'))?.name || 'Margaret')
                    })
                  </span>
                )}
              </span>
            </button>

            {/* Caregiver Mode */}
            <button
              onClick={() => setRole('family')}
              className="group flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-white/50 hover:bg-white border-2 border-white/60 hover:border-[#4F46E5] transition-all duration-300 hover:scale-105 shadow-md hover:shadow-xl text-elder-brown"
            >
              <span className="text-6xl md:text-7xl group-hover:scale-110 transition-transform duration-300">👨‍👩‍👧‍👦</span>
              <span className="text-2xl md:text-3xl font-extrabold mt-4">
                Family
              </span>
            </button>
          </div>

          {/* Single Mode Toggle */}
          <div className="flex items-center justify-center gap-3 bg-white/50 p-5 rounded-[2rem] border-2 border-white/60 max-w-md mx-auto shadow-sm">
            <input 
              type="checkbox" 
              id="singleMode" 
              checked={singleMode} 
              onChange={(e) => {
                setSingleMode(e.target.checked)
                localStorage.setItem('singleElderMode', e.target.checked ? 'true' : 'false')
              }}
              className="w-6 h-6 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="singleMode" className="text-lg font-bold text-gray-700 cursor-pointer select-none">
              Use without family / Single Mode
            </label>
          </div>

        </div>
      </div>
    )
  }

  // --- Elder Login UI ---
  if (role === 'elder') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 relative animate-fade-in">
        <div className="glass-card w-full max-w-2xl p-8 md:p-12 text-center flex flex-col gap-8 shadow-2xl rounded-[3rem] border border-white/40">
          
          {/* Header & Go Back */}
          <div className="flex justify-between items-center w-full px-2">
            <button 
              onClick={handleGoBack}
              className="flex items-center gap-2 bg-white/50 hover:bg-white/80 border border-white/60 text-elder-brown text-lg font-bold py-2.5 px-5 rounded-2xl shadow transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-elder-brown text-3xl font-display font-extrabold">HeartBridge</h1>
          </div>

          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>

          {/* Welcoming Text */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl md:text-4xl font-bold text-elder-brown">
              Elder Login
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 font-semibold">
              Please select your name:
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-lg md:text-xl font-bold animate-pulse">
              {error}
            </div>
          )}

          {/* Quick Login Grid */}
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 border-t-4 border-[#4F46E5] border-solid rounded-full animate-spin"></div>
              <p className="text-xl md:text-2xl font-bold text-elder-brown">Loading...</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 py-4">
              {users
                .filter(user => {
                  const isPopat = user.name.toLowerCase().includes('popat')
                  return singleMode ? isPopat : !isPopat
                })
                .map(user => (
                <button
                  key={user.id}
                  onClick={() => handleElderLogin(user.name)}
                  className="btn-glass-icon w-36 h-40 md:w-44 md:h-48 flex flex-col items-center justify-center gap-4 p-4 rounded-[2.5rem] bg-white/50 hover:bg-white border-2 border-white/60 hover:border-[#4F46E5] transition-all duration-300 hover:scale-105 shadow-md hover:shadow-xl text-elder-brown"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center text-4xl shadow-inner overflow-hidden">
                    {user.name.toLowerCase().includes('popat') ? (
                      <img src="/popat.jpg" alt="Popat dada" className="w-full h-full object-cover" />
                    ) : (
                      <span>👵</span>
                    )}
                  </div>
                  <span className="text-2xl md:text-3xl font-extrabold">
                    {user.name}
                  </span>
                </button>
              ))}

              {/* Custom Name entry */}
              <div className="w-full mt-6 px-4">
                <p className="text-xl md:text-2xl font-bold text-gray-600 mb-4">
                  Or type your name:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Type name"
                    className="bg-white/80 border-2 border-white/60 focus:border-[#4F46E5] rounded-full px-6 py-4 text-xl md:text-2xl text-elder-brown outline-none font-bold text-center w-full max-w-sm shadow-inner"
                  />
                  <button
                    onClick={() => handleElderLogin(customName)}
                    disabled={!customName.trim()}
                    className={`btn-premium text-xl md:text-2xl py-4 px-8 rounded-full shadow-lg ${!customName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-3 bg-white/40 p-4 rounded-2xl border border-white/20">
            <span className="text-2xl">🔒</span>
            <span className="text-lg md:text-xl font-bold text-gray-500">
              Stay logged in on this device.
            </span>
          </div>
        </div>
      </div>
    )
  }

  // --- Caregiver Login UI ---
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 relative animate-fade-in w-full">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft border border-gray-100 p-8 relative z-10">
        
        {/* Go Back Header */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={handleGoBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-family-muted hover:text-family-text transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <span className="text-xs font-bold text-family-muted tracking-wide uppercase">Family Member Portal</span>
        </div>

        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#818CF8] flex items-center justify-center shadow-glow mb-3">
            <HeartPulse className="text-white" size={26} />
          </div>
          <h1 className="text-2xl font-bold font-display text-gray-900 tracking-tight">HeartBridge</h1>
          <p className="text-xs text-family-muted mt-1 font-medium">Family Member Sign In</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm font-medium rounded-2xl flex items-center gap-3">
            <AlertCircle size={18} className="flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFamilyLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Family Member Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 pointer-events-none">
                <User size={18} />
              </span>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter name (e.g., Thomas)"
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-family-primary focus:bg-white text-gray-900 outline-none transition-all placeholder:text-gray-400 font-medium rounded-2xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 pointer-events-none">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={familyPassword}
                onChange={(e) => setFamilyPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 focus:border-family-primary focus:bg-white text-gray-900 outline-none transition-all placeholder:text-gray-400 font-medium rounded-2xl text-sm"
              />
            </div>
            <div className="flex justify-end mt-2 px-1">
              <button
                type="button"
                onClick={() => alert("Please contact support or reset your password through the elder's device settings.")}
                className="text-xs font-bold text-[#4F46E5] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-family-primary hover:bg-indigo-700 text-white font-semibold py-3.5 px-4 rounded-2xl text-sm transition-all shadow-glow active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-family-muted font-medium border-t border-gray-50 pt-6">
          🔒 Session will auto-expire when browser tab is closed.
        </div>
      </div>
    </div>
  )
}
