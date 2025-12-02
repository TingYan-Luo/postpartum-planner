import React, { useState } from 'react';
import { ShoppingItem, ShoppingList as ShoppingListType } from '../types';
import { generateShoppingListAI } from '../services/dsService';
import { ShoppingBag, Check, RefreshCw, Trash2, CalendarDays } from 'lucide-react';

interface ShoppingListProps {
  currentShoppingList: ShoppingListType | null;
  onUpdateList: (list: ShoppingListType | null) => void;
  generateMealsForPeriod: (days: number) => Promise<string[]>;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ currentShoppingList, onUpdateList, generateMealsForPeriod }) => {
  const [loading, setLoading] = useState(false);
  const [generateDays, setGenerateDays] = useState<1 | 3 | 7>(3);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const mealNames = await generateMealsForPeriod(generateDays);
      const items = await generateShoppingListAI(mealNames, generateDays);
      
      const newList: ShoppingListType = {
        startDate: new Date().toISOString(),
        daysCovered: generateDays,
        items: items
      };
      onUpdateList(newList);
    } catch (error) {
      alert("生成失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    if (!currentShoppingList) return;
    const newItems = [...currentShoppingList.items];
    newItems[index].checked = !newItems[index].checked;
    onUpdateList({ ...currentShoppingList, items: newItems });
  };

  const clearList = () => {
    if(window.confirm("确定要清空当前的采购清单吗？")) {
        onUpdateList(null);
    }
  }

  // Group items by category
  const groupedItems = currentShoppingList?.items.reduce((acc, item, index) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ ...item, originalIndex: index });
    return acc;
  }, {} as Record<string, (ShoppingItem & { originalIndex: number })[]>) || {};

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-32 pt-2">
       <div className="px-4">
        <h2 className="text-2xl font-bold text-gray-800">采购清单</h2>
        <p className="text-gray-500 text-sm mt-1">提前规划，让家属照单全收</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white mx-4 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
            <CalendarDays className="w-4 h-4 text-primary-500" />
            选择计划天数
        </div>
        
        <div className="flex gap-3">
            {[1, 3, 7].map(d => (
                <button
                    key={d}
                    onClick={() => setGenerateDays(d as any)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                        generateDays === d 
                        ? 'bg-primary-50 border-primary-500 text-primary-600' 
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                >
                    {d} 天
                </button>
            ))}
        </div>
            
        <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 bg-gray-800 active:bg-black disabled:bg-gray-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
        >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            {loading ? "智能规划中..." : "生成采购清单"}
        </button>
      </div>

      {/* List Display */}
      {currentShoppingList ? (
        <div className="mx-4 bg-white rounded-3xl shadow-sm overflow-hidden min-h-[300px]">
            <div className="bg-gradient-to-r from-primary-50 to-white px-5 py-4 border-b border-primary-100 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-sm text-primary-800 font-bold">
                        未来 {currentShoppingList.daysCovered} 天所需食材
                    </span>
                    <span className="text-xs text-primary-400 mt-0.5">
                        {currentShoppingList.items.filter(i => i.checked).length} / {currentShoppingList.items.length} 已购
                    </span>
                </div>
                <button onClick={clearList} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="p-5 space-y-6">
                {Object.keys(groupedItems).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                        <p>清单是空的</p>
                    </div>
                )}

                {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                        <h3 className="text-xs font-bold text-gray-400 mb-3 ml-1">{category}</h3>
                        <div className="space-y-3">
                            {(items as (ShoppingItem & { originalIndex: number })[]).map((item) => (
                                <div 
                                    key={item.originalIndex} 
                                    onClick={() => toggleItem(item.originalIndex)}
                                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                                        item.checked 
                                        ? 'bg-gray-50 border-transparent opacity-50' 
                                        : 'bg-white border-gray-100 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                            item.checked 
                                            ? 'bg-primary-500 border-primary-500' 
                                            : 'border-gray-200 bg-white'
                                        }`}>
                                            {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`font-medium text-base ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded-lg">
                                        {item.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center opacity-60">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-500 mb-1">暂无清单</h3>
              <p className="text-sm text-gray-400">选择天数并点击生成，AI 将为您规划</p>
          </div>
      )}
    </div>
  );
};

export default ShoppingList;