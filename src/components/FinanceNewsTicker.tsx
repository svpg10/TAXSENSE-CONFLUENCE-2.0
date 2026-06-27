import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Clock, ArrowUpRight, Loader2, Sparkles } from 'lucide-react';

interface NewsItem {
  id: string;
  category: string;
  text: string;
  topic?: string;
}

const defaultNewsItems: NewsItem[] = [
  { id: '1', text: 'Budget Update: Standard Deduction under New Tax Regime is ₹75,000 for FY 2025-26.', category: 'BUDGET', topic: 'Budget standard deduction' },
  { id: '2', text: 'Income Tax Department launches automated routing for ITR-1 vs ITR-2 filings.', category: 'SYSTEM', topic: 'Income tax department ITR automation' },
  { id: '3', text: 'Section 80CCD(1B) provides stand-alone ₹50,000 deduction on NPS over Section 80C.', category: 'TAX SAVING', topic: 'Section 80CCD 1B NPS deduction' },
  { id: '4', text: 'Sensex hits historical high; Long Term Capital Gains (LTCG) tax revised to 12.5% with ₹1.25L exemption.', category: 'MARKETS', topic: 'LTCG tax 12.5 budget 2024' },
  { id: '5', text: 'Senior Citizens can claim up to ₹50,000 interest deduction under Section 80TTB.', category: 'SENIORS', topic: 'Senior citizen section 80TTB' },
  { id: '6', text: 'Rent receipt submissions active; HRA exemption calculations automated under Section 10(13A).', category: 'HRA', topic: 'HRA exemption section 10 13A' },
];

export const FinanceNewsTicker: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);
  const [hoverText, setHoverText] = useState<string>('');

  // Convert current system date to IST (UTC +5:30)
  const getISTDate = useCallback((date = new Date()) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
  }, []);

  // Determine if a given IST date is an Indian National or Stock Market Holiday
  const isNSEHoliday = useCallback((istDate: Date) => {
    const month = istDate.getMonth(); // 0-indexed: 0=Jan, 11=Dec
    const date = istDate.getDate();

    // Standard major Indian stock market holidays
    if (month === 0 && date === 26) return true; // Republic Day
    if (month === 2 && date === 17) return true; // Holi (or standard NSE holiday)
    if (month === 3 && date === 14) return true; // Ambedkar Jayanti
    if (month === 4 && date === 1) return true;  // Maharashtra Day
    if (month === 7 && date === 15) return true; // Independence Day
    if (month === 9 && date === 2) return true;  // Gandhi Jayanti
    if (month === 11 && date === 25) return true; // Christmas
    return false;
  }, []);

  // Determine if stock market is open (Mon-Fri, 9:15 AM to 3:30 PM IST, and not a holiday)
  const isStockMarketOpenWindow = useCallback((istDate: Date) => {
    const day = istDate.getDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend || isNSEHoliday(istDate)) return false;

    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // 9:15 AM is 555 minutes; 3:30 PM is 930 minutes
    return timeInMinutes >= 555 && timeInMinutes <= 930;
  }, [isNSEHoliday]);

  // Fetch fresh financial/tax news from our backend using Gemini
  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/finance-news');
      const data = await response.json();
      if (data.success && data.news && data.news.length > 0) {
        setNews(data.news);
        const nowMs = Date.now();
        setLastUpdated(nowMs);
        localStorage.setItem('taxsense_news_items', JSON.stringify(data.news));
        localStorage.setItem('taxsense_news_last_updated', nowMs.toString());
      } else {
        // Fallback to default items if payload empty
        setNews(defaultNewsItems);
      }
    } catch (error) {
      console.error('Failed to retrieve live financial news:', error);
      setNews(defaultNewsItems);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if current news is stale according to rules:
  // - Every 1 hour during stock market open window
  // - Every 24 hours on weekends / holidays / off-market
  const checkAndRefreshIfNeeded = useCallback(() => {
    const now = new Date();
    const nowIST = getISTDate(now);
    const currentlyOpen = isStockMarketOpenWindow(nowIST);
    setIsMarketOpen(currentlyOpen);

    const storedNews = localStorage.getItem('taxsense_news_items');
    const storedTimeStr = localStorage.getItem('taxsense_news_last_updated');

    if (!storedNews || !storedTimeStr) {
      // First load: trigger immediately
      fetchNews();
      return;
    }

    const lastUpdatedMs = parseInt(storedTimeStr, 10);
    setNews(JSON.parse(storedNews));
    setLastUpdated(lastUpdatedMs);

    const elapsedMs = now.getTime() - lastUpdatedMs;

    if (currentlyOpen) {
      // 1 hour threshold (3,600,000 ms)
      if (elapsedMs >= 3600000) {
        console.log('Stock market open window active: News is > 1 hr stale. Refreshing...');
        fetchNews();
      }
    } else {
      // 24 hour threshold (86,400,000 ms)
      if (elapsedMs >= 86400000) {
        console.log('Off-market / Weekend active: News is > 24 hr stale. Refreshing...');
        fetchNews();
      }
    }
  }, [getISTDate, isStockMarketOpenWindow, fetchNews]);

  // Initial load and setup automatic refresh check intervals
  useEffect(() => {
    checkAndRefreshIfNeeded();

    // Check conditions every 60 seconds to ensure a seamless real-time background update
    const interval = setInterval(() => {
      checkAndRefreshIfNeeded();
    }, 60000);

    return () => clearInterval(interval);
  }, [checkAndRefreshIfNeeded]);

  // Construct readable tooltips
  useEffect(() => {
    const now = new Date();
    const nowIST = getISTDate(now);
    const day = nowIST.getDay();
    const isWeekend = day === 0 || day === 6;
    const isHoliday = isNSEHoliday(nowIST);

    let statusText = '';
    if (isWeekend) {
      statusText = 'Weekend mode: News updates every 24 hours.';
    } else if (isHoliday) {
      statusText = 'Stock Market Holiday: News updates every 24 hours.';
    } else if (isMarketOpen) {
      statusText = 'Market Open Window (9:15 AM - 3:30 PM IST): Live news updates hourly!';
    } else {
      statusText = 'Off-Market hours: News updates every 24 hours.';
    }

    if (lastUpdated > 0) {
      const timeString = new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHoverText(`${statusText} (Last updated: ${timeString})`);
    } else {
      setHoverText(statusText);
    }
  }, [isMarketOpen, lastUpdated, isNSEHoliday, getISTDate]);

  // Helper to build Economic Times redirect URL
  const getEconomicTimesUrl = (item: NewsItem) => {
    const query = item.topic || item.text;
    return `https://economictimes.indiatimes.com/search.cms?query=${encodeURIComponent(query)}&results=true`;
  };

  return (
    <div 
      id="finance-news-ticker-container"
      className="w-full bg-neutral-950 border-b border-neutral-800 text-neutral-300 text-xs py-2 overflow-hidden select-none relative font-mono"
      title={hoverText}
    >
      {/* CSS Keyframe Animation Injected Safely */}
      <style>{`
        @keyframes ticker-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-ticker {
          display: inline-flex;
          white-space: nowrap;
          padding-left: 100%;
          animation: ticker-scroll 45s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Decorative Ticker Badge */}
      <div 
        className="absolute left-0 top-0 bottom-0 bg-neutral-900 border-r border-neutral-800 px-3 flex items-center gap-1.5 z-10 font-bold text-neutral-100 text-[10px] tracking-widest uppercase cursor-help group"
      >
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="flex items-center gap-1">
          Live Feed
          <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-ping' : 'bg-blue-400'}`} />
        </span>

        {/* Floating Tooltip */}
        <div className="absolute left-0 top-full mt-1 bg-neutral-900 text-neutral-200 text-[10px] p-2 rounded border border-neutral-800 w-64 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 normal-case tracking-normal leading-relaxed">
          <p className="font-bold mb-1 flex items-center gap-1 text-emerald-400">
            <Sparkles className="w-3 h-3" /> Update Schedule
          </p>
          <p>{hoverText}</p>
          <p className="mt-1 text-neutral-400 border-t border-neutral-800 pt-1 text-[9px]">
            💡 Click any headline to read full coverage on Economic Times.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center pl-28">
        {isLoading && news.length === 0 ? (
          <div className="flex items-center gap-2 text-neutral-400 pl-4 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Fetching live finance updates...</span>
          </div>
        ) : (
          /* Repeating the array twice for an endless scrolling effect */
          <div className="animate-ticker flex items-center gap-12">
            {[...news, ...news].map((item, idx) => (
              <a 
                key={`${item.id}-${idx}`} 
                href={getEconomicTimesUrl(item)}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-white cursor-pointer group transition-colors duration-150"
              >
                <span className="inline-block bg-neutral-800 border border-neutral-700 text-neutral-300 text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider group-hover:bg-neutral-700 group-hover:text-emerald-300">
                  {item.category}
                </span>
                <span className="text-neutral-200 group-hover:underline group-hover:text-white flex items-center gap-1">
                  {item.text}
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-emerald-400" />
                </span>
                <span className="text-neutral-600 group-hover:text-neutral-400">•</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
