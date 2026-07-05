import { useState, useEffect } from "react";
import { Loader2, ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface Article {
  uri: string;
  title: string;
}

interface NewsFeedProps {
  ticker: string;
}

export function NewsFeed({ ticker }: NewsFeedProps) {
  const [news, setNews] = useState<{ summary: string; articles: Article[]; sentiment?: 'positive' | 'negative' | 'neutral' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch news");
      }
      
      setNews(data);
    } catch (err: any) {
      if (!err.message?.includes('rate limited') && !err.message?.includes('429') && !err.message?.includes('API kvote') && !err.message?.includes('quota exceeded')) {
        console.error(err);
        if (!String(err.message).includes("Failed to fetch")) setError(err.message || "Failed to fetch news");
      } else {
        setError(null); // Hide quota errors
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchNews();
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(handler);
  }, [ticker]);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-3xl border border-gray-800 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2 text-gray-400 uppercase tracking-widest text-xs font-semibold">
          <Newspaper className="size-4" />
          Realtids Markedsnyheder
        </div>
        <button 
          onClick={fetchNews}
          disabled={loading}
          className="text-gray-500 hover:text-white transition-colors"
          title="Opdater Nyheder"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin cursor-not-allowed' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
        {loading ? (
            <div className="flex items-center justify-center p-8 h-full">
              <Loader2 className="animate-spin text-amber-500 size-8" />
            </div>
        ) : error ? (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-rose-400 p-4 rounded-lg bg-rose-950/30 border border-rose-900 border-dashed text-sm w-full text-center">{error}</p>
            </div>
        ) : news ? (
            <>
                <div className="text-sm text-gray-300 font-mono leading-relaxed bg-gray-950/50 p-4 rounded-xl border border-gray-800/50">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-amber-500/10">
                        <p className="text-xs text-amber-500/80 uppercase tracking-widest">Kort Resumé</p>
                        {news.sentiment && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${news.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : news.sentiment === 'negative' ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                {news.sentiment} Sentiment
                            </span>
                        )}
                    </div>
                    {news.summary}
                </div>
                
                {news.articles && news.articles.length > 0 && (
                    <div className="space-y-3">
                       <p className="text-xs text-gray-500 uppercase tracking-widest">Kilder</p>
                       <ul className="space-y-2">
                           {news.articles.map((article, index) => (
                               <motion.li 
                                   key={index}
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: index * 0.05, duration: 0.3 }}
                               >
                                   <a 
                                       href={article.uri} 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       className="group flex gap-3 p-3 bg-gray-950/60 rounded-xl hover:bg-gray-800/60 border border-transparent hover:border-gray-700 transition-all"
                                   >
                                       <span className="text-amber-500/50 group-hover:text-amber-500 text-xs mt-0.5">{(index + 1).toString().padStart(2, '0')}</span>
                                       <span className="flex-1 text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-2">
                                           {article.title}
                                       </span>
                                       <ExternalLink className="size-4 text-gray-600 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5" />
                                   </a>
                               </motion.li>
                           ))}
                       </ul>
                    </div>
                )}
            </>
        ) : (
             <div className="flex items-center justify-center h-full text-sm text-gray-500">
               Indtast en ticker for at se nyheder.
             </div>
        )}
      </div>
      
      {/* Scrollbar styling could be moved to global CSS, but included inline for component self-containment if needed, or we just rely on default Tailwind */}
    </div>
  );
}
