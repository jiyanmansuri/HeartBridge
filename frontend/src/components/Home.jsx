import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { UtensilsCrossed, BookOpen, Scissors, Languages, Globe, Calendar, User, Camera, Mic, Edit3, Image as ImageIcon, Heart, CloudSun, ChevronRight, X, Sparkles, Book } from 'lucide-react'

const questionsPool = [
  {
    en: "Which dish reminds you most of your mother?",
    gu: ""
  },
  {
    en: "What was your favorite game to play as a child?",
    gu: ""
  },
  {
    en: "Where did your family go during summer vacations?",
    gu: ""
  },
  {
    en: "What is your earliest childhood memory?",
    gu: ""
  },
  {
    en: "Who was your best friend growing up?",
    gu: ""
  },
  {
    en: "Do you remember your first day of school?",
    gu: ""
  },
  {
    en: "What kind of music or songs did you listen to in your youth?",
    gu: ""
  },
  {
    en: "What was the first movie you saw in a cinema?",
    gu: ""
  },
  {
    en: "How did people celebrate festivals in your village/town?",
    gu: ""
  },
  {
    en: "Tell us about a traditional outfit you loved wearing.",
    gu: ""
  },
  {
    en: "What is a valuable piece of advice your father gave you?",
    gu: ""
  },
  {
    en: "What did you do with your first salary?",
    gu: ""
  },
  {
    en: "How did you spend rainy days when you were young?",
    gu: ""
  },
  {
    en: "What was your favorite story that your grandparents told you?",
    gu: ""
  },
  {
    en: "Tell us about your wedding day or a wedding you remember well.",
    gu: ""
  },
  {
    en: "What kind of toys did you play with?",
    gu: ""
  },
  {
    en: "What is the biggest change you've seen in the world over your lifetime?",
    gu: ""
  },
  {
    en: "Do you remember the smell of fresh soil during the first rain?",
    gu: ""
  },
  {
    en: "Which teacher had the biggest influence on you?",
    gu: ""
  },
  {
    en: "What is a craft or hobby you enjoyed doing with your hands?",
    gu: ""
  }
]

const globalStoriesPool = [
  {
    titleEn: "Pasta Secrets",
    titleGu: "",
    descEn: "Grandma Maria shared her secret traditional fresh pasta recipe.",
    descGu: "",
    color: "bg-[#e8dcc4]/40 border-[#d9c4a3] text-[#8b5a2b]"
  },
  {
    titleEn: "Origami Art",
    titleGu: "",
    descEn: "A beautiful guide on folding paper cranes as symbols of peace.",
    descGu: "",
    color: "bg-[#dceddd]/40 border-[#c4e0c6] text-[#3c5a3d]"
  },
  {
    titleEn: "Smoky Salsa",
    titleGu: "",
    descEn: "Family secrets for slow-cooking smoky chipotle salsa.",
    descGu: "",
    color: "bg-[#f4dfd4]/40 border-[#eecbb9] text-[#9b4a3a]"
  },
  {
    titleEn: "Traditional Tea",
    titleGu: "",
    descEn: "The mindfulness and elegance of slow tea brewing.",
    descGu: "",
    color: "bg-[#dcebf4]/40 border-[#b9d9ee] text-[#2c4e6b]"
  },
  {
    titleEn: "Buttery Croissants",
    titleGu: "",
    descEn: "The step-by-step joy of baking flaky, buttery croissants.",
    descGu: "",
    color: "bg-[#e8dcc4]/40 border-[#d9c4a3] text-[#8b5a2b]"
  },
  {
    titleEn: "Spiced Curry",
    titleGu: "",
    descEn: "A slow-cooked spiced curry recipe passed down generations.",
    descGu: "",
    color: "bg-[#dceddd]/40 border-[#c4e0c6] text-[#3c5a3d]"
  },
  {
    titleEn: "Tango Evenings",
    titleGu: "",
    descEn: "Nostalgic memories of dancing the tango under warm streetlights.",
    descGu: "",
    color: "bg-[#f4dfd4]/40 border-[#eecbb9] text-[#9b4a3a]"
  },
  {
    titleEn: "Maple Syrup",
    titleGu: "",
    descEn: "The spring tapping tradition of harvesting sweet maple syrup.",
    descGu: "",
    color: "bg-[#dcebf4]/40 border-[#b9d9ee] text-[#2c4e6b]"
  },
  {
    titleEn: "Kilim Weaving",
    titleGu: "",
    descEn: "The artistic legacy of hand-weaving traditional rugs.",
    descGu: "",
    color: "bg-[#e8dcc4]/40 border-[#d9c4a3] text-[#8b5a2b]"
  },
  {
    titleEn: "Apple Strudel",
    titleGu: "",
    descEn: "The fine art of stretching strudel pastry paper-thin.",
    descGu: "",
    color: "bg-[#dceddd]/40 border-[#c4e0c6] text-[#3c5a3d]"
  },
  {
    titleEn: "Aegean Clay",
    titleGu: "",
    descEn: "Secrets of throwing and sculpting beautiful clay pottery.",
    descGu: "",
    color: "bg-[#f4dfd4]/40 border-[#eecbb9] text-[#9b4a3a]"
  },
  {
    titleEn: "Samba Beats",
    titleGu: "",
    descEn: "The energetic drumming and dancing rhythms of late-night festivals.",
    descGu: "",
    color: "bg-[#dcebf4]/40 border-[#b9d9ee] text-[#2c4e6b]"
  },
  {
    titleEn: "Fjord Fishing",
    titleGu: "",
    descEn: "The crisp morning air and peace of fishing on calm waters.",
    descGu: "",
    color: "bg-[#e8dcc4]/40 border-[#d9c4a3] text-[#8b5a2b]"
  },
  {
    titleEn: "Patchwork Quilt",
    titleGu: "",
    descEn: "A beautiful quilt made from fabrics of three generations.",
    descGu: "",
    color: "bg-[#dceddd]/40 border-[#c4e0c6] text-[#3c5a3d]"
  },
  {
    titleEn: "Valencian Paella",
    titleGu: "",
    descEn: "Cooking authentic seafood paella over open wood fires.",
    descGu: "",
    color: "bg-[#f4dfd4]/40 border-[#eecbb9] text-[#9b4a3a]"
  }
]

export default function Home({ user, elderId, setCurrentTab, setInitialCircleCategory }) {
  const [greetingGu, setGreetingGu] = useState('')
  const [greetingEn, setGreetingEn] = useState('')
  const [greetingEmoji, setGreetingEmoji] = useState('☀️')
  const [time, setTime] = useState(new Date())
  const [onThisDayPhoto, setOnThisDayPhoto] = useState(null)
  
  // Prompt states
  const [promptText, setPromptText] = useState("Which dish reminds you most of your mother?")
  const [promptTextGu, setPromptTextGu] = useState("Which dish reminds you most of your mother?")
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [showSpeakModal, setShowSpeakModal] = useState(false)
  const [writtenStory, setWrittenStory] = useState('')
  const [isSubmittingStory, setIsSubmittingStory] = useState(false)
  
  // Speak simulation states
  const [isRecording, setIsRecording] = useState(false)
  const [recordedText, setRecordedText] = useState('')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const recordingIntervalRef = useRef(null)
  
  // Family memory popup
  const [showFamilyLoveModal, setShowFamilyLoveModal] = useState(false)
  const [randomStories, setRandomStories] = useState([])
  const [selectedGlobalStory, setSelectedGlobalStory] = useState(null)
  const [checkinCount, setCheckinCount] = useState(0)
  const [latestFamilyEvent, setLatestFamilyEvent] = useState(null)
  const [isSingleMode, setIsSingleMode] = useState(false)

  useEffect(() => {
    setIsSingleMode(localStorage.getItem('singleElderMode') === 'true')
  }, [])

  useEffect(() => {
    if (!user || !user.family_group_id) return
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const fetchLatestFamilyEvent = () => {
      fetch(`${API_BASE}/api/family/feed?family_group_id=${user.family_group_id}`)
        .then(res => {
          if (!res.ok) return null
          return res.json()
        })
        .then(data => {
          if (data && data.length > 0) {
            const validEvent = data.find(evt => evt.event_type === 'voice_message' || evt.event_type === 'photo_uploaded')
            if (validEvent) {
              setLatestFamilyEvent(validEvent)
            }
          }
        })
        .catch(e => console.error("Error fetching family events:", e))
    }

    fetchLatestFamilyEvent()
    const interval = setInterval(fetchLatestFamilyEvent, 10000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const checkins = JSON.parse(localStorage.getItem('mood_checkins') || '[]')
    const todayStr = new Date().toDateString()
    const todayCheckins = checkins.filter(c => new Date(c).toDateString() === todayStr)
    setCheckinCount(todayCheckins.length)
  }, [])

  const handleLogMood = async (moodKey) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      await fetch(`${API_BASE}/api/mood/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: elderId,
          mood: moodKey
        })
      })
      
      const checkins = JSON.parse(localStorage.getItem('mood_checkins') || '[]')
      const updated = [...checkins, new Date().toISOString()]
      localStorage.setItem('mood_checkins', JSON.stringify(updated))
      
      const todayStr = new Date().toDateString()
      const todayCheckins = updated.filter(c => new Date(c).toDateString() === todayStr)
      setCheckinCount(todayCheckins.length)
      alert("Your mood was shared with your family!")
    } catch (e) {
      console.error(e)
    }
  }

  // Web Speech API
  const [recognition, setRecognition] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const rec = new SpeechRecognition()
        rec.continuous = true
        rec.interimResults = true
        rec.lang = user?.language === 'gu' ? 'gu-IN' : 'en-US'
        rec.onresult = (e) => {
          const transcriptResult = Array.from(e.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('')
          setRecordedText(transcriptResult)
        }
        setRecognition(rec)
      }
    }
  }, [user])

  // Real-time clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const isOpen = !!(selectedGlobalStory || showWriteModal || showSpeakModal || showFamilyLoveModal)
    window.dispatchEvent(new CustomEvent('modal-state', { detail: { open: isOpen } }))
  }, [selectedGlobalStory, showWriteModal, showSpeakModal, showFamilyLoveModal])

  // Random prompt and stories selection on mount
  useEffect(() => {
    const idx = Math.floor(Math.random() * questionsPool.length)
    const selected = questionsPool[idx]
    setPromptText(selected.en)
    setPromptTextGu(selected.gu)

    // Shuffle and pick 3 random global stories
    const shuffled = [...globalStoriesPool].sort(() => 0.5 - Math.random())
    setRandomStories(shuffled.slice(0, 3))
  }, [])

  // Dynamic greeting logic
  useEffect(() => {
    const hour = time.getHours()
    if (hour >= 4 && hour < 12) {
      setGreetingGu('Good morning')
      setGreetingEn('Good Morning')
      setGreetingEmoji('☀️')
    } else if (hour >= 12 && hour < 17) {
      setGreetingGu('Good afternoon')
      setGreetingEn('Good Afternoon')
      setGreetingEmoji('☀️')
    } else if (hour >= 17 && hour < 21) {
      setGreetingGu('Good evening')
      setGreetingEn('Good Evening')
      setGreetingEmoji('🌅')
    } else {
      setGreetingGu('Good night')
      setGreetingEn('Good Night')
      setGreetingEmoji('🌙')
    }
  }, [time])

  // Fetch On This Day Memory
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    fetch(`${API_BASE}/api/photo/on_this_day?user_id=${elderId}`)
      .then(res => {
        if (!res.ok) return null
        return res.json()
      })
      .then(data => {
        if (data && data.file_path) {
          setOnThisDayPhoto(data)
        }
      })
      .catch(e => console.error("Error fetching on-this-day photo:", e))
  }, [elderId])

  const toGujaratiDigits = (numStr) => {
    return numStr;
  }

  const getFormattedTime = (dateObj) => {
    let hours = dateObj.getHours()
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    const hrStr = String(hours).padStart(2, '0')
    const gujDigits = toGujaratiDigits(`${hrStr}:${minutes}`)
    return {
      gujTime: `${gujDigits} ${ampm}`,
      engTime: `${hrStr}:${minutes} ${ampm}`
    }
  }

  const getFormattedDate = (dateObj) => {
    const daysGu = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const monthsGu = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    
    const dayGu = daysGu[dateObj.getDay()]
    const dateNumGu = dateObj.getDate()
    const monthGu = monthsGu[dateObj.getMonth()]
    const yearGu = dateObj.getFullYear()
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    const engDate = dateObj.toLocaleDateString('en-US', options)
    
    return {
      gujDate: `${dayGu}, ${dateNumGu} ${monthGu} ${yearGu}`,
      engDate
    }
  }

  const { gujDate, engDate } = getFormattedDate(time)
  const formattedTime = getFormattedTime(time)

  // Handle Save Written Story
  const handleSaveWrittenStory = (text) => {
    if (!text.trim()) return
    setIsSubmittingStory(true)
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    
    fetch(`${API_BASE}/api/memory/add_text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: elderId,
        title: promptText,
        transcript: text
      })
    })
      .then(res => res.json())
      .then(() => {
        setIsSubmittingStory(false)
        setWrittenStory('')
        setRecordedText('')
        setShowWriteModal(false)
        setShowSpeakModal(false)
        alert('Story successfully saved!')
      })
      .catch(err => {
        console.error(err)
        setIsSubmittingStory(false)
      })
  }

  // Voice recording triggers
  const startVoiceRecording = () => {
    setRecordedText('')
    setRecordingSeconds(0)
    setIsRecording(true)
    if (recognition) {
      try {
        recognition.start()
      } catch (e) {
        console.error(e)
      }
    }
    recordingIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1)
    }, 1000)
  }

  const stopVoiceRecording = () => {
    setIsRecording(false)
    if (recognition) {
      try {
        recognition.stop()
      } catch (e) {
        console.error(e)
      }
    }
    clearInterval(recordingIntervalRef.current)
  }

  // Fallback / simulated speech if mic fails or for demo
  const handleSimulateSpeech = () => {
    const sampleText = user?.language === 'gu'
      ? "I miss my mother's homemade Sukhdi. She used to make it warm in winter."
      : "Sukhdi reminds me most of my mother. She used to make it warm and sweet during winter."
    setRecordedText(sampleText)
  }

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const finalPhotoUrl = onThisDayPhoto 
    ? `${API_BASE}/${onThisDayPhoto.file_path}` 
    : "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800"

  let finalPhotoCaption = "On this day in 2019 – Grandson's first birthday"
  if (onThisDayPhoto) {
    const year = onThisDayPhoto.created_at ? new Date(onThisDayPhoto.created_at).getFullYear() : 2019
    const gujYear = year
    const eventTextEn = onThisDayPhoto.transcript || onThisDayPhoto.event_tag || "Beautiful Memory"
    
    const gujMap = {
      "Holi": "Holi Celebration",
      "Diwali": "Diwali Festival",
      "Birthday": "Birthday Celebration",
      "Grandson's first birthday": "Grandson's first birthday",
      "Misc": "Beautiful Memory"
    }
    
    let eventTextGu = onThisDayPhoto.transcript || ""
    if (!eventTextGu && onThisDayPhoto.event_tag) {
      eventTextGu = gujMap[onThisDayPhoto.event_tag] || onThisDayPhoto.event_tag
    }
    if (!eventTextGu) {
      eventTextGu = "Beautiful Memory"
    }
    
    finalPhotoCaption = `On this day in ${year} – ${eventTextEn}`
  }

  return (
    <div className="flex flex-col gap-8 items-center mt-2 max-w-4xl mx-auto w-full pb-36 animate-fade-in text-[#5c4a3d]">
      
      {/* 1. Header Card */}
      <div className="w-full bg-[#fdfbf7] border-4 border-[#e8dcc4] rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-4xl shadow-inner">
            {greetingEmoji}
          </div>
          <div>
            <h2 className="text-3xl font-display font-black text-[#5c4a3d] mb-1">
              {`${greetingEn}, ${user?.preferred_name || user?.name || 'Margaret'}!`}
            </h2>
            {user?.language === 'gu' && (
              <p className="text-xl font-bold text-[#7a6352]">
                {greetingGu} ({greetingEn})
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end text-center md:text-right border-t md:border-t-0 md:border-l border-[#e8dcc4] pt-4 md:pt-0 md:pl-6 gap-1">
          <div className="text-2xl font-black text-[#5c4a3d]">
            {user?.language === 'gu' ? gujDate : engDate}
          </div>
          {user?.language === 'gu' && (
            <div className="text-xl font-bold text-[#7a6352]">
              {engDate}
            </div>
          )}
          <div className="text-lg text-gray-500 font-bold mt-1 flex items-center gap-2">
            <span>{user?.language === 'gu' ? `${formattedTime.gujTime} (${formattedTime.engTime})` : formattedTime.engTime}</span>
            <span>•</span>
            <span>☁️ 32°C</span>
          </div>
        </div>
      </div>

      {/* 2. Photo Memory Card */}
      <div className="w-full bg-white border-4 border-[#f0e6d2] rounded-[3rem] p-6 md:p-8 shadow-xl flex flex-col gap-6 relative overflow-hidden">
        <div className="flex items-center gap-3 border-b-2 border-orange-50 pb-4">
          <ImageIcon className="text-[#d9774e]" size={36} />
          <h3 className="text-2xl font-black text-[#5c4a3d]">
            THIS DAY, YEARS AGO...
          </h3>
        </div>

        <div className="w-full h-80 rounded-[2rem] overflow-hidden border-4 border-[#fdfbf7] shadow-inner relative group">
          <img 
            src={finalPhotoUrl} 
            alt="Nostalgic Memory" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
        </div>

        <div className="text-center md:text-left px-2">
          <p className="text-2xl font-semibold text-[#7a6352] italic leading-relaxed">
            "{finalPhotoCaption}"
          </p>
        </div>

        <button 
          onClick={() => setCurrentTab('memories')}
          className="w-full bg-orange-50/50 hover:bg-orange-50 border-4 border-[#eecbb9] text-[#b55330] text-xl font-extrabold py-4 rounded-2xl shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <span>See More from That Day</span>
          <ChevronRight size={24} />
        </button>
      </div>

      {/* 3. Daily Story Prompt Card */}
      <div className="w-full bg-[#fdfbf7] border-4 border-[#eecbb9] rounded-[3rem] p-8 shadow-xl flex flex-col gap-6 relative">
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl shadow">
          🧡
        </div>
        
        <div className="text-center md:text-left">
          <span className="text-lg font-black text-[#d9774e] uppercase tracking-wider block mb-2">
            {"WHAT'S YOUR STORY TODAY?"}
          </span>
          <h3 className="text-3xl font-black text-[#5c4a3d] leading-snug">
            {user?.language === 'gu' ? `"${promptTextGu}"` : `"${promptText}"`}
            {user?.language === 'gu' && <span className="block text-xl opacity-90 font-bold mt-2">({promptText})</span>}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-2">
          <button 
            onClick={() => setShowSpeakModal(true)}
            className="bg-[#d9774e] hover:bg-[#c2653e] text-white text-2xl font-black py-6 px-6 rounded-[2rem] shadow-[0_6px_0_#b55330] hover:shadow-[0_2px_0_#b55330] hover:translate-y-1 transition-all active:shadow-none active:translate-y-2 flex flex-col items-center gap-2"
          >
            <Mic size={36} strokeWidth={2.5} />
            <span>{"Speak Your Answer"}</span>
            {user?.language === 'gu' && <span className="text-sm opacity-90 font-medium">(Tap & Speak Your Answer)</span>}
          </button>

          <button 
            onClick={() => setShowWriteModal(true)}
            className="bg-white border-4 border-[#d9c4a3] hover:bg-orange-50/20 text-[#8b5a2b] text-2xl font-black py-6 px-6 rounded-[2rem] shadow-[0_6px_0_#d9c4a3] hover:shadow-[0_2px_0_#d9c4a3] hover:translate-y-1 transition-all active:shadow-none active:translate-y-2 flex flex-col items-center gap-2"
          >
            <Edit3 size={36} strokeWidth={2.5} />
            <span>{"Write Your Answer"}</span>
            {user?.language === 'gu' && <span className="text-sm opacity-90 font-medium">(Write Instead)</span>}
          </button>
        </div>
      </div>

      {/* 4. Mood & Feelings Feedback */}
      <div className="w-full bg-[#fdfbf7] border-4 border-[#e8dcc4] rounded-[3rem] p-6 md:p-8 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b-2 border-orange-50 pb-3">
          <span className="text-3xl">🧘</span>
          <div>
            <h3 className="text-2xl font-black text-[#5c4a3d]">
              {"How are you feeling today?"}
            </h3>
            <p className="text-sm font-bold text-[#7a6352]">
              {user?.language === 'gu' ? `How are you feeling today? (Check-in ${checkinCount}/3)` : `Daily mood check-in (${checkinCount}/3)`}
            </p>
          </div>
        </div>

        {checkinCount >= 3 ? (
          <div className="bg-[#769b76]/10 border-2 border-[#769b76]/20 rounded-2xl p-6 text-center">
            <p className="text-xl font-bold text-[#3c5a3d]">
              {"Today's mood check-ins are complete. Thank you! 🌟"}
            </p>
            {user?.language === 'gu' && (
              <p className="text-base font-semibold text-gray-500 mt-1">
                (Today's mood check-ins are complete. Thank you!)
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { key: 'happy', emoji: '😀', labelGu: 'Happy', labelEn: 'Happy' },
                { key: 'calm', emoji: '😌', labelGu: 'Calm', labelEn: 'Calm' },
                { key: 'tired', emoji: '🥱', labelGu: 'Tired', labelEn: 'Tired' },
                { key: 'lonely', emoji: '😔', labelGu: 'Lonely', labelEn: 'Lonely' }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => handleLogMood(item.key)}
                  className="bg-white border-2 border-[#f0e6d2] hover:border-[#d9774e] rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-[1.03] transition-all shadow-sm active:scale-95"
                >
                  <span className="text-5xl">{item.emoji}</span>
                  <span className="text-lg font-black text-[#5c4a3d]">
                    {user?.language === 'gu' ? item.labelGu : item.labelEn}
                  </span>
                  {user?.language === 'gu' && (
                    <span className="text-xs text-gray-500 font-bold">({item.labelEn})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Family Love Notification */}
      {!isSingleMode && (
        <div className="w-full bg-[#f4dfd4] border-4 border-[#eecbb9] rounded-[2.5rem] p-6 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-3xl shadow-sm">
              ❤️
            </div>
            <div>
              <h4 className="text-2xl font-black text-[#9b4a3a]">
                FAMILY LOVE
              </h4>
              <div className="text-xl text-[#7a6352] font-bold">
                {latestFamilyEvent ? (
                  latestFamilyEvent.event_type === 'voice_message' ? (
                    <>
                      "Your family sent a new message."
                      <span className="block text-sm opacity-85 mt-0.5">("Your family just sent a new message.")</span>
                    </>
                  ) : (
                    <>
                      "Your son Thomas just shared a new memory."
                      <span className="block text-sm opacity-85 mt-0.5">("Your son just sent a new memory.")</span>
                    </>
                  )
                ) : (
                  <>
                    "Your son Thomas just shared a new memory."
                    <span className="block text-sm opacity-85 mt-0.5">("Your son just sent a new memory.")</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowFamilyLoveModal(true)}
            className="bg-white border-2 border-[#9b4a3a] text-[#9b4a3a] text-xl font-black py-3 px-6 rounded-2xl hover:bg-orange-50 transition-colors active:scale-95 flex-shrink-0"
          >
            View
          </button>
        </div>
      )}

      {/* 6. Quick Action Bottom Grid */}
      <div className="grid grid-cols-3 gap-4 w-full mt-4">
        <button 
          onClick={() => setCurrentTab('memories')}
          className="bg-white border-4 border-[#f0e6d2] hover:bg-orange-50/20 text-[#5c4a3d] text-2xl font-black py-6 rounded-[2rem] shadow-[0_6px_0_#f0e6d2] hover:shadow-[0_2px_0_#f0e6d2] hover:translate-y-1 transition-all active:shadow-none active:translate-y-2 flex flex-col items-center justify-center gap-2"
        >
          <Camera size={36} className="text-[#d9774e]" />
          <span className="text-xl">Add Memory</span>
          <span className="text-xs opacity-80">(Add Memory)</span>
        </button>

        <button 
          onClick={() => {
            if (setInitialCircleCategory) setInitialCircleCategory("Grandma's Kitchen");
            setCurrentTab('worldwide');
          }}
          className="bg-white border-4 border-[#f0e6d2] hover:bg-orange-50/20 text-[#5c4a3d] text-2xl font-black py-6 rounded-[2rem] shadow-[0_6px_0_#f0e6d2] hover:shadow-[0_2px_0_#f0e6d2] hover:translate-y-1 transition-all active:shadow-none active:translate-y-2 flex flex-col items-center justify-center gap-2"
        >
          <UtensilsCrossed size={36} className="text-[#8b5a2b]" />
          <span className="text-xl">Share Recipe</span>
          <span className="text-xs opacity-80">(Share Recipe)</span>
        </button>

        <button 
          onClick={() => setCurrentTab('memories')}
          className="bg-white border-4 border-[#f0e6d2] hover:bg-orange-50/20 text-[#5c4a3d] text-2xl font-black py-6 rounded-[2rem] shadow-[0_6px_0_#f0e6d2] hover:shadow-[0_2px_0_#f0e6d2] hover:translate-y-1 transition-all active:shadow-none active:translate-y-2 flex flex-col items-center justify-center gap-2"
        >
          <Mic size={36} className="text-[#3c5a3d]" />
          <span className="text-xl">Start Story</span>
          <span className="text-xs opacity-80">(Voice Story)</span>
        </button>
      </div>

      {/* Global Story Detail Modal */}
      {selectedGlobalStory && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in pb-20 pt-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white border-4 border-[#e8dcc4] rounded-[2.5rem] w-full max-w-lg p-5 shadow-2xl relative max-h-[95vh] overflow-y-auto flex flex-col gap-3 text-center">
            <button 
              onClick={() => setSelectedGlobalStory(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-[#5c4a3d] transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center gap-1 border-b-2 border-orange-50 pb-2 mt-2">
              <BookOpen size={36} className="text-[#d9774e]" />
              <h3 className="text-xl font-black text-[#5c4a3d]">
                {selectedGlobalStory.titleGu}
              </h3>
              <p className="text-base text-gray-500 font-bold">
                ({selectedGlobalStory.titleEn})
              </p>
            </div>

            <div className="flex flex-col gap-2 text-left px-1">
              <p className="text-lg font-bold text-[#5c4a3d] leading-relaxed">
                {selectedGlobalStory.descGu}
              </p>
              <p className="text-base font-semibold text-[#7a6352] italic leading-relaxed">
                "{selectedGlobalStory.descEn}"
              </p>
            </div>

            <button 
              onClick={() => setSelectedGlobalStory(null)}
              className="w-full bg-[#d9774e] hover:bg-[#c2653e] text-white text-lg font-bold py-2 rounded-lg shadow-md mt-2"
            >
              Done Reading
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Writing Modal */}
      {showWriteModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in pb-20 pt-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white border-4 border-[#e8dcc4] rounded-[2.5rem] w-full max-w-lg p-5 shadow-2xl relative max-h-[95vh] overflow-y-auto">
            <button 
              onClick={() => setShowWriteModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 text-[#5c4a3d] transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-black text-[#5c4a3d] mb-1">
              Write & Save Memory
            </h3>
            <p className="text-base text-gray-500 font-bold mb-2.5">
              Question: "{promptTextGu}"
            </p>

            <textarea
              rows={2}
              value={writtenStory}
              onChange={(e) => setWrittenStory(e.target.value)}
              placeholder="Write here..."
              className="w-full p-2.5 text-base border-2 border-[#f0e6d2] rounded-lg focus:outline-none focus:border-[#d9774e] text-elder-brown font-semibold bg-orange-50/10 mb-3"
            />

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowWriteModal(false)}
                className="flex-1 border-2 border-[#f0e6d2] hover:bg-gray-50 text-base font-bold py-2 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => handleSaveWrittenStory(writtenStory)}
                disabled={isSubmittingStory}
                className="flex-1 bg-[#d9774e] hover:bg-[#c2653e] disabled:bg-gray-400 text-white text-base font-bold py-2 rounded-lg shadow-[0_3px_0_#b55330] hover:shadow-[0_1px_0_#b55330] hover:translate-y-0.5 transition-all active:shadow-none active:translate-y-1"
              >
                {isSubmittingStory ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Speaking/Audio Recording Modal */}
      {showSpeakModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in pb-20 pt-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white border-4 border-[#e8dcc4] rounded-[2.5rem] w-full max-w-lg p-5 shadow-2xl relative flex flex-col items-center text-center max-h-[95vh] overflow-y-auto">
            <button 
              onClick={() => {
                stopVoiceRecording()
                setShowSpeakModal(false)
              }}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 text-[#5c4a3d] transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-black text-[#5c4a3d] mb-1.5">
              Speak & Save Memory
            </h3>
            <p className="text-base text-gray-500 font-bold mb-3">
              Question: "{promptTextGu}"
            </p>

            <div className="flex flex-col items-center gap-2 mb-3">
              <button 
                type="button"
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                    : 'bg-[#d9774e] hover:bg-[#c2653e] text-white shadow-lg'
                }`}
              >
                <Mic size={36} strokeWidth={2.5} />
              </button>
              
              <span className="text-lg font-bold text-[#8b5a2b] mt-1">
                {isRecording ? `Recording: ${recordingSeconds}s` : 'Press mic button to start recording'}
              </span>
              <span className="text-xs text-gray-400 font-semibold">
                {isRecording ? '(Recording active...)' : '(Tap icon to start recording)'}
              </span>
            </div>

            {/* Display transcription */}
            <div className="w-full bg-[#fdfbf7] border-2 border-[#f0e6d2] rounded-lg p-2.5 min-h-[50px] max-h-[80px] overflow-y-auto mb-3 text-left">
              {recordedText ? (
                <p className="text-base font-semibold text-[#5c4a3d]">{recordedText}</p>
              ) : (
                <p className="text-sm text-gray-400 font-medium italic">Your speech will transcribe here...</p>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <button 
                type="button" 
                onClick={handleSimulateSpeech}
                className="flex-1 border-2 border-[#d9c4a3] text-[#8b5a2b] font-bold py-2 rounded-lg hover:bg-orange-50/25 text-base"
              >
                Simulate Demo
              </button>
              <button 
                type="button"
                onClick={() => handleSaveWrittenStory(recordedText)}
                disabled={isSubmittingStory || !recordedText}
                className="flex-1 bg-[#769b76] hover:bg-[#5f805f] disabled:bg-gray-300 text-white font-bold py-2 rounded-lg text-base"
              >
                Save Memory
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Family Love Modal */}
      {showFamilyLoveModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in pb-20 pt-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white border-4 border-[#eecbb9] rounded-[2.5rem] w-full max-w-sm p-5 shadow-2xl relative flex flex-col items-center text-center max-h-[95vh] overflow-y-auto">
            <button 
              onClick={() => setShowFamilyLoveModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 text-[#5c4a3d] transition-colors"
            >
              <X size={24} />
            </button>

            <span className="text-4xl mb-2">💝</span>

            {latestFamilyEvent ? (
              (() => {
                const payload = JSON.parse(latestFamilyEvent.payload)
                const isVoice = latestFamilyEvent.event_type === 'voice_message'
                return (
                  <>
                    <h3 className="text-xl font-black text-[#9b4a3a] mb-1">
                      {isVoice ? 'New Message!' : 'New Photo!'}
                    </h3>
                    
                    <div className="text-base text-[#7a6352] font-bold mb-3 leading-relaxed">
                      {isVoice ? (
                        <>
                          "{payload.message}"
                          <span className="block text-xs opacity-80 mt-1">(Message from your family)</span>
                        </>
                      ) : (
                        <>
                          "A new memory photo has been sent!"
                          <span className="block text-xs opacity-80 mt-1">(New photo added to your Memory Nook: {payload.event_tag || 'Misc'})</span>
                        </>
                      )}
                    </div>

                    {!isVoice && payload.file_path && (
                      <div className="w-full h-36 rounded-xl overflow-hidden shadow-inner border border-gray-100 mb-3">
                        <img 
                          src={`${API_BASE}/${payload.file_path}`} 
                          alt="Uploaded by Family" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </>
                )
              })()
            ) : (
              <>
                <h3 className="text-xl font-black text-[#9b4a3a] mb-1">
                  Love message from your son!
                </h3>
                <p className="text-base text-[#7a6352] font-bold mb-3 leading-relaxed">
                  "Grandma, we all miss you so much! Here is a photo from your trip last year."
                  <span className="block text-xs opacity-80 mt-1">("We all miss you Grandma! Here is a photo of our trip last year.")</span>
                </p>

                <div className="w-full h-36 rounded-xl overflow-hidden shadow-inner border border-gray-100 mb-3">
                  <img 
                    src="https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=600" 
                    alt="Family Trip" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </>
            )}

            <button 
              onClick={() => setShowFamilyLoveModal(false)}
              className="w-full bg-[#9b4a3a] text-white text-base font-bold py-2 rounded-lg shadow-md active:translate-y-0.5"
            >
              Beautiful!
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
