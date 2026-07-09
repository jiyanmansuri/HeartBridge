import { useState, useEffect } from 'react'
import { UserPlus, X, Heart, Users, ChevronRight, HelpCircle, Edit2 } from 'lucide-react'

export default function FamilyGroup() {
  const [showInvite, setShowInvite] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [newMember, setNewMember] = useState({ name: '', relation: 'Daughter', gender: 'female' })
  
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('familyMembers')
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Ramabai', relation: 'Elder', isElder: true, gender: 'female', avatar: '👵' },
      { id: 2, name: 'Thomas Patel', relation: 'Son', isAdmin: true, parentId: 1, gender: 'male', avatar: '👨' }
    ]
  })

  useEffect(() => {
    localStorage.setItem('familyMembers', JSON.stringify(members))
  }, [members])

  const handleAddMember = (e) => {
    e.preventDefault()
    if (!newMember.name.trim()) return

    // Pick avatar based on relation and gender
    let avatar = '👤'
    const relationLower = newMember.relation.toLowerCase()
    if (newMember.gender === 'female') {
      if (relationLower.includes('granddaughter')) avatar = '👧'
      else if (relationLower.includes('daughter') || relationLower.includes('sister') || relationLower.includes('wife')) avatar = '👩'
      else avatar = '👩'
    } else {
      if (relationLower.includes('grandson')) avatar = '👦'
      else if (relationLower.includes('son') || relationLower.includes('brother') || relationLower.includes('husband')) avatar = '👨'
      else avatar = '👨'
    }

    const added = {
      id: Date.now(),
      name: newMember.name.trim(),
      relation: newMember.relation,
      gender: newMember.gender,
      avatar: avatar,
      parentId: 1
    }

    setMembers(prev => [...prev, added])
    setNewMember({ name: '', relation: 'Daughter', gender: 'female' })
    setShowInvite(false)
  }

  const handleEditMemberSubmit = (e) => {
    e.preventDefault()
    if (!editingMember.name.trim()) return

    let avatar = editingMember.avatar
    const relationLower = editingMember.relation.toLowerCase()
    if (editingMember.gender === 'female') {
      if (relationLower.includes('granddaughter')) avatar = '👧'
      else if (relationLower.includes('daughter') || relationLower.includes('sister') || relationLower.includes('wife')) avatar = '👩'
      else avatar = '👩'
    } else {
      if (relationLower.includes('grandson')) avatar = '👦'
      else if (relationLower.includes('son') || relationLower.includes('brother') || relationLower.includes('husband')) avatar = '👨'
      else avatar = '👨'
    }

    setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...editingMember, avatar } : m))
    setEditingMember(null)
  }

  const handleDeleteMember = (id) => {
    if (id === 1 || id === 2) {
      alert("Primary Elder and Group Administrator profiles cannot be removed.")
      return
    }
    if (window.confirm("Are you sure you want to remove this family member?")) {
      setMembers(prev => prev.filter(m => m.id !== id))
    }
  }

  // Group members for the tree tiers
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

  return (
    <div className="flex flex-col gap-8 w-full pb-10">
      
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 flex items-center gap-2">
            <Users className="text-family-primary" size={24} /> Care Circle Members
          </h1>
          <p className="text-family-muted text-sm font-medium mt-1">Manage family members connected to Ramabai's care circle.</p>
        </div>
        <button 
          onClick={() => setShowInvite(true)}
          className="bg-family-primary text-white px-5 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-glow active:scale-95 text-sm"
        >
          <UserPlus size={18} /> Invite Caregiver
        </button>
      </div>

      {/* Grid of members cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((member) => (
          <div key={member.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft flex items-center justify-between group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl shadow-inner border border-gray-100/50">
                {member.avatar}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {member.name} 
                  {member.isElder && <span className="bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-100">Primary</span>}
                  {member.isAdmin && <span className="bg-red-50 text-red-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-100">Admin</span>}
                </h3>
                <p className="text-family-muted font-medium text-xs mt-0.5">{member.relation} {member.isElder ? '(Patel Family)' : ''}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {!member.isElder && (
                <button 
                  onClick={() => setEditingMember(member)}
                  className="text-gray-300 hover:text-family-primary hover:bg-indigo-50 p-2 rounded-xl transition-all active:scale-95"
                  title="Edit relation"
                >
                  <Edit2 size={18} />
                </button>
              )}
              {!member.isElder && !member.isAdmin && (
                <button 
                  onClick={() => handleDeleteMember(member.id)}
                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all active:scale-95"
                  title="Remove caregiver"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- FAMILY TREE DIAGRAM --- */}
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-soft mt-4">
        <div className="text-center mb-10">
          <span className="text-xs bg-indigo-50 text-family-primary font-black px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">Visual Hierarchy</span>
          <h2 className="text-xl font-bold font-display text-gray-900 mt-2">Family Tree & Relations</h2>
          <p className="text-family-muted text-xs font-semibold mt-1">Generational mapping of caregiver nodes connected to the Elder.</p>
        </div>

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
                      <span className="font-bold text-gray-800 text-xs truncate max-w-[120px]">{c.name}</span>
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
                      <span className="font-bold text-gray-800 text-xs truncate max-w-[120px]">{g.name}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">{g.relation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD CAREGIVER / INVITE MODAL --- */}
      {showInvite && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">Add Family Caregiver</h3>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Caregiver Name</label>
                <input 
                  required 
                  type="text" 
                  value={newMember.name} 
                  onChange={e => setNewMember({...newMember, name: e.target.value})} 
                  placeholder="e.g. Clairel Patel" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-family-primary outline-none text-sm font-semibold" 
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Relation with Elder</label>
                  <select 
                    value={newMember.relation}
                    onChange={e => setNewMember({...newMember, relation: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-family-primary outline-none text-sm font-semibold cursor-pointer bg-white"
                  >
                    <option value="Daughter">Daughter</option>
                    <option value="Son">Son</option>
                    <option value="Grandson">Grandson</option>
                    <option value="Granddaughter">Granddaughter</option>
                    <option value="Daughter-in-law">Daughter-in-law</option>
                    <option value="Son-in-law">Son-in-law</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                  </select>
                </div>

                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gender</label>
                  <select 
                    value={newMember.gender}
                    onChange={e => setNewMember({...newMember, gender: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-family-primary outline-none text-sm font-semibold cursor-pointer bg-white"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowInvite(false)} 
                  className="flex-1 border-2 border-gray-200 text-gray-500 font-bold py-3 rounded-2xl text-sm hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-family-primary text-white font-bold py-3 rounded-2xl shadow-glow hover:bg-indigo-700 active:scale-95 text-sm transition-all"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MEMBER RELATION MODAL --- */}
      {editingMember && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">Edit Member Relation</h3>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditMemberSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Caregiver Name</label>
                <input 
                  required 
                  type="text" 
                  value={editingMember.name} 
                  onChange={e => setEditingMember({...editingMember, name: e.target.value})} 
                  placeholder="e.g. Clairel Patel" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-family-primary outline-none text-sm font-semibold" 
                  disabled={editingMember.isAdmin}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Relation with Elder</label>
                  <select 
                    value={editingMember.relation}
                    onChange={e => setEditingMember({...editingMember, relation: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-family-primary outline-none text-sm font-semibold cursor-pointer bg-white"
                  >
                    <option value="Daughter">Daughter</option>
                    <option value="Son">Son</option>
                    <option value="Grandson">Grandson</option>
                    <option value="Granddaughter">Granddaughter</option>
                    <option value="Daughter-in-law">Daughter-in-law</option>
                    <option value="Son-in-law">Son-in-law</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                  </select>
                </div>

                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gender</label>
                  <select 
                    value={editingMember.gender}
                    onChange={e => setEditingMember({...editingMember, gender: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-family-primary outline-none text-sm font-semibold cursor-pointer bg-white"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingMember(null)} 
                  className="flex-1 border-2 border-gray-200 text-gray-500 font-bold py-3 rounded-2xl text-sm hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-family-primary text-white font-bold py-3 rounded-2xl shadow-glow hover:bg-indigo-700 active:scale-95 text-sm transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
