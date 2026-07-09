import { useState, useEffect, useRef } from 'react'
import { Camera, CalendarDays, Mic, History, Users, X, UploadCloud, FolderHeart, PlayCircle, Loader2, Square } from 'lucide-react'

export default function MemoryNook({ isFamilyView = false, user, elderId }) {
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [photosList, setPhotosList] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [selectedPhotosToShare, setSelectedPhotosToShare] = useState([])
  const [selectedFamilyToShare, setSelectedFamilyToShare] = useState([])
  const [loading, setLoading] = useState(false)
  const [dailyMemory, setDailyMemory] = useState(null)
  const [captionPhotoId, setCaptionPhotoId] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [captionTranscript, setCaptionTranscript] = useState('')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)
  const captionFileInputRef = useRef(null)
  const [captionFile, setCaptionFile] = useState(null)
  const [captionPreviewUrl, setCaptionPreviewUrl] = useState(null)
  const [captionAudioBlob, setCaptionAudioBlob] = useState(null)
  const [captionIsRecording, setCaptionIsRecording] = useState(false)
  const [selectedEventTag, setSelectedEventTag] = useState(null)
  const [customEvents, setCustomEvents] = useState(['Birthday', 'Holi', 'Diwali'])
  const [newEventName, setNewEventName] = useState('')
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  
  const fetchPhotos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/photo/list?user_id=${elderId}`)
      if(res.ok) {
        const data = await res.json()
        setPhotosList(data)
      }
    } catch(e) { console.error(e) }
  }

  const fetchDailyMemory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/photo/on_this_day?user_id=${elderId}`)
      if(res.ok) setDailyMemory(await res.json())
    } catch(e) { console.error(e) }
  }

  const fetchFamilyMembers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/users?is_elder=false`)
      if(res.ok) {
        const data = await res.json()
        setFamilyMembers(data.filter(f => f.family_group_id === (user?.family_group_id || 1)))
      }
    } catch(e) { console.error(e) }
  }

  useEffect(() => {
    if(elderId) {
      fetchPhotos()
      fetchDailyMemory()
      fetchFamilyMembers()
    }
  }, [elderId])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('modal-state', { detail: { open: !!selectedFeature } }))
  }, [selectedFeature])

  const handleShareSubmit = async () => {
    if(selectedPhotosToShare.length === 0 || selectedFamilyToShare.length === 0) return
    setLoading(true)
    try {
      await fetch(`${API_BASE}/api/photo/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_ids: selectedPhotosToShare,
          target_user_ids: selectedFamilyToShare
        })
      })
      alert("Photos shared successfully!")
      setSelectedPhotosToShare([])
      setSelectedFamilyToShare([])
      closeModal()
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('user_id', elderId)
    formData.append('photo', file)
    try {
      await fetch(`${API_BASE}/api/photo/upload`, { method: 'POST', body: formData })
      await fetchPhotos()
      await fetchDailyMemory()
    } catch(err) { console.error(err) }
    setLoading(false)
  }

  const handleRecordToggle = async (photoId) => {
    if (isRecording) {
      setIsRecording(false)
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
      if (recognitionRef.current) recognitionRef.current.stop()
    } else {
      setCaptionPhotoId(photoId)
      let localTranscript = ''
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
          const rec = new SpeechRecognition()
          rec.continuous = true
          rec.interimResults = false
          rec.lang = 'en-US'
          rec.onresult = (e) => {
            localTranscript = Array.from(e.results)
              .map(res => res[0].transcript)
              .join('')
          }
          recognitionRef.current = rec
          rec.start()
        }

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          setLoading(true)
          if (recognitionRef.current) {
            try { recognitionRef.current.stop() } catch(e) {}
          }
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', audioBlob, 'audio.webm')
          if (localTranscript) {
            formData.append('transcript', localTranscript)
          }
          try {
            await fetch(`${API_BASE}/api/photo/${photoId}/caption`, {
              method: 'POST',
              body: formData
            })
            await fetchPhotos()
          } catch(e) { console.error(e) }
          stream.getTracks().forEach(track => track.stop())
          setCaptionPhotoId(null)
          setLoading(false)
        }

        mediaRecorder.start()
        setIsRecording(true)
      } catch (err) {
        console.error(err)
      }
    }
  }
  const features = [
    { id: 1, titleGu: 'Add Photos/Videos', titleEn: 'Add Photos/Videos', icon: Camera, descGu: 'Keep all your precious moments safe.', descEn: 'Keep all your precious moments safe.' },
    { id: 2, titleGu: 'Auto-Sort by Event', titleEn: 'Auto-Sort by Event', icon: CalendarDays, descGu: 'We organize them so you don’t have to.', descEn: 'We organize them so you don’t have to.' },
    { id: 3, titleGu: 'Voice Captioning', titleEn: 'Voice Captioning', icon: Mic, descGu: 'Simply talk to add the story behind the photo.', descEn: 'Simply talk to add the story behind the photo.' },
    { id: 4, titleGu: 'Daily ‘On This Day’ Memory', titleEn: 'Daily ‘On This Day’ Memory', icon: History, descGu: 'Wake up to a beautiful memory from the past.', descEn: 'Wake up to a beautiful memory from the past.' }
  ]

  const handleCaptionFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCaptionFile(file)
      if (captionPreviewUrl) {
        URL.revokeObjectURL(captionPreviewUrl)
      }
      setCaptionPreviewUrl(URL.createObjectURL(file))
    }
  }

  const startCaptionRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setCaptionTranscript('')

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const rec = new SpeechRecognition()
        rec.continuous = true
        rec.interimResults = false
        rec.lang = 'en-US'
        rec.onresult = (e) => {
          const text = Array.from(e.results)
            .map(res => res[0].transcript)
            .join('')
          setCaptionTranscript(text)
        }
        recognitionRef.current = rec
        rec.start()
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setCaptionAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setCaptionIsRecording(true)
      setCaptionAudioBlob(null)
    } catch (err) {
      console.error(err)
      alert("Microphone access failed")
    }
  }

  const stopCaptionRecording = () => {
    if (mediaRecorderRef.current && captionIsRecording) {
      mediaRecorderRef.current.stop()
      setCaptionIsRecording(false)
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) {}
      }
    }
  }

  const handleSaveVoiceCaptionMemory = async () => {
    if (!captionFile) {
      alert("Please select a photo first")
      return
    }
    if (!captionAudioBlob) {
      alert("Please record audio first")
      return
    }

    setLoading(true)
    try {
      const photoFormData = new FormData()
      photoFormData.append('user_id', elderId)
      photoFormData.append('photo', captionFile)
      
      const photoRes = await fetch(`${API_BASE}/api/photo/upload`, {
        method: 'POST',
        body: photoFormData
      })
      if (!photoRes.ok) throw new Error("Photo upload failed")
      const photoData = await photoRes.json()
      const photoId = photoData.id

      const audioFormData = new FormData()
      audioFormData.append('audio', captionAudioBlob, 'audio.webm')
      if (captionTranscript) {
        audioFormData.append('transcript', captionTranscript)
      }
      
      const captionRes = await fetch(`${API_BASE}/api/photo/${photoId}/caption`, {
        method: 'POST',
        body: audioFormData
      })
      if (!captionRes.ok) throw new Error("Caption upload failed")
      
      alert("Memory saved successfully!")
      closeModal()
      fetchPhotos()
      fetchDailyMemory()
    } catch (e) {
      console.error(e)
      alert("Error saving memory")
    }
    setLoading(false)
  }

  const closeModal = () => {
    setSelectedFeature(null)
    setCaptionFile(null)
    setSelectedEventTag(null)
    if (captionPreviewUrl) {
      URL.revokeObjectURL(captionPreviewUrl)
    }
    setCaptionPreviewUrl(null)
    setCaptionAudioBlob(null)
    setCaptionIsRecording(false)
  }

  return (
    <section 
      aria-labelledby="memory-nook-heading"
      className="w-full bg-[#fdfbf7] border-4 border-[#f0e6d2] rounded-[3rem] p-8 md:p-12 shadow-xl my-10 flex flex-col items-center max-w-4xl mx-auto"
    >
      <div className="text-center mb-10">
        <h2 id="memory-nook-heading" className="text-4xl md:text-5xl font-display font-extrabold text-[#5c4a3d] mb-4 leading-tight drop-shadow-sm">
          Your memories, always with you.<br />
          <span className="text-2xl md:text-3xl font-medium opacity-80">(Your Memories, Always With You.)</span>
        </h2>
        <p className="text-xl md:text-2xl text-[#7a6352] font-medium max-w-2xl mx-auto leading-relaxed">
          Welcome to Memory Nook. A cozy place to save your life's beautiful moments and share them with loved ones.<br />
          <span className="text-lg md:text-xl opacity-80">(Welcome to the Memory Nook. A safe, warm place to gather your life's beautiful moments and share them with the ones you love.)</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full mb-12 max-w-5xl mx-auto">
        {features.map((feat) => {
          const Icon = feat.icon
          return (
            <button 
              key={feat.id} 
              onClick={() => setSelectedFeature(feat)}
              className="bg-white border-2 border-[#e8dcc4] rounded-3xl p-6 md:p-8 flex flex-col items-center text-center shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 focus:ring-4 focus:ring-[#d9774e]/50 outline-none w-full"
            >
              <div className="w-20 h-20 bg-[#f9f2e8] rounded-full flex items-center justify-center text-[#d9774e] mb-4 shadow-inner pointer-events-none">
                <Icon size={40} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-[#5c4a3d] mb-1 pointer-events-none">
                {isFamilyView ? feat.titleEn : feat.titleGu} 
                {!isFamilyView && <span className="text-lg block opacity-80 font-normal">({feat.titleEn})</span>}
              </h3>
              <p className="text-lg text-[#7a6352] leading-snug mt-2 pointer-events-none">
                {isFamilyView ? feat.descEn : feat.descGu}<br/>
                {!isFamilyView && <span className="text-base opacity-80">({feat.descEn})</span>}
              </p>
            </button>
          )
        })}
      </div>

      {/* Interactive Feature Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-sm animate-fade-in pb-20 pt-4">
          <div className="bg-[#fdfbf7] w-full max-w-2xl rounded-[1.5rem] shadow-2xl border-4 border-[#f0e6d2] flex flex-col max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#e8dcc4] bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f9f2e8] rounded-full flex items-center justify-center text-[#d9774e]">
                  <selectedFeature.icon size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-[#5c4a3d]">
                  {isFamilyView ? selectedFeature.titleEn : selectedFeature.titleGu}
                </h3>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 md:p-5 flex-1 flex flex-col">
              {selectedFeature.id === 1 && (
                <div className="flex flex-col items-center text-center gap-3">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-[#d9774e]/50 rounded-xl bg-white p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f9f2e8]/30 transition-colors">
                    {loading ? <Loader2 size={36} className="text-[#d9774e] mb-2 animate-spin" /> : <UploadCloud size={36} className="text-[#d9774e] mb-2" />}
                    <p className="text-lg font-bold text-[#5c4a3d] mb-0.5">{loading ? 'Uploading...' : 'Click to Upload Photos'}</p>
                    <p className="text-sm text-[#7a6352]">Select an image file</p>
                  </div>
                  <div className="w-full grid grid-cols-3 gap-3 mt-2">
                    {photosList.flatMap(g => g.photos).slice(0, 3).map(p => (
                       <div key={p.id} className="bg-gray-200 aspect-square rounded-lg shadow-inner overflow-hidden">
                        <img src={`${API_BASE}/${p.file_path}`} className="w-full h-full object-cover" alt="Memory" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFeature.id === 2 && (
                <div className="flex flex-col gap-4">
                  {selectedEventTag ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedEventTag(null)}
                          className="bg-white border border-[#e8dcc4] text-[#8b5a2b] font-bold text-base py-1.5 px-3 rounded-lg flex items-center gap-1.5 hover:bg-orange-50/50 transition-colors"
                        >
                          Back to Events
                        </button>
                        
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          id="event-specific-upload" 
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setLoading(true);
                            const formData = new FormData();
                            formData.append('user_id', elderId);
                            formData.append('photo', file);
                            formData.append('event_tag', selectedEventTag);
                            try {
                              await fetch(`${API_BASE}/api/photo/upload`, { method: 'POST', body: formData });
                              await fetchPhotos();
                            } catch(err) { console.error(err); }
                            setLoading(false);
                          }} 
                        />
                        <label 
                          htmlFor="event-specific-upload" 
                          className="cursor-pointer bg-[#769b76] hover:bg-[#5f805f] text-white font-bold text-sm py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <UploadCloud size={16} /> Add Photo
                        </label>
                      </div>

                      <h4 className="text-xl font-bold text-[#5c4a3d] capitalize mb-1">
                        Event: {selectedEventTag}
                      </h4>
                      
                      {(() => {
                        const targetGroup = photosList.find(g => g.event_tag?.toLowerCase() === selectedEventTag?.toLowerCase());
                        const photos = targetGroup ? targetGroup.photos : [];
                        if (photos.length === 0) {
                          return (
                            <p className="text-center text-gray-500 py-6 font-medium">
                              No photos in this event yet. Tap the button above to add photos!<br/>
                              (No photos in this event yet. Use button above to add!)
                            </p>
                          );
                        }
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {photos.map(p => (
                              <div key={p.id} className="bg-white p-2 rounded-2xl border border-[#e8dcc4] shadow-sm flex flex-col gap-2">
                                <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden border border-[#f0e6d2]">
                                  <img src={`${API_BASE}/${p.file_path}`} className="w-full h-full object-cover" alt="Event Memory" />
                                </div>
                                {p.transcript ? (
                                  <p className="text-base font-medium text-[#7a6352] italic p-1.5 bg-[#fdfbf7] rounded-lg border border-[#f0e6d2]">
                                    "{p.transcript}"
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-400 italic text-center p-1.5">
                                    No caption recorded
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Create New Event Tag Input Form */}
                      <div className="flex gap-2 p-3 bg-white rounded-xl border border-[#e8dcc4] mb-2 shadow-sm">
                        <input 
                          type="text" 
                          value={newEventName} 
                          onChange={e => setNewEventName(e.target.value)} 
                          placeholder="New event name..." 
                          className="flex-1 px-3 py-1.5 border border-[#e8dcc4] rounded-lg text-sm focus:outline-none focus:border-[#d9774e] font-semibold text-[#5c4a3d]"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const val = newEventName.trim();
                            if (val) {
                              if (!customEvents.some(e => e.toLowerCase() === val.toLowerCase())) {
                                setCustomEvents([...customEvents, val]);
                              }
                              setNewEventName('');
                              setSelectedEventTag(val);
                            }
                          }}
                          className="bg-[#d9774e] hover:bg-[#c2653e] text-white font-bold px-4 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap"
                        >
                          Create Event
                        </button>
                      </div>

                      {(() => {
                        const serverTags = photosList.map(g => g.event_tag);
                        const combinedTags = Array.from(new Set([...customEvents, ...serverTags])).filter(t => t && t !== "Misc");
                        // Append "Misc" at the end if it exists in server tags
                        if (serverTags.includes("Misc")) {
                          combinedTags.push("Misc");
                        }

                        return (
                          <div className="flex flex-col gap-3">
                            {combinedTags.map(tag => {
                              const group = photosList.find(g => g.event_tag?.toLowerCase() === tag.toLowerCase());
                              const count = group ? group.photos.length : 0;
                              return (
                                <div 
                                  key={tag} 
                                  onClick={() => setSelectedEventTag(tag)}
                                  className="bg-white p-4 rounded-xl border border-[#e8dcc4] flex items-center justify-between shadow-sm hover:shadow-md cursor-pointer hover:border-[#d9774e]/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <FolderHeart className="text-[#d9774e]" size={32} />
                                    <div>
                                      <h4 className="text-lg font-bold text-[#5c4a3d] capitalize">{tag}</h4>
                                      <p className="text-sm text-[#7a6352] font-semibold">{count} Photos</p>
                                    </div>
                                  </div>
                                  <span className="text-xl text-[#d9774e]">➡️</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {selectedFeature.id === 3 && (
                <div className="flex flex-col items-center gap-4 w-full py-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={captionFileInputRef} 
                    onChange={handleCaptionFileChange} 
                  />
                  
                  {/* Photo Section */}
                  <div className="w-full">
                    {captionPreviewUrl ? (
                      <div className="relative w-full max-w-xs mx-auto aspect-video rounded-xl overflow-hidden border-2 border-[#e8dcc4] shadow-md group">
                        <img src={captionPreviewUrl} className="w-full h-full object-cover" alt="Preview" />
                        <div 
                          onClick={() => captionFileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-base"
                        >
                          Change Photo
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => captionFileInputRef.current?.click()} 
                        className="w-full border border-dashed border-[#d9774e]/50 rounded-xl bg-white p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f9f2e8]/30 transition-colors text-center"
                      >
                        <UploadCloud size={36} className="text-[#d9774e] mb-1" />
                        <p className="text-base font-bold text-[#5c4a3d] mb-0.5">1. Choose Photo</p>
                        <p className="text-xs text-[#7a6352]">Upload memory photo</p>
                      </div>
                    )}
                  </div>

                  {/* Audio Recording Section */}
                  <div className="w-full flex flex-col items-center gap-3 text-center">
                    <p className="text-base font-bold text-[#5c4a3d]">2. Record Story</p>
                    
                    {captionIsRecording ? (
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={stopCaptionRecording}
                          className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl animate-pulse cursor-pointer border-2 border-red-200"
                        >
                          <Square size={20} fill="white" />
                        </button>
                        <p className="text-sm font-bold text-red-600 animate-pulse">
                          Recording... Tap to stop
                        </p>
                      </div>
                    ) : captionAudioBlob ? (
                      <div className="flex flex-col items-center gap-2 w-full bg-[#f9f2e8]/50 p-3 rounded-xl border border-[#e8dcc4] max-w-md">
                        <p className="text-base font-bold text-green-700">✓ Voice recorded!</p>
                        <audio src={URL.createObjectURL(captionAudioBlob)} controls className="w-full" />
                        <button 
                          onClick={startCaptionRecording} 
                          className="text-base font-bold text-[#d9774e] hover:text-[#c2653e] mt-0.5 flex items-center gap-1.5"
                        >
                          <Mic size={16} /> Record again
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <button 
                          onClick={startCaptionRecording}
                          className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
                        >
                          <Mic size={24} />
                        </button>
                        <p className="text-base font-bold text-[#5c4a3d]">
                          Tap mic to record
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  {captionFile && captionAudioBlob && (
                    <div className="w-full mt-2">
                      <button 
                        onClick={handleSaveVoiceCaptionMemory}
                        disabled={loading}
                        className="w-full bg-[#d9774e] hover:bg-[#c2653e] disabled:bg-gray-300 text-white font-bold text-lg py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" size={28} /> 
                            Saving...
                          </>
                        ) : (
                          'Save Memory'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedFeature.id === 4 && (
                <div className="flex flex-col items-center text-center gap-4">
                  <h3 className="text-3xl font-display font-bold text-[#d9774e] mb-2">On This Day</h3>
                  {dailyMemory ? (
                    <div className="w-full max-w-sm bg-white p-3 rounded-2xl shadow-xl transform -rotate-2">
                      <div className="bg-gray-200 aspect-square rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                        <img src={`${API_BASE}/${dailyMemory.file_path}`} className="w-full h-full object-cover" alt="Daily Memory" />
                      </div>
                      <p className="text-xl font-handwriting text-[#5c4a3d] p-2">
                        {(() => {
                          const year = dailyMemory.created_at ? new Date(dailyMemory.created_at).getFullYear() : 2019;
                          const gujYear = year;
                          const eventTextEn = dailyMemory.transcript || dailyMemory.event_tag || "Beautiful Memory";
                          const gujMap = {
                            "Holi": "Holi Celebration",
                            "Diwali": "Diwali Festival",
                            "Birthday": "Birthday Celebration",
                            "Grandson's first birthday": "Grandson's first birthday",
                            "Misc": "Beautiful Memory"
                          };
                          let eventTextGu = dailyMemory.transcript || "";
                          if (!eventTextGu && dailyMemory.event_tag) {
                            eventTextGu = gujMap[dailyMemory.event_tag] || dailyMemory.event_tag;
                          }
                          if (!eventTextGu) eventTextGu = "Beautiful Memory";
                          return `On this day in ${year} – ${eventTextEn}`;
                        })()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 mt-10">No daily memory available yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
