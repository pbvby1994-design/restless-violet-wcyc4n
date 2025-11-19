import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, BookOpen, Clock, Sparkles } from 'lucide-react';

const CATEGORIES = ["Все", "Productivity", "Business", "Sci-Fi", "History"];

const BOOKS = [
  { id: 1, title: "Atomic Habits", author: "James Clear", category: "Productivity", color: "from-purple-600 to-blue-600", duration: "5h 30m", text: "Небольшие изменения, значительные результаты..." },
  { id: 2, title: "The Psychology of Money", author: "Morgan Housel", category: "Business", color: "from-emerald-500 to-teal-900", duration: "4h 12m", text: "Деньги - это не только математика..." },
  { id: 3, title: "Dune", author: "Frank Herbert", category: "Sci-Fi", color: "from-orange-500 to-red-900", duration: "21h 05m", text: "Планета Арракис, также известная как Дюна..." },
  { id: 4, title: "Sapiens", author: "Yuval Noah Harari", category: "History", color: "from-yellow-500 to-orange-700", duration: "15h 18m", text: "Сто тысяч лет назад..." },
];

export default function Library({ onPlay }) {
  const [activeCat, setActiveCat] = useState("Все");

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32 px-5 pt-4">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          Library <span className="text-accent text-4xl">.</span>
        </h1>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent-light flex items-center justify-center shadow-neon">
          <span className="text-xs font-bold">PRO</span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar mb-8 pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCat === cat 
                ? 'bg-white text-black shadow-lg' 
                : 'bg-white/5 text-txt-secondary border border-white/5 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Card (AI Pick) */}
      <div className="mb-8 relative group">
         <div className="absolute inset-0 bg-accent blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
         <div className="relative bg-gradient-to-r from-[#2a2a2e] to-[#1a1a1c] rounded-[28px] p-6 border border-white/10 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-serif">Aa</div>
            <div className="flex items-center gap-2 text-accent-neon text-xs font-bold uppercase tracking-widest mb-2">
               <Sparkles size={14} /> AI Recommendation
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Deep Work</h2>
            <p className="text-txt-secondary text-sm mb-4">Cal Newport</p>
            <button className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full font-bold text-sm hover:scale-105 transition">
               <Play size={16} fill="black" /> Listen Now
            </button>
         </div>
      </div>

      {/* Books Grid */}
      <h3 className="text-lg font-semibold text-white mb-4">Your Collection</h3>
      <div className="space-y-4">
        {BOOKS.map(book => (
          <motion.div 
            key={book.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPlay(book)}
            className="flex items-center gap-4 p-4 rounded-2xl bg-bg-card border border-white/5 hover:bg-white/5 transition cursor-pointer"
          >
            {/* Cover */}
            <div className={`w-16 h-20 rounded-xl bg-gradient-to-br ${book.color} shadow-lg flex-shrink-0`} />
            
            {/* Info */}
            <div className="flex-grow min-w-0">
               <h4 className="text-white font-bold text-base truncate">{book.title}</h4>
               <p className="text-txt-secondary text-sm truncate">{book.author}</p>
               <div className="flex items-center gap-3 mt-2 text-xs text-txt-muted">
                  <span className="flex items-center gap-1"><Clock size={12}/> {book.duration}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">{book.category}</span>
               </div>
            </div>

            {/* Play Btn */}
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-accent transition">
               <Play size={18} fill="currentColor" />
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
