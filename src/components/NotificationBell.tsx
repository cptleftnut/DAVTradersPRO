import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Alert {
  id: string;
  msg: string;
  time: string;
}

export function NotificationBell({ alerts }: { alerts: Alert[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors relative"
      >
        <Bell className="size-5 text-gray-400" />
        {alerts.length > 0 && (
          <span className="absolute top-0 right-0 size-2.5 bg-amber-500 rounded-full animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl z-50 p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-white">Notifikationer</h4>
              <X onClick={() => setIsOpen(false)} className="size-4 text-gray-500 cursor-pointer hover:text-white" />
            </div>
            {alerts.length === 0 ? (
              <p className="text-gray-500 text-sm italic">Ingen nye notifikationer.</p>
            ) : (
              <div className="space-y-3">
                {alerts.map(a => (
                  <div key={a.id} className="text-sm p-3 bg-gray-950 rounded-lg border border-gray-800 italic">
                      <p className="text-white text-xs">{a.msg}</p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{a.time}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
