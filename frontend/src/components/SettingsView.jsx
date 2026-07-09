import { useState } from 'react'

export default function SettingsView() {
  const [notifications, setNotifications] = useState({ sms: true, email: false, push: true })
  
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="bento-card">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h3>
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
            <div>
              <p className="font-bold text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500 font-medium">Receive alerts directly on your device</p>
            </div>
            <input type="checkbox" checked={notifications.push} onChange={() => setNotifications({...notifications, push: !notifications.push})} className="w-5 h-5 accent-family-primary" />
          </label>
          <label className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
            <div>
              <p className="font-bold text-gray-900">SMS Alerts</p>
              <p className="text-sm text-gray-500 font-medium">For critical missed medicines</p>
            </div>
            <input type="checkbox" checked={notifications.sms} onChange={() => setNotifications({...notifications, sms: !notifications.sms})} className="w-5 h-5 accent-family-primary" />
          </label>
          <label className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
            <div>
              <p className="font-bold text-gray-900">Email Digest</p>
              <p className="text-sm text-gray-500 font-medium">Weekly summary of Kamala's mood and activity</p>
            </div>
            <input type="checkbox" checked={notifications.email} onChange={() => setNotifications({...notifications, email: !notifications.email})} className="w-5 h-5 accent-family-primary" />
          </label>
        </div>
      </div>

      <div className="bento-card">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Subscription & Billing</h3>
        <div className="flex flex-col gap-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-900">HeartBridge Premium Plan</p>
              <p className="text-xs text-indigo-600 font-bold mt-0.5">Active Subscription</p>
            </div>
            <p className="text-xl font-black text-gray-900">$19<span className="text-sm font-semibold text-gray-500">/month per parent</span></p>
          </div>
          <div className="border-t border-indigo-100/40 my-1"></div>
          <div className="flex flex-col gap-1 text-xs text-gray-500 font-semibold">
            <p>• Subscriber: Thomas Higgins (son, Toronto, Canada)</p>
            <p>• Payment Method: Visa ending in 4242</p>
            <p>• Next Billing Date: August 9, 2026</p>
            <p className="text-indigo-600/80 mt-1 font-bold">Note: Local currency billing is available for international cards.</p>
          </div>
        </div>
      </div>

      <div className="bento-card">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Elder Profile (Kamala Shah)</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Display Language</label>
            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-family-primary/20 focus:border-family-primary outline-none bg-white font-medium">
              <option value="gu">Gujarati & English (Bilingual)</option>
              <option value="en">English Only</option>
              <option value="hi">Hindi</option>
            </select>
            <p className="text-xs text-gray-500 mt-2 font-medium">This changes the interface language on Kamala's tablet.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
