import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Save, Calendar, Ban, AlertTriangle, Baby, Eye } from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [newDislike, setNewDislike] = useState("");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings(prev => ({ ...prev, startDate: e.target.value }));
  };
  
  const toggleLactation = () => {
    setLocalSettings(prev => ({ ...prev, lactationSupport: !prev.lactationSupport }));
  };

  const toggleSeniorMode = () => {
    setLocalSettings(prev => ({ ...prev, isSeniorMode: !prev.isSeniorMode }));
  };

  const addDislike = () => {
    if (newDislike.trim() && !localSettings.dislikes.includes(newDislike.trim())) {
      setLocalSettings(prev => ({
        ...prev,
        dislikes: [...prev.dislikes, newDislike.trim()]
      }));
      setNewDislike("");
    }
  };

  const removeDislike = (item: string) => {
    setLocalSettings(prev => ({
      ...prev,
      dislikes: prev.dislikes.filter(d => d !== item)
    }));
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-32 pt-2">
      <div className="px-4">
        <h2 className="text-2xl font-bold text-gray-800">设置与偏好</h2>
        <p className="text-gray-500 text-sm mt-1">定制您的专属月子计划</p>
      </div>

      <div className="bg-white mx-4 p-6 rounded-3xl shadow-sm space-y-8">
        
        {/* Start Date */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
            </div>
            生产日期 / 预产期
          </label>
          <div className="relative">
            <input
                type="date"
                value={localSettings.startDate}
                onChange={handleDateChange}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-800 font-medium focus:ring-2 focus:ring-primary-200 focus:border-primary-400 outline-none transition-all"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 px-1">
            小提示：在其他手机上设置相同的日期，可获取完全一致的食谱推荐。
          </p>
        </div>

        {/* Lactation Support */}
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <Baby className="w-4 h-4" />
            </div>
            喂养需求
          </label>
          <div 
             onClick={toggleLactation}
             className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
          >
             <div>
                <div className="font-bold text-gray-800">需要催乳/下奶</div>
                <div className="text-xs text-gray-400 mt-0.5">
                    {localSettings.lactationSupport ? "AI 将推荐下奶汤水和食材" : "AI 将减少油腻汤水，保持清淡"}
                </div>
             </div>
             <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${localSettings.lactationSupport ? 'bg-primary-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${localSettings.lactationSupport ? 'left-6' : 'left-1'}`}></div>
             </div>
          </div>
        </div>

        {/* Senior Mode Toggle */}
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <Eye className="w-4 h-4" />
            </div>
            显示模式
          </label>
          <div 
             onClick={toggleSeniorMode}
             className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
          >
             <div>
                <div className="font-bold text-gray-800">长辈模式 / 大字版</div>
                <div className="text-xs text-gray-400 mt-0.5">
                    {localSettings.isSeniorMode ? "已开启大字模式" : "标准字体大小"}
                </div>
             </div>
             <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${localSettings.isSeniorMode ? 'bg-secondary-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${localSettings.isSeniorMode ? 'left-6' : 'left-1'}`}></div>
             </div>
          </div>
        </div>

        {/* Dietary Preferences */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <Ban className="w-4 h-4" />
            </div>
            忌口 / 不喜欢食材
          </label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newDislike}
              onChange={(e) => setNewDislike(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDislike()}
              placeholder="输入食材名称，如：姜、羊肉..."
              className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary-200 outline-none"
            />
            <button
              onClick={addDislike}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium text-sm transition-colors"
            >
              添加
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {localSettings.dislikes.map((item) => (
              <span key={item} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm">
                {item}
                <button onClick={() => removeDislike(item)} className="text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
            {localSettings.dislikes.length === 0 && (
              <span className="text-gray-400 text-sm italic py-1.5">暂无忌口设置</span>
            )}
          </div>
        </div>

      </div>

      {/* Disclaimer */}
      <div className="mx-4 bg-secondary-50 p-4 rounded-2xl flex gap-3 border border-secondary-100">
          <AlertTriangle className="w-5 h-5 text-secondary-500 shrink-0 mt-0.5" />
          <p className="text-xs text-secondary-500 leading-relaxed">
              免责声明：本应用提供的食谱建议仅供参考。如有特殊身体状况或过敏史，请务必遵循医生或专业营养师的指导。
          </p>
      </div>

      <div className="px-4">
          <button
            onClick={() => onSave(localSettings)}
            className="w-full py-4 bg-primary-500 active:bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-200 transition-all flex justify-center items-center gap-2 text-lg"
          >
            <Save className="w-5 h-5" />
            保存设置
          </button>
      </div>
    </div>
  );
};

export default Settings;