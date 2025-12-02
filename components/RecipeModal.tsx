import React, { useEffect, useState, useRef } from 'react';
import { X, Clock, ChefHat, Info, Loader2, Sparkles, Share2, Download } from 'lucide-react';
import { RecipeDetails } from '../types';
import { generateRecipeDetails } from '../services/dsService';
import html2canvas from 'html2canvas';

interface RecipeModalProps {
  dishName: string;
  isOpen: boolean;
  onClose: () => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ dishName, isOpen, onClose }) => {
  const [details, setDetails] = useState<RecipeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dishName) {
      setLoading(true);
      generateRecipeDetails(dishName)
        .then(setDetails)
        .finally(() => setLoading(false));
    } else {
        setDetails(null);
    }
  }, [isOpen, dishName]);

  const handleShare = async () => {
    if (!contentRef.current) return;
    
    setCapturing(true);
    try {
      // Small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        // Try native sharing if available
        if (navigator.share) {
            try {
                const file = new File([blob], `${dishName}-月子食谱.png`, { type: 'image/png' });
                await navigator.share({
                    title: `月子食谱推荐：${dishName}`,
                    text: '我正在使用 PostpartumPlanner 科学坐月子，这是今天的推荐食谱！',
                    files: [file]
                });
            } catch (err) {
                // Fallback to download if share fails or user cancels
                console.log("Share skipped or failed, downloading instead");
                 const link = document.createElement('a');
                link.download = `${dishName}-月子食谱.png`;
                link.href = canvas.toDataURL();
                link.click();
            }
        } else {
            // Fallback for browsers without navigator.share
            const link = document.createElement('a');
            link.download = `${dishName}-月子食谱.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
      }, 'image/png');
    } catch (err) {
      console.error("Capture failed:", err);
      alert("生成图片失败，请重试");
    } finally {
      setCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Card Content - Bottom Sheet style on mobile */}
      <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col relative z-10 transition-transform duration-300">
        
        {/* Drag Handle (Visual only) */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden" onClick={onClose}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 truncate pr-4">
            <ChefHat className="w-6 h-6 text-primary-500 shrink-0" />
            <span className="truncate">{dishName}</span>
          </h2>
          <div className="flex items-center gap-2 shrink-0">
             {details && !loading && (
                <button 
                    onClick={handleShare}
                    disabled={capturing}
                    className="p-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-full transition-colors flex items-center gap-1"
                >
                    {capturing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                </button>
             )}
            <button 
                onClick={onClose}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
            >
                <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content Wrapper for Scroll */}
        <div className="flex-1 overflow-y-auto bg-white scroll-smooth">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-primary-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm font-medium">AI 营养师正在为您生成食谱...</p>
            </div>
          ) : details ? (
            /* Capture Target Area */
            <div ref={contentRef} className="p-6 pb-10 space-y-8 bg-white">
              
              {/* Header for Capture (Only visible in screenshot mostly, but here visible always) */}
              <div className="hidden print-header mb-4">
                 <h1 className="text-2xl font-bold text-primary-600 mb-1">{dishName}</h1>
                 <p className="text-sm text-gray-400">PostpartumPlanner 月子食谱推荐</p>
              </div>

              {/* Nutrition Highlight */}
              <div className="bg-gradient-to-r from-primary-50 to-white border border-primary-100 rounded-xl p-4 flex gap-3 items-start shadow-sm">
                <Sparkles className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed font-medium">{details.nutritionHighlights}</p>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
                    准备食材
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {details.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="w-1.5 h-1.5 bg-primary-300 rounded-full shrink-0" />
                      <span className="text-sm truncate">{ing}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
                    烹饪步骤
                </h3>
                <div className="space-y-6">
                  {details.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      {/* Vertical line connector */}
                      {idx !== details.steps.length - 1 && (
                          <div className="absolute left-[15px] top-8 bottom-[-16px] w-0.5 bg-gray-100"></div>
                      )}
                      
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm shadow-sm z-10">
                        {idx + 1}
                      </div>
                      <p className="text-gray-600 mt-1 leading-relaxed text-base">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              {details.tips.length > 0 && (
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" /> 恢复小贴士
                  </h4>
                  <ul className="space-y-2">
                    {details.tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-amber-900 flex gap-2 items-start">
                        <span className="text-amber-500 mt-1.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Branding Footer for Capture */}
              <div className="mt-8 pt-4 border-t border-dashed border-gray-200 text-center">
                 <p className="text-xs text-gray-400 font-medium">Generated by PostpartumPlanner</p>
              </div>

            </div>
          ) : (
             <div className="text-center text-gray-400 py-10">
                无法加载食谱详情，请检查网络后重试。
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;