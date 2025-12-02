import React, { useState, useEffect } from 'react';
import { UserSettings, DailyPlan, ShoppingList as ShoppingListType } from './types';
import DailyPlanView from './components/DailyPlanView';
import Settings from './components/Settings';
import ShoppingList from './components/ShoppingList';
import { generateDailyPlan } from './services/geminiService';
import { ShoppingCart, Settings as SettingsIcon, UtensilsCrossed, ChefHat } from 'lucide-react';

// Default initial state
const DEFAULT_SETTINGS: UserSettings = {
  startDate: new Date().toISOString().split('T')[0],
  dislikes: [],
  allergies: [],
  lactationSupport: true, // Default to true as it is a common need
  isSeniorMode: false
};

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shopping' | 'settings'>('dashboard');

  // Data State
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
        const saved = localStorage.getItem('pp_settings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(() => {
    try {
        const saved = localStorage.getItem('pp_dailyPlan');
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [shoppingList, setShoppingList] = useState<ShoppingListType | null>(() => {
    try {
        const saved = localStorage.getItem('pp_shoppingList');
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [loadingPlan, setLoadingPlan] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('pp_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (dailyPlan) localStorage.setItem('pp_dailyPlan', JSON.stringify(dailyPlan));
  }, [dailyPlan]);

  useEffect(() => {
    if (shoppingList) {
        localStorage.setItem('pp_shoppingList', JSON.stringify(shoppingList));
    } else {
        localStorage.removeItem('pp_shoppingList');
    }
  }, [shoppingList]);

  // Logic to calculate current day based on real time
  const getCurrentDay = () => {
    const start = new Date(settings.startDate);
    const now = new Date();
    // Normalize to start of day for accurate day diff
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    
    // Clamp between 1 and 30 for the program logic
    return Math.min(Math.max(diffDays, 1), 30);
  };

  const currentRealDay = getCurrentDay();
  
  // New State: Viewing Day (defaults to current real day)
  const [viewingDay, setViewingDay] = useState(currentRealDay);

  // Sync viewingDay if start date settings change substantially affecting the timeline
  // But allow user to stay on a browsed day if they are just browsing
  useEffect(() => {
     // If the app just loaded (dailyPlan might be stale), or settings changed significantly
     // We default to showing the real current day if the cached plan is way off or null
     if (!dailyPlan) {
         setViewingDay(currentRealDay);
     }
  }, [settings.startDate]);

  // Main Effect: Fetch plan when viewingDay changes
  useEffect(() => {
    // If we already have the plan for this day loaded, don't auto-fetch
    // UNLESS settings have changed, in which case we might want to refresh.
    // However, refreshing strictly on settings change can be annoying if typing.
    // For now, simple caching.
    if (dailyPlan && dailyPlan.day === viewingDay) return;
    
    // Otherwise fetch
    handleGeneratePlan(viewingDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingDay]);

  const handleGeneratePlan = async (day: number = viewingDay) => {
    setLoadingPlan(true);
    try {
      const plan = await generateDailyPlan(day, settings);
      setDailyPlan(plan);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPlan(false);
    }
  };

  const generateMealsForPeriod = async (days: number): Promise<string[]> => {
    const mealNames: string[] = [];
    
    // Logic: Shopping list usually starts from TODAY (real life), not the viewed day in history
    // But we can include the currently viewed day if it is in the future.
    // For simplicity, let's generate from currentRealDay onwards.
    
    const promises = [];
    for (let i = 0; i < days; i++) {
        const dayToFetch = Math.min(currentRealDay + i, 30);
        
        // Optimize: if the currently viewed plan is one of the days we need, use it
        if (dailyPlan && dailyPlan.day === dayToFetch) {
            promises.push(Promise.resolve(dailyPlan));
        } else {
            promises.push(generateDailyPlan(dayToFetch, settings));
        }
    }
    
    try {
        const plans = await Promise.all(promises);
        plans.forEach(p => mealNames.push(...p.meals.map(m => m.name)));
    } catch (e) {
        console.warn("Could not fetch all future days");
    }

    return mealNames;
  };

  return (
    // Senior Mode Implementation: Scale base font size on the root container
    <div className={`min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex justify-center ${settings.isSeniorMode ? 'text-lg' : 'text-sm'}`} 
         style={{ fontSize: settings.isSeniorMode ? '1.15rem' : '1rem' }}>
      
      <div className="w-full max-w-lg bg-[#F8FAFC] min-h-screen shadow-2xl relative">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-[#F8FAFC]/90 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-100/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-primary-200">
                <ChefHat className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">月子<span className="text-primary-500">食谱</span></h1>
          </div>
          <div className="flex items-center gap-2">
             {viewingDay !== currentRealDay && (
                 <button 
                    onClick={() => setViewingDay(currentRealDay)}
                    className="text-xs font-bold text-primary-500 px-3 py-1.5 bg-primary-50 rounded-full active:scale-95 transition-transform"
                 >
                    回今天
                 </button>
             )}
             <div className="text-xs font-bold bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full shadow-sm">
                第 {viewingDay} 天
             </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <DailyPlanView 
              plan={dailyPlan} 
              loading={loadingPlan} 
              onRefresh={() => handleGeneratePlan(viewingDay)}
              viewingDay={viewingDay}
              onChangeDay={setViewingDay}
              realDay={currentRealDay}
            />
          )}
          
          {activeTab === 'shopping' && (
            <ShoppingList 
              currentShoppingList={shoppingList}
              onUpdateList={setShoppingList}
              generateMealsForPeriod={generateMealsForPeriod}
            />
          )}

          {activeTab === 'settings' && (
            <Settings 
              settings={settings}
              onSave={(newSettings) => {
                  setSettings(newSettings);
                  // Force a reload if settings change fundamentally (like start date or dislikes)
                  // If just senior mode, no need to reload plan
                  if (newSettings.startDate !== settings.startDate || JSON.stringify(newSettings.dislikes) !== JSON.stringify(settings.dislikes)) {
                      setDailyPlan(null); 
                  }
              }}
            />
          )}
        </main>

        {/* Floating Bottom Navigation */}
        <nav className="fixed bottom-6 left-6 right-6 max-w-[calc(32rem-3rem)] mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-2 z-50 flex justify-between items-center">
            
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-300 ${
                    activeTab === 'dashboard' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
                <UtensilsCrossed className={`w-6 h-6 ${activeTab === 'dashboard' ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-bold">今日食谱</span>
            </button>
            
            <button 
                onClick={() => setActiveTab('shopping')}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-300 ${
                    activeTab === 'shopping' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
                <ShoppingCart className={`w-6 h-6 ${activeTab === 'shopping' ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-bold">采购清单</span>
            </button>
            
            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-300 ${
                    activeTab === 'settings' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
                <SettingsIcon className={`w-6 h-6 ${activeTab === 'settings' ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-bold">设置</span>
            </button>
        </nav>

      </div>
    </div>
  );
};

export default App;