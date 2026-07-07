import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export function ScannerChatBubble({ contextData }: { contextData: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you analyze the market scanner data. Ask me anything about the current or archived conditions.',
      id: 'welcome'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;
    
    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      id: Date.now().toString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const storedModel = localStorage.getItem('ai_model') || 'gemini-3.5-flash';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          context: contextData,
          model: storedModel
        })
      });

      if (!res.ok) throw new Error('API failed');
      
      const data = await res.json();
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || "No response received",
          id: (Date.now() + 1).toString()
        }
      ]);
    } catch (error) {
      toast.error('Failed to get response from AI');
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="absolute bottom-6 right-6 p-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] z-40 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: isOpen ? 0 : 1 }}
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <MessageSquare className="size-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-6 right-6 w-80 md:w-96 bg-gray-900/40 backdrop-blur-md border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
            style={{ height: '500px', maxHeight: 'calc(100% - 48px)' }}
          >
            {/* Header */}
            <div className="bg-purple-900/40 p-4 border-b border-purple-900/60 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                   <Bot className="size-5" />
                 </div>
                 <div>
                   <h3 className="font-bold text-white text-sm">Market AI</h3>
                   <p className="text-[10px] text-purple-300">Scanner Analysis Assistant</p>
                 </div>
               </div>
               <button 
                 onClick={() => setIsOpen(false)}
                 className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
               >
                 <X className="size-5" />
               </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-tr-sm' 
                      : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl p-3 text-sm bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-sm flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-purple-400" />
                    <span className="text-gray-400 text-xs">Analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-gray-800 bg-gray-950 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="Ask about the current alerts..."
                  className="w-full bg-gray-900/40 backdrop-blur-md border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping || !inputValue.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 hover:text-purple-300 disabled:opacity-50 rounded-lg transition-colors"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
