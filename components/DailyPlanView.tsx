import React, { useState } from 'react';
import { DailyPlan } from '../types';
import { Sun, Moon, Coffee, RefreshCw, ChevronRight, Utensils, Loader2, ChevronLeft } from 'lucide-react';
import RecipeModal from './RecipeModal';

interface DailyPlanViewProps {
  plan: DailyPlan | null;
  loading: boolean;
  onRefresh: () => void;
  viewingDay: number;
  onChangeDay: (day: number) => void;
  realDay: number;
}

const MealIcon = ({ type }: { type: string }) => {
  if (type.includes('早餐')) return <Sun className="w-5 h-5 text-orange-400" />;
  if (type.includes('晚餐')) return <Moon className="w-5 h-5 text-indigo-400" />;
  if (type.includes('加餐')) return <Coffee className="w-5 h-5 text-primary-400" />;
  return <Utensils className="w-5 h-5 text-emerald-500" />;
};

const DailyPlanView: React.FC<DailyPlanViewProps> = ({ 
  plan, 
  loading, 
  onRefresh, 
  viewingDay, 
  onChangeDay,
  realDay
}) => {
  const [selectedDish, setSelectedDish] = useState<string | null>(null);

  // Helper to get phase info based on day (client-side fallback/display)
  const getPhaseDisplay = (day: number) => {
    if (day <= 7) return "第一阶段：排毒消肿";
    if (day <= 14) return "第二阶段：调理修复";
    return "第三阶段：滋补养颜";
  };

  const handlePrevDay = () => {
    if (viewingDay > 1) onChangeDay(viewingDay - 1);
  };

  const handleNextDay = () => {
    if (viewingDay < 30) onChangeDay(viewingDay + 1);
  };

  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Utensils className="w-8 h-8 text-primary-500" />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">正在生成第 {viewingDay} 天食谱...</p>
                    <p className="text-sm text-gray-400 mt-1">根据阶段和体质定制中</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 p-6 text-center">
                <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-2">
                    <Utensils className="w-10 h-10 text-primary-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">第 {viewingDay} 天计划</h2>
                    <p className="text-gray-500 text-sm mt-2">点击下方按钮生成您的专属月子餐</p>
                </div>
                <button 
                    onClick={onRefresh} 
                    className="w-full max-w-xs py-4 bg-primary-500 text-white rounded-2xl font-bold shadow-lg shadow-primary-200 active:scale-95 transition-all"
                >
                立即生成食谱
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {plan.meals.map((meal) => (
            <div 
                key={meal.id}
                onClick={() => setSelectedDish(meal.name)}
                className="group bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
            >
                <div className="flex justify-between items-center gap-4">
                {/* Left: Icon & Time */}
                <div className="flex flex-col items-center min-w-[3.5rem] gap-1">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                    <MealIcon type={meal.type} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{meal.type}</span>
                </div>

                {/* Middle: Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800 mb-1 truncate group-hover:text-primary-600 transition-colors">{meal.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">{meal.description}</p>
                    <div className="flex gap-2 flex-wrap">
                        {meal.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                
                {/* Right: Arrow */}
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-primary-500 group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-white" />
                </div>
                </div>
            </div>
            ))}
        </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-32 pt-2">
      {/* Compact Header Card */}
      <div className="mx-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white p-4 rounded-2xl shadow-lg shadow-primary-200/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-3">
          
          {/* Top Row: Navigation + Day */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <button 
                    onClick={handlePrevDay}
                    disabled={viewingDay <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-md"
                 >
                     <ChevronLeft className="w-5 h-5 text-white" />
                 </button>
                 
                 <div>
                     <div className="text-[10px] text-primary-100 font-medium leading-none mb-1">
                        {viewingDay === realDay ? "今天" : (viewingDay > realDay ? "未来" : "过去")}
                     </div>
                     <div className="text-2xl font-bold leading-none">第 {viewingDay} 天</div>
                 </div>

                 <button 
                    onClick={handleNextDay}
                    disabled={viewingDay >= 30}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-md"
                 >
                     <ChevronRight className="w-5 h-5 text-white" />
                 </button>
             </div>

             {/* Right: Phase Info (Compact) */}
             <div className="text-right">
                <div className="inline-block bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium mb-1.5 border border-white/10">
                    {plan ? plan.phase.split('：')[0] : getPhaseDisplay(viewingDay).split('：')[0]}
                </div>
                {/* Mini Progress Bar */}
                <div className="w-20 bg-black/20 h-1 rounded-full ml-auto">
                    <div 
                        className="bg-white h-1 rounded-full transition-all duration-1000" 
                        style={{ width: `${(viewingDay / 30) * 100}%` }}
                    />
                </div>
             </div>
          </div>

          {/* Bottom Row: Phase Detail + Refresh */}
          <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-1">
              <h2 className="text-sm font-bold opacity-90 truncate max-w-[70%]">
                  {plan ? (plan.phase.split('：')[1] || plan.phase) : getPhaseDisplay(viewingDay).split('：')[1]}
              </h2>
              
              {!loading && plan && (
                <button 
                    onClick={onRefresh}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm text-xs font-medium"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>换一批</span>
                </button>
              )}
          </div>
        </div>
        
        {/* Subtle Decoration */}
        <div className="absolute -right-4 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Meal List Content */}
      <div className="px-4 min-h-[300px]">
          {renderContent()}
      </div>

      <RecipeModal 
        dishName={selectedDish || ""} 
        isOpen={!!selectedDish} 
        onClose={() => setSelectedDish(null)} 
      />
    </div>
  );
};

export default DailyPlanView;