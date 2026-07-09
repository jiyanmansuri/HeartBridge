import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { UtensilsCrossed, BookOpen, Scissors, Languages, Upload, X, Calendar, User, Camera } from 'lucide-react'

const features = [
  {
    id: 1,
    titleEn: "Grandma's Kitchen",
    titleGu: "Grandma's Kitchen",
    descEn: "Share your secret family recipes and the beautiful stories behind them.",
    descGu: "Share your secret family recipes and the beautiful stories behind them.",
    icon: UtensilsCrossed,
    color: "bg-[#e8dcc4] text-[#8b5a2b]", // Soft beige, dark terracotta
    borderColor: "border-[#d9c4a3]"
  },
  {
    id: 2,
    titleEn: "Tales from Our Roots",
    titleGu: "Tales from Our Roots",
    descEn: "Post folk tales and childhood memories. Listen to others using voice comments.",
    descGu: "Post folklore and childhood memories. Listen to others using voice comments.",
    icon: BookOpen,
    color: "bg-[#dceddd] text-[#3c5a3d]", // Sage green, dark forest
    borderColor: "border-[#c4e0c6]"
  },
  {
    id: 3,
    titleEn: "Handmade & Heirlooms",
    titleGu: "Handmade & Heirlooms",
    descEn: "Showcase your beautiful crafts, knitting, or traditional home remedies.",
    descGu: "Showcase your beautiful handicrafts, knitting, or traditional home remedies.",
    icon: Scissors,
    color: "bg-[#f4dfd4] text-[#9b4a3a]", // Soft terracotta, dark red-brown
    borderColor: "border-[#eecbb9]"
  },
  {
    id: 4,
    titleEn: "Multilingual Support",
    titleGu: "Worldwide Stories",
    descEn: "Connect easily with friends! Everything auto-translates to your regional language.",
    descGu: "Connect with friends worldwide! Sharing and learning is seamless.",
    icon: Languages,
    color: "bg-[#dcebf4] text-[#2c4e6b]", // Soft blue, dark navy
    borderColor: "border-[#b9d9ee]"
  }
]

export default function WorldwideCircles({ user, initialCategory, onClearCategory }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null) // holds selected card/category
  const [contentText, setContentText] = useState('')
  const [translatorText, setTranslatorText] = useState('')
  const [isFormExpanded, setIsFormExpanded] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [targetLang, setTargetLang] = useState('gu')
  const [translationResult, setTranslationResult] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedPosts, setTranslatedPosts] = useState({})

  const translatePostText = (postId, text) => {
    const targetLang = localStorage.getItem('readPostsIn') || 'gu'
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    
    const clientWordsMap = {
      "hello": "hello",
      "how are you": "how are you",
      "good morning": "good morning",
      "good night": "good night",
      "water": "water",
      "food": "food",
      "medicine": "medicine",
      "thank you": "thank you",
      "hello": "Hello",
      "how are you": "How are you",
      "good morning": "Good morning"
    }
    const normalized = text.toLowerCase().trim().replace(/[?!.]/g, "")
    if (clientWordsMap[normalized]) {
      setTranslatedPosts(prev => ({ ...prev, [postId]: clientWordsMap[normalized] }))
      return
    }

    fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        target_lang: targetLang
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.translated_text) {
          setTranslatedPosts(prev => ({ ...prev, [postId]: data.translated_text }))
        }
      })
      .catch(err => {
        console.error(err)
        const targetLabel = targetLang === 'gu' ? 'GU' : 'EN'
        setTranslatedPosts(prev => ({ ...prev, [postId]: `(${targetLabel}) ${text}` }))
      })
  }

  const handleTranslate = (e) => {
    e.preventDefault()
    const text = translatorText.trim()
    if (!text) return
    setIsTranslating(true)

    // Robust client-side dictionary for instant translations
    const clientWordsMap = {
      "hello": "hello",
      "how are you": "how are you",
      "good morning": "good morning",
      "good night": "good night",
      "water": "water",
      "food": "food",
      "medicine": "medicine",
      "thank you": "thank you",
      "sky": "sky",
      "blue": "blue",
      "sun": "sun",
      "mother": "mother",
      "father": "father",
      "home": "home",
      "hello": "Hello",
      "how are you": "How are you",
      "good morning": "Good morning",
      "good night": "Good night",
      "water": "Water",
      "food": "Food",
      "medicine": "Medicine",
      "thank you": "Thank you",
      "sky": "Sky",
      "blue": "Blue",
      "sun": "Sun",
      "mother": "Mother",
      "father": "Father",
      "home": "Home"
    }

    const normalized = text.toLowerCase().replace(/[?!.]/g, "")
    if (clientWordsMap[normalized]) {
      setTranslationResult(clientWordsMap[normalized])
      setIsTranslating(false)
      return
    }

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        target_lang: targetLang
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Server error")
        return res.json()
      })
      .then(data => {
        setTranslationResult(data.translated_text || '')
        setIsTranslating(false)
      })
      .catch(err => {
        console.error(err)
        // Client-side fallback wrapper so user ALWAYS sees output even if backend is offline
        const targetLabel = targetLang === 'gu' ? 'GU' : 'EN'
        setTranslationResult(`(${targetLabel}) ${text}`)
        setIsTranslating(false)
      })
  }

  useEffect(() => {
    if (initialCategory) {
      const matched = features.find(f => f.titleEn === initialCategory)
      if (matched) {
        setActiveModal(matched)
      }
      if (onClearCategory) {
        onClearCategory()
      }
    }
  }, [initialCategory])

  const fetchPosts = () => {
    setLoading(true)
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    fetch(`${API_BASE}/api/circle/list`)
      .then(res => res.json())
      .then(data => {
        setPosts(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('modal-state', { detail: { open: !!activeModal } }))
  }, [activeModal])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleCreatePost = (e) => {
    e.preventDefault()
    if (!contentText.trim()) return

    setIsSubmitting(true)
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const formData = new FormData()
    formData.append('user_id', user?.id || 1)
    formData.append('category', activeModal.titleEn)
    formData.append('content_text', contentText)
    if (selectedFile) {
      formData.append('photo', selectedFile)
    }

    fetch(`${API_BASE}/api/circle/post`, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(() => {
        setIsSubmitting(false)
        setContentText('')
        setSelectedFile(null)
        setPreviewUrl(null)
        setActiveModal(null)
        setIsFormExpanded(false)
        setSuccessMessage("Post shared successfully!")
        fetchPosts()
        setTimeout(() => setSuccessMessage(''), 5000)
      })
      .catch(err => {
        console.error(err)
        setIsSubmitting(false)
      })
  }

  const renderModal = () => {
    if (!activeModal) return null
    const isTranslatorMode = activeModal.titleEn === "Multilingual Support"

    return createPortal(
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in pb-20 pt-4"
        style={{ zIndex: 9999 }}
      >
        <div className="bg-white border-4 border-[#e8dcc4] rounded-[2.5rem] w-full max-w-xl p-4 md:p-5 shadow-2xl relative flex flex-col max-h-[85vh]">
          {/* Close Button */}
          <button 
            onClick={() => {
              setActiveModal(null)
              setContentText('')
              setTranslatorText('')
              setSelectedFile(null)
              setPreviewUrl(null)
              setTranslationResult('')
              setIsFormExpanded(false)
            }}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 text-[#5c4a3d] transition-colors z-25"
          >
            <X size={24} />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-2.5 mb-3 flex-shrink-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${activeModal.color} ${activeModal.borderColor}`}>
              {React.createElement(activeModal.icon, { size: 22 })}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#5c4a3d] leading-tight">
                {activeModal.titleGu}
              </h2>
              <p className="text-xs text-[#7a6352] font-semibold">
                ({activeModal.titleEn})
              </p>
            </div>
          </div>

          {/* Scrollable Container */}
          <div className="flex flex-col gap-3 flex-grow overflow-y-auto pr-1 mb-2">
            {/* Translator Section (Shown only for Multilingual Support at the top) */}
            {isTranslatorMode && (
              <div className="bg-[#fcfbf9] border-2 border-[#b9d9ee] rounded-2xl p-3 flex flex-col gap-2.5 shadow-sm">
                <h3 className="text-xs font-black text-[#2c4e6b] uppercase tracking-wider">Translator Tool</h3>
                
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-[#5c4a3d]">
                    Direction
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetLang('gu')
                        setTranslationResult('')
                      }}
                      className={`flex-1 py-1 px-2 rounded-lg border text-xs font-bold transition-all ${
                        targetLang === 'gu'
                          ? 'bg-[#dcebf4] border-[#2c4e6b] text-[#2c4e6b]'
                          : 'bg-white border-[#f0e6d2] text-[#7a6352] hover:bg-gray-50'
                      }`}
                    >
                      Translate to English
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetLang('en')
                        setTranslationResult('')
                      }}
                      className={`flex-1 py-1 px-2 rounded-lg border text-xs font-bold transition-all ${
                        targetLang === 'en'
                          ? 'bg-[#dcebf4] border-[#2c4e6b] text-[#2c4e6b]'
                          : 'bg-white border-[#f0e6d2] text-[#7a6352] hover:bg-gray-50'
                      }`}
                    >
                      Translate to English
                    </button>
                  </div>
                </div>

                <div className="flex gap-1.5 items-end">
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-[#5c4a3d]">Text to Translate</span>
                    <input
                      type="text"
                      value={translatorText}
                      onChange={(e) => setTranslatorText(e.target.value)}
                      placeholder={
                        targetLang === 'gu'
                          ? "Type in English..."
                          : "Type in Gujarati..."
                      }
                      className="w-full px-2 py-1.5 text-xs border border-[#f0e6d2] rounded-lg focus:outline-none focus:border-[#2c4e6b] text-elder-brown font-semibold bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="bg-[#2c4e6b] hover:bg-[#1e3549] disabled:bg-gray-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    {isTranslating ? '...' : 'Translate'}
                  </button>
                </div>

                {translationResult && (
                  <div className="flex flex-col gap-0.5 bg-[#f4f7f9] border border-[#b9d9ee] rounded-lg p-2 animate-fade-in">
                    <span className="text-[9px] font-black text-[#2c4e6b]">Result</span>
                    <p className="text-sm font-bold text-[#111827] select-all leading-snug">{translationResult}</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(translationResult)
                        alert("Copied!")
                      }}
                      className="self-end text-[10px] font-bold text-[#2c4e6b] hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Category Stories Feed */}
            {(() => {
              const categoryPosts = posts.filter(p => p.category === activeModal.titleEn);
              return (
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-black text-[#5c4a3d] uppercase tracking-wider py-1 border-b border-orange-50 bg-white sticky top-0 z-10">
                    Stories in this category
                  </h4>
                  {categoryPosts.length === 0 ? (
                    <p className="text-xs text-gray-400 font-bold italic py-4">No posts in this category yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {categoryPosts.map(post => {
                        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                        const mediaUrl = post.media_path ? `${API_BASE}/${post.media_path}` : null;
                        return (
                          <div key={post.id} className="bg-[#fdfbf7] border border-[#f0e6d2] rounded-xl p-2 flex gap-2.5 items-start shadow-sm">
                            <div className="flex-1 flex flex-col gap-1">
                              <p className="text-[10px] text-[#7a6352] font-black">{post.author_name} • {new Date(post.created_at).toLocaleDateString([], {month:'short', day:'numeric'})}</p>
                              <p className="text-xs font-semibold text-[#5c4a3d] leading-normal">{post.content_text}</p>
                            </div>
                            {mediaUrl && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#f0e6d2] flex-shrink-0">
                                <img src={mediaUrl} className="w-full h-full object-cover" alt="Media" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Sticky/Fixed Add Post Form Container at Bottom */}
          <div className="pt-2 border-t border-[#e8dcc4] bg-white flex-shrink-0">
            {!isFormExpanded ? (
              /* Minimized Post Button */
              <div 
                onClick={() => setIsFormExpanded(true)} 
                className="flex items-center justify-between p-2.5 bg-[#fdfbf7] border-2 border-[#e8dcc4] rounded-2xl cursor-pointer hover:bg-orange-50/20 transition-all shadow-sm"
              >
                <span className="text-xs md:text-sm font-bold text-[#7a6352] flex items-center gap-2">
                  Write a new post...
                </span>
                <span className="text-[10px] md:text-xs bg-[#d9774e] text-white px-2.5 py-1 rounded-xl font-black">
                  Write
                </span>
              </div>
            ) : (
              /* Expanded Post Form */
              <form onSubmit={handleCreatePost} className="flex flex-col gap-2 animate-fade-in">
                <h5 className="text-xs font-black text-[#5c4a3d]">Add New Post</h5>
                
                <div className="flex gap-2 items-center">
                  <textarea
                    rows={1.5}
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    placeholder="Write your post..."
                    required
                    className="flex-1 p-2 text-xs border border-[#f0e6d2] rounded-lg focus:outline-none focus:border-[#d9774e] text-elder-brown font-semibold bg-orange-50/10 resize-none"
                  />
                  
                  {previewUrl ? (
                    <div className="w-11 h-11 rounded-lg border border-[#f0e6d2] overflow-hidden relative shadow-sm flex-shrink-0">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedFile(null)
                          setPreviewUrl(null)
                        }}
                        className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ) : (
                    <label className="p-2 border border-dashed border-[#d9c4a3] hover:border-[#d9774e] bg-[#f9f4ec] rounded-lg cursor-pointer hover:bg-orange-50/30 transition-all flex items-center justify-center flex-shrink-0">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                      <Camera size={16} className="text-[#8b5a2b]" />
                    </label>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormExpanded(false)
                      setContentText('')
                      setSelectedFile(null)
                      setPreviewUrl(null)
                    }}
                    className="border border-[#f0e6d2] hover:bg-gray-50 text-[#5c4a3d] text-xs font-bold py-1 px-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#d9774e] hover:bg-[#c2653e] disabled:bg-gray-400 text-white text-xs font-bold py-1 px-4 rounded-lg shadow-sm transition-all"
                  >
                    {isSubmitting ? 'Sharing...' : 'Share'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div className="flex flex-col gap-10 mt-4 bg-[#fdfbf7] p-6 rounded-[3rem] border-4 border-[#f0e6d2]">
      {successMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[#769b76] text-white text-2xl font-bold py-4 px-8 rounded-full shadow-lg z-50 animate-bounce">
          {successMessage}
        </div>
      )}

      {/* Header Section */}
      <section className="bg-[#f9f4ec] border-4 border-[#e8dcc4] rounded-[3rem] p-10 md:p-14 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-[#d9774e]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-[#769b76]/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <h1 className="text-4xl md:text-6xl font-display font-extrabold text-[#5c4a3d] mb-4 leading-tight relative z-10">
          The World is One Family
        </h1>
        
        <p className="text-2xl md:text-3xl text-[#7a6352] font-medium max-w-3xl mx-auto leading-relaxed relative z-10 mt-6">
          Share your stories, art, and traditions with friends worldwide. Start a new conversation.
        </p>
      </section>

      {/* Worldwide Feed Section */}
      <div className="border-t-4 border-[#f0e6d2] pt-8">
        <h2 className="text-4xl font-extrabold text-[#5c4a3d] mb-6 flex items-center gap-3">
          <span>Worldwide Stories & Art</span>
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d9774e]"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {posts.map((post) => {
              const feat = features.find(f => f.titleEn === post.category) || features[0]
              const Icon = feat.icon
              const colorClass = feat.color
              const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
              const mediaUrl = post.media_path ? `${API_BASE}/${post.media_path}` : null

              return (
                <div key={post.id} className="bg-white border-4 border-[#f0e6d2] rounded-[2.5rem] p-6 md:p-8 shadow-lg flex flex-col md:flex-row gap-6">
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-4 py-1 rounded-full text-lg font-bold flex items-center gap-2 ${colorClass}`}>
                        <Icon size={18} />
                        {post.category}
                      </span>
                      <span className="text-[#7a6352] text-md font-bold flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-[#5c4a3d] flex items-center gap-2">
                      <User size={24} className="text-[#d9774e]" />
                      {post.author_name}
                    </h3>

                    <p className="text-xl md:text-2xl text-[#7a6352] leading-relaxed whitespace-pre-wrap font-medium">
                      {post.content_text}
                    </p>

                    {localStorage.getItem('translateComments') !== 'false' && (
                      <div className="mt-1 pt-3 border-t border-dashed border-orange-100 flex flex-col gap-2">
                        {translatedPosts[post.id] ? (
                          <div className="bg-orange-50/15 border border-[#e8dcc4] p-3 rounded-2xl animate-fade-in text-left">
                            <span className="text-xs font-black text-[#d9774e] uppercase block mb-1">Translated Content</span>
                            <p className="text-lg md:text-xl font-bold text-[#5c4a3d] leading-normal">{translatedPosts[post.id]}</p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => translatePostText(post.id, post.content_text)}
                            className="self-start text-[#d9774e] hover:text-[#c2653e] font-black text-base flex items-center gap-1.5 hover:underline"
                          >
                            Translate comments / post
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {mediaUrl && (
                    <div className="md:w-72 w-full h-56 md:h-auto rounded-3xl overflow-hidden border-4 border-[#f0e6d2] shadow-inner flex-shrink-0">
                      <img 
                        src={mediaUrl} 
                        alt="Uploaded Media" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Feature Cards Grid Section */}
      <div className="border-t-4 border-[#f0e6d2] pt-8 flex flex-col gap-4 w-full">
        <div className="text-left">
          <h2 className="text-3xl font-extrabold text-[#5c4a3d] flex items-center gap-3">
            <span>Share Stories & Culture</span>
          </h2>
          <p className="text-xl text-[#7a6352] font-semibold mt-1">
            Choose any category below to share your own story, recipe, or art.<br/>
            <span className="text-base opacity-90 block mt-0.5">(Select any category below to share your own story, recipe, or craft.)</span>
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-2">
          {features.map((feat) => {
            const Icon = feat.icon
            return (
              <div 
                key={feat.id} 
                onClick={() => setActiveModal(feat)}
                className="bg-white border-4 border-[#f0e6d2] rounded-[2.5rem] p-8 md:p-10 flex flex-col items-center text-center shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group"
              >
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border-2 ${feat.color} ${feat.borderColor} transform group-hover:scale-110 transition-transform`}>
                  <Icon size={48} strokeWidth={2} />
                </div>
                <h3 className="text-3xl font-bold text-[#5c4a3d] mb-3">
                  {feat.titleGu}
                  <span className="block text-xl opacity-80 mt-1">({feat.titleEn})</span>
                </h3>
                <p className="text-xl md:text-2xl text-[#7a6352] leading-relaxed font-medium">
                  {feat.descGu}
                  <span className="block text-lg opacity-80 mt-2">({feat.descEn})</span>
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {renderModal()}
    </div>
  )
}
