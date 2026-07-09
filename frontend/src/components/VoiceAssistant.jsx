import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, X, Bell } from 'lucide-react'

// Web Speech API interfaces
let recognition = null
if (typeof window !== 'undefined') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (SpeechRecognition) {
    recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
  }
}

export default function VoiceAssistant({ user, elderId, currentTab, setCurrentTab, medicines, appointments }) {
  const userLanguage = user?.language || 'en'
  const lang = userLanguage === 'gu' ? 'gu-IN' : 'en-US'

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [showBubble, setShowBubble] = useState(false)
  const [visualAlerts, setVisualAlerts] = useState([])
  
  // Conversational Medicine States
  const [confirmingMedicine, setConfirmingMedicine] = useState(null)
  const [confirmingAttempt, setConfirmingAttempt] = useState(0)
  const [isMedicalCheckup, setIsMedicalCheckup] = useState(false)
  const [medicalTranscript, setMedicalTranscript] = useState('')
  const [isFamilyMessage, setIsFamilyMessage] = useState(false)
  
  const spokenAlertsRef = useRef(new Set())
  const noAnswerTimeoutRef = useRef(null)

  const triggerVisualAlert = (message) => {
    const id = Date.now()
    setVisualAlerts(prev => [...prev, { id, message }])
    setTimeout(() => {
      setVisualAlerts(prev => prev.filter(a => a.id !== id))
    }, 6000)
  }

  // Child-like caring titles: Grandma/Grandpa
  const getElderTitle = () => {
    if (userLanguage === 'gu') {
      return user?.name?.toLowerCase().includes('hector') ? 'Grandpa' : 'Grandma'
    } else {
      return user?.name?.toLowerCase().includes('hector') ? 'Grandpa' : 'Grandma'
    }
  }

  // Speech helper
  const speak = (text) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.95  // Slightly slower for a more natural, conversational cadence
      utterance.pitch = 1.02 // Mildly warmer pitch
      
      const voices = window.speechSynthesis.getVoices()
      const langVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith(userLanguage.toLowerCase()))
      
      // Prioritize high-quality online neural and natural human voices first
      const premiumVoiceKeywords = [
        'microsoft aria',           // High-quality Edge neural voice
        'google us english',         // High-quality Chrome neural voice
        'google uk english female',  // High-quality UK voice
        'samantha',                  // High-quality Apple natural voice
        'female',
        'zira',
        'hazel'
      ]
      
      let chosenVoice = null
      for (const keyword of premiumVoiceKeywords) {
        chosenVoice = langVoices.find(voice => voice.name.toLowerCase().includes(keyword))
        if (chosenVoice) break
      }
      
      chosenVoice = chosenVoice || langVoices[0]
      if (chosenVoice) {
        utterance.voice = chosenVoice
      }
      window.speechSynthesis.speak(utterance)
    }
  }

  // Speech helper with end callback
  const speakWithCallback = (text, onEndCallback) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.95
      utterance.pitch = 1.02
      
      const voices = window.speechSynthesis.getVoices()
      const langVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith(userLanguage.toLowerCase()))
      
      const premiumVoiceKeywords = [
        'microsoft aria',
        'google us english',
        'google uk english female',
        'samantha',
        'female',
        'zira',
        'hazel'
      ]
      
      let chosenVoice = null
      for (const keyword of premiumVoiceKeywords) {
        chosenVoice = langVoices.find(voice => voice.name.toLowerCase().includes(keyword))
        if (chosenVoice) break
      }
      
      chosenVoice = chosenVoice || langVoices[0]
      if (chosenVoice) {
        utterance.voice = chosenVoice
      }
      if (onEndCallback) {
        utterance.onend = () => {
          onEndCallback()
        }
      }
      window.speechSynthesis.speak(utterance)
    } else {
      if (onEndCallback) onEndCallback()
    }
  }

  // Handle sleep log POST directly
  const triggerSleepToggle = async (toSleep) => {
    const moodVal = toSleep ? 'sleeping' : 'awake'
    localStorage.setItem(`sleep_status_${elderId}`, moodVal)
    
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
      await fetch(`${API_BASE}/api/mood/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: elderId, mood: moodVal })
      })
      window.dispatchEvent(new CustomEvent('sleep-status-updated', { detail: moodVal }))
    } catch (e) {
      console.error(e)
    }
  }

  // Response checkers
  const checkPositiveResponse = (text) => {
    const t = text.toLowerCase().trim()
    if (userLanguage === 'gu') {
      return t.includes('yes') || t.includes('taken') || t.includes('took') || t.includes('sure') || t.includes('yeah') || t.includes('yep')
    } else {
      return t.includes('yes') || t.includes('yeah') || t.includes('take') || t.includes('taken') || t.includes('did') || t.includes('done') || t.includes('i did') || t.includes('i have') || t.includes('ok') || t.includes('sure')
    }
  }

  const checkNegativeResponse = (text) => {
    const t = text.toLowerCase().trim()
    if (userLanguage === 'gu') {
      return t.includes('no') || t.includes('not') || t.includes('not yet') || t.includes('pending')
    } else {
      return t.includes('no') || t.includes('not') || t.includes('haven') || t.includes('dont') || t.includes('don\'t') || t.includes('not yet') || t.includes('skip')
    }
  }

  // Emergency Alert trigger
  const sendEmergencyAlert = async (med) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
      await fetch(`${API_BASE}/api/family/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: elderId,
          medicine_name: med.name,
          message: `Elder did not take medicine ${med.name} within 15 minutes.`
        })
      })
      
      const title = getElderTitle()
      const alertReply = userLanguage === 'gu'
        ? `Oh dear ${title}, you haven't taken your medicine yet. I've sent an alert to Thomas. Please take it now!`
        : `Oh ${title}, since you didn't take your pills, I had to send an emergency alert to Thomas! Please take them now.`
      
      setResponse(alertReply)
      speak(alertReply)
      setShowBubble(true)
    } catch (e) {
      console.error('Failed to send emergency alert:', e)
    }
  }

  // Conversational Handlers
  const handleConfirmTakeMedicine = async (med) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    try {
      await fetch(`${API_BASE}/api/medicine/take/${med.medicine_id}?scheduled_at=${encodeURIComponent(med.scheduled_at)}&user_id=${elderId}`, {
        method: 'POST'
      })
      
      const title = getElderTitle()
      const reply = userLanguage === 'gu'
        ? `Great! I've marked that you took your medicine. I've let the family know!`
        : `Wonderful! I have marked your ${med.name} as taken and updated the family, ${title}.`
      
      setResponse(reply)
      speak(reply)
      
      window.dispatchEvent(new CustomEvent('medicine-taken-updated'))
      
      setConfirmingMedicine(null)
      setConfirmingAttempt(0)
      setTimeout(() => setShowBubble(false), 6000)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDenyTakeMedicine = (med) => {
    const nextAttempt = confirmingAttempt + 1
    setConfirmingAttempt(nextAttempt)
    const title = getElderTitle()
    
    let reply = ''
    if (userLanguage === 'gu') {
      if (nextAttempt <= 2) {
        reply = `Please don't refuse, dear ${title}. Taking medicine is important. Will you take ${med.name} now?`
      } else {
        reply = `Warning: dear ${title}, this medicine is vital for you. Please take ${med.name} immediately.`
      }
    } else {
      if (nextAttempt <= 2) {
        reply = `Oh ${title}, please don't say no! Taking your pills is so important to feel better. Will you take your ${med.name} now?`
      } else {
        reply = `Warning: You must take this medicine, dear ${title}. Please take your ${med.name} immediately.`
      }
    }
    
    setResponse(reply)
    speakWithCallback(reply, () => {
      try {
        setIsListening(true)
        recognition.start()
      } catch (e) {
        console.error(e)
      }
    })
  }

  const handleAmbiguousResponse = (med) => {
    const nextAttempt = confirmingAttempt + 1
    setConfirmingAttempt(nextAttempt)
    const title = getElderTitle()
    
    let reply = ''
    if (userLanguage === 'gu') {
      reply = `I didn't quite catch that, ${title}. Did you take the medicine? Please say yes or no.`
    } else {
      reply = `I didn't quite catch that, ${title}. Did you take your ${med.name}? Please say yes or no.`
    }
    
    setResponse(reply)
    speakWithCallback(reply, () => {
      try {
        setIsListening(true)
        recognition.start()
      } catch (e) {
        console.error(e)
      }
    })
  }

  const handleNoAnswer = (med) => {
    if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current)
    
    const nextAttempt = confirmingAttempt + 1
    setConfirmingAttempt(nextAttempt)
    const title = getElderTitle()
    
    if (nextAttempt > 3) {
      const quitReply = userLanguage === 'gu'
        ? `No response received, ${title}. I've sent an alert to your family.`
        : `No response received, ${title}. I am alerting the family.`
      setResponse(quitReply)
      speak(quitReply)
      
      // Auto-trigger alert if 3 attempts of silence occur
      sendEmergencyAlert(med)
      
      setConfirmingMedicine(null)
      setConfirmingAttempt(0)
      setTimeout(() => setShowBubble(false), 5000)
      return
    }

    let reply = ''
    if (userLanguage === 'gu') {
      reply = `Dear ${title}, I ask again. Did you take your ${med.name}?`
    } else {
      reply = `My dear ${title}, I am asking again. Did you take your ${med.name} pills?`
    }
    
    setResponse(reply)
    setShowBubble(true)
    
    speakWithCallback(reply, () => {
      try {
        setIsListening(true)
        recognition.start()
      } catch (e) {
        console.error(e)
      }
    })
  }

  const handleMedicalCheckup = async (text) => {
    const fullTranscript = medicalTranscript + " " + text
    setMedicalTranscript(fullTranscript)
    
    const isDone = text.toLowerCase().includes('done') || text.toLowerCase().includes('that\'s it') || text.toLowerCase().includes('no')
    
    if (isDone || fullTranscript.length > 60) {
      const title = getElderTitle()
      const reply = userLanguage === 'gu' 
        ? `Okay ${title}, I've noted down the details for the doctor.`
        : `Okay ${title}, I have noted down your symptoms for the doctor.`
      setResponse(reply)
      speak(reply)
      setIsMedicalCheckup(false)
      
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        await fetch(`${API_BASE}/api/medical_summary/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: elderId, transcript: fullTranscript })
        })
        window.dispatchEvent(new CustomEvent('medical-summary-updated'))
      } catch (e) {
        console.error(e)
      }
      setTimeout(() => setShowBubble(false), 6000)
    } else {
      const reply = userLanguage === 'gu' 
        ? `Does anything else hurt? Or is that all?`
        : `Does anything else hurt, or is that all?`
      setResponse(reply)
      speakWithCallback(reply, () => {
        try {
          setIsListening(true)
          recognition.start()
        } catch (e) { console.error(e) }
      })
    }
  }

  const handleFamilyMessage = async (text) => {
    const title = getElderTitle()
    const reply = userLanguage === 'gu'
      ? `Great ${title}, I've sent your message to Thomas!`
      : `Great ${title}, I have sent your message to the family!`
      
    setResponse(reply)
    speak(reply)
    setIsFamilyMessage(false)
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      await fetch(`${API_BASE}/api/family/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: elderId, message: text })
      })
      window.dispatchEvent(new CustomEvent('family-feed-updated'))
    } catch(e) {
      console.error(e)
    }
    setTimeout(() => setShowBubble(false), 6000)
  }

  // Process voice commands
  const processCommand = (text) => {
    const t = text.toLowerCase().trim()
    let reply = ''
    const title = getElderTitle()
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    
    if (t.includes('home') || t.includes('go home') || t.includes('dashboard')) {
      setCurrentTab('home')
      reply = `Sure ${title}, let's go back to the home page!`
    } else if (t.includes('memories') || t.includes('story') || t.includes('stories') || t.includes('mic')) {
      setCurrentTab('memories')
      reply = `Here you go ${title}, your beautiful stories page is open!`
    } else if (t.includes('medicine') || t.includes('medicines') || t.includes('pill') || t.includes('pills')) {
      setCurrentTab('medicine')
      reply = `Here is your medicine page, ${title}. Let's make sure everything is taken!`
    } else if (t.includes('sleep') || t.includes('go to sleep')) {
      triggerSleepToggle(true)
      reply = `Good night, ${title}! Sleep tight, I will let everyone know you are sleeping.`
    } else if (t.includes('awake') || t.includes('wake up') || t.includes('woke up')) {
      triggerSleepToggle(false)
      reply = `Good morning, ${title}! I am so happy you are awake, I will tell the family.`
    } else if (t.includes('appointment') || t.includes('appointments') || t.includes('doctor')) {
      const nextAppt = appointments && appointments[0]
      reply = nextAppt
        ? `My dear ${title}, your next appointment is ${nextAppt.title} at ${nextAppt.time}.`
        : `You have no appointments today, ${title}.`
    } else if (t.includes('health') || t.includes('checkup')) {
      setIsMedicalCheckup(true)
      setMedicalTranscript('')
      reply = `Okay ${title}, tell me what's bothering you. Where does it hurt?`
      speakWithCallback(reply, () => { try { setIsListening(true); recognition.start() } catch (e) {} })
      return
    } else if (t.includes('message') || t.includes('send message')) {
      setIsFamilyMessage(true)
      reply = `Sure ${title}, what would you like me to tell the family?`
      speakWithCallback(reply, () => { try { setIsListening(true); recognition.start() } catch (e) {} })
      return
    } else if (t.includes('how are you') || t.includes('who are you') || t.includes('hello') || t.includes('hi')) {
      reply = `I am your caring assistant, like your own grandchild! How can I help you today, ${title}?`
    } else {
      // Dynamic voice GPT fallback!
      fetch(`${API_BASE}/api/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: elderId, message: text })
      })
        .then(res => {
          if (!res.ok) throw new Error('API failed')
          return res.json()
        })
        .then(data => {
          const replyText = data.reply
          setResponse(replyText)
          speak(replyText)
        })
        .catch(err => {
          console.error(err)
          const fallbackReply = `I'm here for you, my dear ${title}. Is there anything else I can help you with?`
          setResponse(fallbackReply)
          speak(fallbackReply)
        })
      return
    }
    
    setResponse(reply)
    speak(reply)
    
    setTimeout(() => {
      setShowBubble(false)
    }, 6000)
  }

  // Initialize Speech Recognition handlers
  useEffect(() => {
    if (!recognition) return

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const resultText = event.results[0][0].transcript
      setTranscript(resultText)
      
      if (confirmingMedicine) {
        const isPositive = checkPositiveResponse(resultText)
        const isNegative = checkNegativeResponse(resultText)
        
        if (isPositive) {
          handleConfirmTakeMedicine(confirmingMedicine)
        } else if (isNegative) {
          handleDenyTakeMedicine(confirmingMedicine)
        } else {
          handleAmbiguousResponse(confirmingMedicine)
        }
      } else if (isMedicalCheckup) {
        handleMedicalCheckup(resultText)
      } else if (isFamilyMessage) {
        handleFamilyMessage(resultText)
      } else {
        processCommand(resultText)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event)
      setIsListening(false)
      
      if (confirmingMedicine) {
        if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current)
        noAnswerTimeoutRef.current = setTimeout(() => {
          if (confirmingMedicine) {
            handleNoAnswer(confirmingMedicine)
          }
        }, 15000)
      } else {
        const title = getElderTitle()
        const errReply = userLanguage === 'gu' 
          ? `Sorry ${title}, I couldn't hear you.` 
          : `Sorry ${title}, I couldn't hear you.`
        setResponse(errReply)
        speak(errReply)
        setTimeout(() => setShowBubble(false), 5000)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      
      if (confirmingMedicine && !transcript) {
        if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current)
        noAnswerTimeoutRef.current = setTimeout(() => {
          if (confirmingMedicine) {
            handleNoAnswer(confirmingMedicine)
          }
        }, 15000)
      }
    }
  }, [userLanguage, appointments, confirmingMedicine, transcript])

  // Reminder checking interval
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      // 1. Medicine reminder checks
      if (medicines && medicines.length > 0) {
        medicines.forEach(med => {
          const medTimeObj = new Date(med.scheduled_at)
          const medHHMM = `${String(medTimeObj.getHours()).padStart(2, '0')}:${String(medTimeObj.getMinutes()).padStart(2, '0')}`
          
          // A. Trigger voice assistant conversation at exact minute
          if (medHHMM === currentHHMM && !med.taken) {
            const alertId = `med_${med.medicine_id}_${currentHHMM}`
            if (!spokenAlertsRef.current.has(alertId)) {
              spokenAlertsRef.current.add(alertId)
              
              setConfirmingMedicine(med)
              setConfirmingAttempt(1)
              setTranscript('')
              setResponse('')
              setShowBubble(true)
              
              const title = getElderTitle()
              const promptText = userLanguage === 'gu'
                ? `Dear ${title}, it's time for your medicine. Please take ${med.name}. Did you take it?`
                : `My dear ${title}, it's time to take your medicine. Please take your sweet ${med.name} pill for me! Did you take it?`
              
              setResponse(promptText)
              speakWithCallback(promptText, () => {
                try {
                  setIsListening(true)
                  recognition.lang = lang
                  recognition.start()
                } catch (e) {
                  console.error(e)
                }
              })
              
              triggerVisualAlert(userLanguage === 'gu' 
                ? `Time to take medicine: ${med.name}` 
                : `Time to take your medicine: ${med.name}`
              )
            }
          }

          // B. Trigger Emergency alert to caregiver if overdue by 15+ minutes
          if (!med.taken) {
            const diffMs = now.getTime() - medTimeObj.getTime()
            const diffMins = Math.floor(diffMs / 60000)

            if (diffMins >= 15) {
              const emergencyAlertId = `med_emergency_${med.medicine_id}_15`
              if (!spokenAlertsRef.current.has(emergencyAlertId)) {
                spokenAlertsRef.current.add(emergencyAlertId)
                sendEmergencyAlert(med)
              }
            }
          }
        })
      }

      // 2. Appointment checks
      if (appointments && appointments.length > 0) {
        appointments.forEach(appt => {
          const apptTimeParts = appt.time.split(':')
          const apptHour = parseInt(apptTimeParts[0])
          const apptMinute = parseInt(apptTimeParts[1])
          
          const apptDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), apptHour, apptMinute)
          const diffMs = apptDate.getTime() - now.getTime()
          const diffMins = Math.round(diffMs / 60000)

          if (diffMins === 15) {
            const alertId = `appt_${appt.id}_15`
            if (!spokenAlertsRef.current.has(alertId)) {
              spokenAlertsRef.current.add(alertId)
              
              const title = getElderTitle()
              if (userLanguage === 'gu') {
                speak(`Dear ${title}, your appointment starts in 15 minutes: ${appt.title}.`)
              } else {
                speak(`Reminder dear ${title}, your appointment is starting in fifteen minutes: ${appt.title}.`)
              }
              triggerVisualAlert(userLanguage === 'gu'
                ? `Upcoming appointment in 15 minutes: ${appt.title}`
                : `Upcoming appointment: ${appt.title} (in 15 mins)`
              )
            }
          }
        })
      }
    }

    checkReminders()
    const checkInterval = setInterval(checkReminders, 30000)
    return () => clearInterval(checkInterval)
  }, [medicines, appointments, userLanguage])

  // Voice assistant button handler
  const toggleListening = () => {
    if (isListening) {
      try {
        recognition.stop()
      } catch (e) {
        console.error(e)
      }
      setIsListening(false)
    } else {
      setIsListening(true)
      setTranscript('')
      setResponse('')
      setShowBubble(true)
      
      try {
        recognition.lang = lang
        recognition.start()
      } catch (e) {
        console.error(e)
      }
      
      const title = getElderTitle()
      const welcome = `Listening, my dear ${title}...`
      speak(welcome)
    }
  }

  return (
    <>
      {/* Top Visual Alerts (Toast Notifications) */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
        {visualAlerts.map(alert => (
          <div key={alert.id} className="bg-indigo-900/90 text-white backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-500/30 animate-fade-in pointer-events-auto">
            <Bell size={24} className="text-yellow-400 animate-bounce" />
            <p className="font-bold text-lg flex-1">{alert.message}</p>
            <button 
              onClick={() => setVisualAlerts(prev => prev.filter(a => a.id !== alert.id))}
              className="text-white/60 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Floating Orb Container */}
      <div className="fixed bottom-36 right-6 z-50 flex flex-col items-end">
        {/* Transcription Speech Bubble */}
        {showBubble && (
          <div className="mb-4 bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl p-5 rounded-3xl w-72 md:w-80 text-left flex flex-col gap-3 animate-fade-in relative">
            <div className="absolute right-6 bottom-[-8px] w-4 h-4 bg-white/90 border-r border-b border-white/60 transform rotate-45"></div>
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowBubble(false)
                setConfirmingMedicine(null)
                setConfirmingAttempt(0)
              }} 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>

            <div>
              <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-1">
                <span>You said:</span>
              </p>
              <p className="text-lg font-bold text-elder-brown leading-snug font-display">
                {transcript || 'Listening...'}

              </p>
            </div>

            {response && (
              <div className="border-t border-gray-100 pt-2 flex gap-2 items-start">
                <Volume2 size={18} className="text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-1">
                    <span>Assistant:</span>
                  </p>
                  <p className="text-lg font-bold text-[#4F46E5] leading-snug font-display">
                    {response}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Voice Assistant Button (Orb) */}
        <button
          onClick={toggleListening}
          className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-2xl relative transition-all duration-500 hover:scale-105 active:scale-95 ${
            isListening 
              ? 'bg-gradient-to-br from-indigo-600 to-[#4F46E5] ring-8 ring-indigo-500/20' 
              : 'bg-gradient-to-br from-[#4F46E5] to-[#818CF8] hover:shadow-[0_12px_36px_rgba(79,70,229,0.3)]'
          }`}
        >
          {/* Audio Wave Pulsing Background (only when listening) */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-indigo-400/30 animate-ping"></span>
              <span className="absolute inset-2 rounded-full bg-indigo-500/20 animate-pulse"></span>
            </>
          )}
          
          {/* Core Orb Center */}
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all ${
            isListening ? 'bg-indigo-700' : 'bg-white/10 backdrop-blur border border-white/20'
          }`}>
            {isListening ? (
              <Mic size={32} className="text-white animate-pulse" />
            ) : (
              <Mic size={32} className="text-white" />
            )}
          </div>
        </button>
      </div>
    </>
  )
}
