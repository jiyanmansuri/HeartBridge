import React, { useState, useEffect } from 'react'
import { User, Phone, HardDrive, Languages, HelpCircle, LogOut, Video, ShieldAlert, Heart, Play, Volume2, Plus, Check, Camera, Edit3 } from 'lucide-react'

export default function ElderSettings({ user, onLogout }) {
  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem('elderProfileName') || user?.name || 'Kamala Shah'
  })
  const [phone, setPhone] = useState(() => {
    return localStorage.getItem('elderPhone') || '+91 98765 43210'
  })
  const [languages, setLanguages] = useState(() => {
    try {
      const saved = localStorage.getItem('elderLanguages')
      return saved ? JSON.parse(saved) : ['Gujarati', 'English']
    } catch (e) {
      return ['Gujarati', 'English']
    }
  })
  const [readPostsIn, setReadPostsIn] = useState(() => {
    return localStorage.getItem('readPostsIn') || 'gu'
  })
  const [translateComments, setTranslateComments] = useState(() => {
    return localStorage.getItem('translateComments') !== 'false'
  })
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('elderProfileImage') || null
  })
  const [address, setAddress] = useState(() => {
    return localStorage.getItem('elderAddress') || 'Flat 402, Shalin Heights, Ahmedabad, Gujarat'
  })
  const [birthday, setBirthday] = useState(() => {
    return localStorage.getItem('elderBirthday') || '1950-06-15'
  })

  const [members] = useState(() => {
    const saved = localStorage.getItem('familyMembers')
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Kamala Shah', relation: 'Elder', isElder: true, gender: 'female', avatar: '👵' },
      { id: 2, name: 'Thomas Shah', relation: 'Son', isAdmin: true, parentId: 1, gender: 'male', avatar: '👨' }
    ]
  })

  const elderMember = members.find(m => m.isElder)
  const childMembers = members.filter(m => 
    !m.isElder && 
    ['son', 'daughter', 'daughter-in-law', 'son-in-law', 'spouse', 'wife', 'husband'].includes(m.relation.toLowerCase())
  )
  const grandchildMembers = members.filter(m => 
    ['grandson', 'grandgrandson', 'granddaughter', 'grandgranddaughter'].includes(m.relation.toLowerCase())
  )
  const otherMembers = members.filter(m => 
    !m.isElder && 
    !childMembers.find(c => c.id === m.id) && 
    !grandchildMembers.find(g => g.id === m.id)
  )

  // Auto-persist changes
  useEffect(() => {
    localStorage.setItem('elderProfileName', profileName)
    // Keep elderUser session updated so other components see the new name
    const savedUser = localStorage.getItem('elderUser')
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser)
        u.name = profileName
        localStorage.setItem('elderUser', JSON.stringify(u))
      } catch (e) {}
    }
  }, [profileName])

  useEffect(() => {
    localStorage.setItem('elderPhone', phone)
  }, [phone])

  useEffect(() => {
    localStorage.setItem('elderLanguages', JSON.stringify(languages))
  }, [languages])

  useEffect(() => {
    localStorage.setItem('elderAddress', address)
  }, [address])

  useEffect(() => {
    localStorage.setItem('elderBirthday', birthday)
  }, [birthday])
  
  // Storage state
  const [storageUsed, setStorageUsed] = useState(2.3)
  const storageTotal = 5.0
  
  // Show guide modal state
  const [activeHelpModal, setActiveHelpModal] = useState(null)

  const calculateAge = (dobString) => {
    if (!dobString) return ''
    const today = new Date()
    const birthDate = new Date(dobString)
    let calculatedAge = today.getFullYear() - birthDate.getFullYear()
    const monthDifference = today.getMonth() - birthDate.getMonth()
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--
    }
    return calculatedAge
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64data = reader.result
        setProfileImage(base64data)
        localStorage.setItem('elderProfileImage', base64data)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleLanguageChip = (lang) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter(l => l !== lang))
      }
    } else {
      setLanguages([...languages, lang])
    }
  }

  const getMoreSpace = () => {
    setStorageUsed(prev => Math.max(1.0, +(prev - 0.5).toFixed(1)))
    alert("Nook storage cleaned, space optimized!")
  }

  return (
    <div className="flex flex-col gap-8 items-center mt-2 max-w-4xl mx-auto w-full pb-36 animate-fade-in text-[#5c4a3d]">
      
      {/* 1. Profile / YOU Card */}
      <div className="w-full bg-[#fdfbf7] border-4 border-[#e8dcc4] rounded-[3rem] p-8 shadow-lg flex flex-col items-center gap-6 relative">
        <span className="absolute top-6 left-8 text-lg font-black text-[#d9774e] uppercase tracking-wider">
          👤 YOU
        </span>
        
        {/* Profile Circle Photo with Upload functionality */}
        <div className="relative group mt-6">
          <div className="w-36 h-36 rounded-full bg-orange-100/50 border-4 border-[#d9c4a3] overflow-hidden flex items-center justify-center shadow-md">
            <img 
              src={profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=e8dcc4&color=8b5a2b&size=200`} 
              alt="Profile Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <label 
            htmlFor="profile-photo-input"
            className="absolute bottom-1 right-1 bg-[#d9774e] hover:bg-[#c2653e] text-white p-2.5 rounded-full border-4 border-[#fdfbf7] cursor-pointer shadow-md hover:scale-110 transition-all flex items-center justify-center"
          >
            <Camera size={20} strokeWidth={2.5} />
            <input 
              type="file"
              id="profile-photo-input"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="text-center w-full max-w-md">
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="text-3xl font-black text-[#5c4a3d] text-center bg-transparent border-b-2 border-dashed border-[#d9c4a3] focus:border-[#d9774e] outline-none w-full px-2 py-1"
          />
          <p className="text-lg font-bold text-gray-500 mt-2">(Tap to edit name)</p>
        </div>
      </div>

      {/* 2. My Details Card */}
      <div className="w-full bg-white border-4 border-[#f0e6d2] rounded-[3rem] p-8 shadow-xl flex flex-col gap-6">
        <h3 className="text-2xl font-black text-[#5c4a3d] flex items-center gap-3 border-b-2 border-orange-50 pb-4">
          <User className="text-[#d9774e]" size={32} />
          <span>📋 MY DETAILS</span>
        </h3>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-b border-[#fdfbf7] pb-4">
            <span className="text-xl font-bold text-[#7a6352] w-36">Name:</span>
            <span className="text-2xl font-bold text-[#5c4a3d] flex-1">{profileName}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-b border-[#fdfbf7] pb-4">
            <span className="text-xl font-bold text-[#7a6352] w-48">Phone:</span>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="text-2xl font-bold text-[#5c4a3d] bg-[#fdfbf7] border border-[#e8dcc4] rounded-xl px-4 py-2 w-full max-w-xs focus:outline-[#d9774e]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-b border-[#fdfbf7] pb-4">
            <span className="text-xl font-bold text-[#7a6352] w-48">Age:</span>
            <input 
              type="text" 
              value={`${calculateAge(birthday)} years`} 
              readOnly
              disabled
              className="text-2xl font-bold text-[#5c4a3d] bg-gray-100/50 border border-gray-200 rounded-xl px-4 py-2 w-full max-w-xs cursor-not-allowed select-none outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-b border-[#fdfbf7] pb-4">
            <span className="text-xl font-bold text-[#7a6352] w-48">Birthday:</span>
            <input 
              type="date" 
              value={birthday} 
              onChange={(e) => setBirthday(e.target.value)}
              className="text-2xl font-bold text-[#5c4a3d] bg-[#fdfbf7] border border-[#e8dcc4] rounded-xl px-4 py-2 w-full max-w-xs focus:outline-[#d9774e]"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between border-b border-[#fdfbf7] pb-4">
            <span className="text-xl font-bold text-[#7a6352] w-48">Address:</span>
            <textarea 
              rows={2}
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              className="text-2xl font-bold text-[#5c4a3d] bg-[#fdfbf7] border border-[#e8dcc4] rounded-xl px-4 py-2 w-full focus:outline-[#d9774e] font-semibold"
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xl font-bold text-[#7a6352]">I speak:</span>
            <div className="flex flex-wrap gap-3 mt-1">
              {['Gujarati', 'Hindi', 'English'].map((lang) => {
                const isSelected = languages.includes(lang)
                return (
                  <button
                    key={lang}
                    onClick={() => toggleLanguageChip(lang)}
                    className={`px-6 py-3 rounded-full text-xl font-extrabold flex items-center gap-2 border-2 transition-all ${
                      isSelected 
                        ? 'bg-[#dceddd] border-[#3c5a3d] text-[#3c5a3d]' 
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected && <Check size={20} />}
                    {lang}
                  </button>
                )
              })}
            </div>
            <p className="text-md text-gray-500 font-semibold">(Tap chips to edit)</p>
          </div>
        </div>
      </div>

      {/* 3. Storage Card */}
      <div className="w-full bg-[#fdfbf7] border-4 border-[#f0e6d2] rounded-[3rem] p-8 shadow-xl flex flex-col gap-6">
        <h3 className="text-2xl font-black text-[#5c4a3d] flex items-center gap-3 border-b-2 border-orange-50 pb-4">
          <HardDrive className="text-[#8b5a2b]" size={32} />
          <span>📦 MY NOOK STORAGE</span>
        </h3>

        <div className="flex flex-col gap-4">
          {/* Progress Bar Container */}
          <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden shadow-inner flex relative">
            <div 
              className="bg-gradient-to-r from-orange-400 to-[#d9774e] h-full transition-all duration-500" 
              style={{ width: `${(storageUsed / storageTotal) * 100}%` }}
            ></div>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-white drop-shadow">
              {storageUsed} GB of {storageTotal} GB used ({( (storageUsed/storageTotal)*100 ).toFixed(0)}%)
            </span>
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-lg font-bold text-gray-500">Space for memories & photos</span>
            <button
              onClick={getMoreSpace}
              className="bg-white border-4 border-[#d9c4a3] text-[#8b5a2b] hover:bg-orange-50/20 text-xl font-bold py-3 px-6 rounded-2xl shadow-sm transition-all"
            >
              Get More Space
            </button>
          </div>
        </div>
      </div>

      {/* 4. Language & Translation settings */}
      <div className="w-full bg-white border-4 border-[#f0e6d2] rounded-[3rem] p-8 shadow-xl flex flex-col gap-6">
        <h3 className="text-2xl font-black text-[#5c4a3d] flex items-center gap-3 border-b-2 border-orange-50 pb-4">
          <Languages className="text-[#3c5a3d]" size={32} strokeWidth={2.5} />
          <span>🌐 LANGUAGE & TRANSLATION</span>
        </h3>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-b border-[#fdfbf7] pb-4">
            <span className="text-xl font-bold text-[#7a6352]">Read posts in:</span>
            <select
              value={readPostsIn}
              onChange={(e) => {
                const val = e.target.value
                setReadPostsIn(val)
                localStorage.setItem('readPostsIn', val)
              }}
              className="text-xl font-black text-[#5c4a3d] bg-[#fdfbf7] border-4 border-[#f0e6d2] rounded-xl px-4 py-3 outline-none"
            >
              
              <option value="en">English</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <span className="text-xl font-bold text-[#7a6352]">Translate comments:</span>
            <button
              onClick={() => {
                const val = !translateComments
                setTranslateComments(val)
                localStorage.setItem('translateComments', String(val))
              }}
              className={`text-xl font-black py-3 px-8 rounded-2xl transition-all border-4 ${
                translateComments 
                  ? 'bg-[#dceddd] border-[#3c5a3d] text-[#3c5a3d]' 
                  : 'bg-[#f4dfd4] border-[#9b4a3a] text-[#9b4a3a]'
              }`}
            >
              {translateComments ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* 4.5 Family Tree (Read Only) */}
      <div className="w-full bg-white border-4 border-[#f0e6d2] rounded-[3rem] p-8 shadow-xl flex flex-col gap-6">
        <h3 className="text-2xl font-black text-[#5c4a3d] flex items-center gap-3 border-b-2 border-orange-50 pb-4">
          <User className="text-[#4F46E5]" size={32} />
          <span>👪 MY FAMILY TREE</span>
        </h3>

        <div className="flex flex-col items-center gap-10 w-full overflow-x-auto py-5">
          {/* Tier 1: Elder / Grandparent */}
          {elderMember && (
            <div className="flex flex-col items-center relative z-10">
              <div className="bg-indigo-50/80 border-2 border-indigo-200 p-5 rounded-[2rem] flex flex-col items-center gap-2 text-center w-40 shadow-sm relative">
                <span className="text-4xl">{elderMember.avatar}</span>
                <span className="font-bold text-gray-900 text-sm">{elderMember.name}</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full">{elderMember.relation}</span>
              </div>
              
              {/* Vertical connector line */}
              {(childMembers.length > 0 || grandchildMembers.length > 0 || otherMembers.length > 0) && (
                <div className="w-1 h-10 bg-indigo-200 mt-0.5"></div>
              )}
            </div>
          )}

          {/* Tier 2: Children */}
          {childMembers.length > 0 && (
            <div className="flex flex-col items-center w-full relative">
              {/* Horizontal bridge line spanning children */}
              {childMembers.length > 1 && (
                <div className="absolute top-0 h-1 bg-indigo-200" style={{
                  left: `calc(100% / ${childMembers.length * 2})`,
                  right: `calc(100% / ${childMembers.length * 2})`
                }}></div>
              )}

              <div className="flex justify-center gap-16 w-full">
                {childMembers.map((c) => (
                  <div key={c.id} className="flex flex-col items-center relative z-10">
                    {/* Top small vertical connector hook */}
                    <div className="w-1 h-4 bg-indigo-200 -mt-4 mb-2"></div>
                    
                    <div className="bg-orange-50/70 border-2 border-orange-200 p-4 rounded-3xl flex flex-col items-center gap-1.5 text-center w-36 shadow-sm">
                      <span className="text-3xl">{c.avatar}</span>
                      <span className="font-bold text-gray-850 text-xs truncate max-w-[120px]">{c.name}</span>
                      <span className="text-[9px] bg-orange-100 text-orange-800 font-extrabold px-2 py-0.5 rounded-full">{c.relation}</span>
                    </div>

                    {/* Grandchildren connector hook */}
                    {c.relation === 'Son' && grandchildMembers.length > 0 && (
                      <div className="w-1 h-10 bg-indigo-200 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tier 3: Grandchildren */}
          {grandchildMembers.length > 0 && (
            <div className="flex flex-col items-center w-full relative">
              {/* Horizontal bridge line spanning grandchildren */}
              {grandchildMembers.length > 1 && (
                <div className="absolute top-0 h-1 bg-indigo-200" style={{
                  left: `calc(100% / ${grandchildMembers.length * 2})`,
                  right: `calc(100% / ${grandchildMembers.length * 2})`
                }}></div>
              )}

              <div className="flex justify-center gap-12 w-full">
                {grandchildMembers.map((g) => (
                  <div key={g.id} className="flex flex-col items-center relative z-10">
                    {/* Top small vertical connector hook */}
                    <div className="w-1 h-4 bg-indigo-200 -mt-4 mb-2"></div>

                    <div className="bg-emerald-50/70 border-2 border-emerald-200 p-4 rounded-3xl flex flex-col items-center gap-1.5 text-center w-36 shadow-sm">
                      <span className="text-3xl">{g.avatar}</span>
                      <span className="font-bold text-gray-850 text-xs truncate max-w-[120px]">{g.name}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">{g.relation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Help & Safety Card */}
      <div className="w-full bg-[#fdfbf7] border-4 border-[#eecbb9] rounded-[3rem] p-8 shadow-xl flex flex-col gap-6">
        <h3 className="text-2xl font-black text-[#5c4a3d] flex items-center gap-3 border-b-2 border-orange-50 pb-4">
          <HelpCircle className="text-[#9b4a3a]" size={32} />
          <span>❓ HELP & SAFETY</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveHelpModal('how')}
            className="bg-white border-4 border-[#f0e6d2] hover:bg-orange-50/20 text-[#5c4a3d] text-xl font-black py-4 px-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm transition-all"
          >
            <Video size={32} className="text-[#d9774e]" />
            <span>View Guide</span>
            <span className="text-sm opacity-80 font-bold">(Show Me How)</span>
          </button>

          <button
            onClick={() => setActiveHelpModal('uncomfortable')}
            className="bg-white border-4 border-[#f0e6d2] hover:bg-orange-50/20 text-[#5c4a3d] text-xl font-black py-4 px-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm transition-all"
          >
            <ShieldAlert size={32} className="text-[#9b4a3a]" />
            <span>Report Content</span>
            <span className="text-sm opacity-80 font-bold">(I'm Uncomfortable)</span>
          </button>

          <button
            onClick={() => setActiveHelpModal('grandchild')}
            className="bg-white border-4 border-[#f0e6d2] hover:bg-orange-50/20 text-[#5c4a3d] text-xl font-black py-4 px-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm transition-all"
          >
            <Heart size={32} className="text-[#769b76]" />
            <span>Support Contact</span>
            <span className="text-sm opacity-80 font-bold">(Grandchild Help)</span>
          </button>
        </div>

        <button
          onClick={onLogout}
          className="w-full bg-[#9b4a3a] hover:bg-[#853e30] text-white text-2xl font-black py-5 rounded-2xl mt-4 flex items-center justify-center gap-3 shadow-md"
        >
          <LogOut size={28} />
          <span>Log Out</span>
        </button>
      </div>

      {/* Help Guides Modal */}
      {activeHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white border-4 border-[#eecbb9] rounded-[2.5rem] w-full max-w-md p-5 shadow-2xl relative flex flex-col items-center text-center max-h-[95vh] overflow-y-auto">
            <button 
              onClick={() => setActiveHelpModal(null)}
              className="absolute top-3 right-3 py-1 px-2.5 hover:bg-gray-100 rounded-lg text-[#5c4a3d] font-bold text-sm transition-colors"
            >
              Close
            </button>

            {activeHelpModal === 'how' && (
              <div className="mt-4 flex flex-col items-center">
                <Video size={36} className="text-[#d9774e] mb-2" />
                <h3 className="text-lg font-black text-[#5c4a3d] mb-2">Video Guide</h3>
                <p className="text-base text-[#7a6352] font-semibold mb-3">
                  A short video guide explaining how to use the app will start shortly.<br/>
                  <span className="block text-xs opacity-80 mt-1">(A short guide video explaining app features will start playing.)</span>
                </p>
                <div className="w-full h-36 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Play size={32} className="text-gray-400" />
                </div>
              </div>
            )}

            {activeHelpModal === 'uncomfortable' && (
              <div className="mt-4 flex flex-col items-center">
                <ShieldAlert size={36} className="text-[#9b4a3a] mb-2" />
                <h3 className="text-lg font-black text-[#9b4a3a] mb-2">Report Content</h3>
                <p className="text-base text-[#7a6352] font-semibold mb-3">
                  If you find any post inappropriate, flag it here for immediate review.<br/>
                  <span className="block text-xs opacity-80 mt-1">(Flag inappropriate posts. We will review it instantly.)</span>
                </p>
                <button 
                  onClick={() => {
                    alert('Report submitted. Thank you!')
                    setActiveHelpModal(null)
                  }}
                  className="bg-[#9b4a3a] text-white py-2 px-6 text-base font-bold rounded-lg"
                >
                  Submit Report
                </button>
              </div>
            )}

            {activeHelpModal === 'grandchild' && (
              <div className="mt-4 flex flex-col items-center">
                <Heart size={36} className="text-[#769b76] mb-2" />
                <h3 className="text-lg font-black text-[#769b76] mb-2">Support Contact (Support Contact)</h3>
                <p className="text-base text-[#7a6352] font-semibold">
                  Thomas Higgins's phone number: <strong className="text-[#5c4a3d] block mt-0.5 text-lg">+91 98765 43210</strong>
                  He is available immediately to help you.<br/>
                  <span className="block text-xs opacity-80 mt-1">(Your admin family contact is available for screen sharing or support.)</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
