import { useState, useEffect } from 'react'
import { CheckCircle, Circle, Plus, X, Camera, Trash2 } from 'lucide-react'

export default function Medicine({ elderId, setCurrentTab }) {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSingleMode, setIsSingleMode] = useState(false)
  
  // Add modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMed, setNewMed] = useState({ name: '', dose: '', schedule: '09:00', color_hex: '#4F46E5' })
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    setIsSingleMode(localStorage.getItem('singleElderMode') === 'true')
    fetchMedicines()
    window.addEventListener('medicine-taken-updated', fetchMedicines)
    return () => window.removeEventListener('medicine-taken-updated', fetchMedicines)
  }, [])

  const fetchMedicines = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_BASE}/api/medicine/today?user_id=${elderId}`)
      const data = await res.json()
      setMedicines(data)
      setLoading(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleTake = async (medicine_id, scheduled_at) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      await fetch(`${API_BASE}/api/medicine/take/${medicine_id}?scheduled_at=${encodeURIComponent(scheduled_at)}&user_id=${elderId}`, {
        method: 'POST'
      })
      fetchMedicines()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm("Are you sure you want to remove this medicine?")) return
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_BASE}/api/medicine/delete/${medicineId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchMedicines()
        // Notify any other listeners
        window.dispatchEvent(new CustomEvent('medicine-taken-updated'))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedPhoto(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleAddMedicine = async (e) => {
    e.preventDefault()
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const formData = new FormData()
      formData.append('user_id', elderId)
      formData.append('name', newMed.name)
      formData.append('dose', newMed.dose)
      formData.append('schedule', newMed.schedule)
      formData.append('color_hex', newMed.color_hex)
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto)
      }

      await fetch(`${API_BASE}/api/medicine/add`, {
        method: 'POST',
        body: formData
      })
      setShowAddModal(false)
      setNewMed({ name: '', dose: '', schedule: '09:00', color_hex: '#4F46E5' })
      setSelectedPhoto(null)
      setPreviewUrl(null)
      fetchMedicines()
      window.dispatchEvent(new CustomEvent('medicine-taken-updated'))
    } catch (err) {
      console.error(err)
    }
  }

  const formatTime = (isoString) => {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getMedicinePhoto = (med) => {
    if (med.photo_path) {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      return `${API_BASE}/${med.photo_path}`
    }
    const cleanName = med.name.toLowerCase().trim()
    if (cleanName.includes('amlodipine')) return '/amlodipine.png'
    if (cleanName.includes('metformin')) return '/metformin.png'
    if (cleanName.includes('heart booster')) return '/heart_booster.png'
    return '/default_pill.png'
  }

  return (
    <div className="flex flex-col gap-8 items-center mt-2 max-w-4xl mx-auto w-full pb-36 animate-fade-in text-[#5c4a3d]">
      
      {/* Navigation and Add Header Actions */}
      <div className="w-full flex justify-between items-center gap-4">
        <button 
          onClick={() => setCurrentTab('home')} 
          className="bg-white hover:bg-orange-50/50 border-4 border-[#e8dcc4] text-[#8b5a2b] font-bold text-xl md:text-2xl py-3 px-6 rounded-full shadow-md flex items-center gap-3 transition-all active:scale-95"
        >
          <span className="text-2xl md:text-3xl">⬅️</span> Back
        </button>

        {isSingleMode && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#769b76] hover:bg-[#5f805f] text-white font-bold text-xl md:text-2xl py-3 px-6 rounded-full shadow-md flex items-center gap-2 transition-all active:scale-95 border-4 border-[#c4e0c6]"
          >
            <Plus size={24} strokeWidth={3} /> Add Medicine
          </button>
        )}
      </div>

      {/* Header Card */}
      <div className="w-full bg-[#fdfbf7] border-4 border-[#e8dcc4] rounded-[2.5rem] p-8 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/30 rounded-full blur-2xl"></div>
        <h2 className="text-4xl md:text-5xl font-display font-black text-[#5c4a3d] mb-2">Today's Medicine</h2>
        <p className="text-lg md:text-xl font-bold text-[#7a6352]">Today's Medicine Schedule</p>
      </div>
      
      {loading ? (
        <p className="text-xl md:text-2xl font-bold text-[#7a6352] animate-pulse">Loading...</p>
      ) : medicines.length === 0 ? (
        <div className="bg-[#fdfbf7] border-4 border-[#e8dcc4] rounded-[2.5rem] p-12 text-center shadow w-full">
          <p className="text-2xl font-bold text-[#7a6352]">No medicine scheduled</p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-6">
          {medicines.map((med, idx) => (
            <div 
              key={`${med.medicine_id}-${idx}`} 
              className={`bg-[#fdfbf7] border-4 rounded-[2.5rem] p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between transition-all duration-500 gap-6 shadow-md hover:shadow-lg w-full ${
                med.taken ? 'bg-gray-50/70 border-gray-200 opacity-80' : 'border-[#e8dcc4]'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full text-center sm:text-left flex-grow">
                {/* Pill image container */}
                <div 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] p-2 flex items-center justify-center shadow-inner relative flex-shrink-0"
                  style={{ 
                    backgroundColor: med.taken ? '#e5e7eb' : `${med.color_hex}20`, 
                    border: `4px solid ${med.taken ? '#d1d5db' : med.color_hex || '#e8dcc4'}` 
                  }}
                >
                  <img 
                    src={getMedicinePhoto(med)} 
                    alt={med.name} 
                    className={`w-full h-full object-cover rounded-2xl ${med.taken ? 'opacity-40 grayscale' : ''}`}
                  />
                </div>
                
                {/* Medicine details */}
                <div className="flex flex-col gap-2 flex-grow">
                  <p className="font-display font-black text-3xl md:text-4xl text-[#5c4a3d] leading-none mb-1">{med.name}</p>
                  <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                    <span className="bg-orange-50 border-2 border-[#eecbb9] px-3.5 py-1 rounded-xl text-lg md:text-xl font-bold text-[#b55330]">
                      {med.dose}
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-[#7a6352]">
                      ⏰ {formatTime(med.scheduled_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons (Take / Delete) */}
              <div className="flex items-center gap-4 justify-center w-full sm:w-auto">
                {isSingleMode && !med.taken && (
                  <button
                    onClick={() => handleDeleteMedicine(med.medicine_id)}
                    className="p-3 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-2xl transition-all border-2 border-red-200 active:scale-95"
                    title="Remove Medicine"
                  >
                    <Trash2 size={24} />
                  </button>
                )}

                <button 
                  onClick={() => !med.taken && handleTake(med.medicine_id, med.scheduled_at)}
                  disabled={med.taken}
                  className={`w-full sm:w-auto font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border-4 text-xl md:text-2xl shadow-md flex-shrink-0 ${
                    med.taken 
                      ? 'bg-green-50 border-green-200 text-green-600 shadow-none' 
                      : 'bg-[#769b76]/10 border-[#c4e0c6] text-[#3c5a3d] hover:bg-[#769b76] hover:text-white'
                  }`}
                >
                  {med.taken ? (
                    <>
                      <CheckCircle className="w-8 h-8 md:w-9 md:h-9" fill="#96E6B3" color="white" />
                      <span>Taken</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-8 h-8 md:w-9 md:h-9 text-gray-400" />
                      <span>Take</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Medicine Modal (Single Mode Only) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-[#5c4a3d]">
          <div className="bg-white border-4 border-[#e8dcc4] rounded-[3rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-[#5c4a3d]">Add New Medicine</h3>
              <button onClick={() => {
                setShowAddModal(false)
                setSelectedPhoto(null)
                setPreviewUrl(null)
              }} className="text-gray-400 hover:text-gray-600"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleAddMedicine} className="flex flex-col gap-4">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-1">Medicine Name</label>
                <input required type="text" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4F46E5] outline-none text-lg font-semibold" placeholder="Enter medicine name" />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-grow">
                  <label className="block text-lg font-bold text-gray-700 mb-1">Dose</label>
                  <input required type="text" value={newMed.dose} onChange={e => setNewMed({...newMed, dose: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4F46E5] outline-none text-lg font-semibold" placeholder="e.g. 1 tablet" />
                </div>
                <div className="w-40">
                  <label className="block text-lg font-bold text-gray-700 mb-1">Time</label>
                  <input required type="time" value={newMed.schedule} onChange={e => setNewMed({...newMed, schedule: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4F46E5] outline-none text-lg font-semibold" />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">Photo - Optional</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-[#e8dcc4] hover:border-[#4F46E5] bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-orange-50/10 transition-all text-center">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden" 
                    />
                    <Camera size={28} className="text-gray-400 mb-1" />
                    <span className="text-sm font-bold text-gray-600">Choose File</span>
                  </label>

                  {previewUrl && (
                    <div className="w-20 h-20 rounded-2xl border-4 border-[#e8dcc4] overflow-hidden relative shadow-sm flex-shrink-0">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedPhoto(null)
                          setPreviewUrl(null)
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border-4 border-gray-200 text-gray-500 font-bold py-3.5 rounded-2xl text-lg hover:bg-gray-50 active:scale-95 transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-[#769b76] text-white font-bold py-3.5 rounded-2xl hover:bg-[#5f805f] transition-all active:scale-95 border-4 border-[#c4e0c6] text-lg shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
