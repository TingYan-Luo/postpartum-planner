import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DailyPlan, RecipeDetails, ShoppingItem, UserSettings, MealType } from "../types";

// Initialize Gemini
// Note: In a real production app, backend proxy is recommended to hide API KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

// Helper to generate a deterministic integer seed from strings
const generateSeed = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const getPhaseInfo = (day: number) => {
  if (day <= 7) return { name: "第一阶段：排毒消肿", focus: "清淡易消化，拒绝油腻，主攻排出恶露和多余水分。" };
  if (day <= 14) return { name: "第二阶段：调理修复", focus: "收缩内脏，修复子宫，增加蛋白质摄入，促进乳汁分泌。" };
  return { name: "第三阶段：滋补养颜", focus: "进补养身，改善体质，根据体质进行深度滋养。" };
};

/** 获取每日食谱计划 */
export const generateDailyPlan = async (
  day: number,
  settings: UserSettings,
  existingPlan?: DailyPlan
): Promise<DailyPlan> => {
  const phase = getPhaseInfo(day);
  const lactationInstruction = settings.lactationSupport 
    ? "需要催乳：请在食谱中适当安排下奶的汤水（如鲫鱼汤、猪蹄汤、木瓜等），并保证水分充足。"
    : "无需催乳：饮食清淡均衡即可，避免过度摄入油腻下奶汤水，防止堵奶。";
  
  // Calculate deterministic seed based on start date and day
  // This ensures that different devices with the same start date get the same plan
  const seedString = `${settings.startDate}-Day-${day}`;
  const consistencySeed = generateSeed(seedString);

  const prompt = `
    请为坐月子的产妇生成第 ${day} 天的月子餐计划（所属阶段：${phase.name}）。
    阶段重点：${phase.focus}。
    用户忌口/不喜欢：${settings.dislikes.join("、") || "无"}。
    用户过敏源：${settings.allergies.join("、") || "无"}。
    ${lactationInstruction}
    
    遵循原则：
    1. 结合传统中医坐月子理念（温补、忌生冷）和现代营养学（低盐、高蛋白）。
    2. 提供5顿餐点：早餐、早加餐、午餐、午加餐、晚餐。
    3. 菜名要地道、具体（例如“小米红糖粥”而不是“粥”）。
    
    请严格按照 JSON 格式返回。
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      meals: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "具体的菜品名称" },
            type: { type: Type.STRING, description: "餐点类型（必须是：早餐、早加餐、午餐、午加餐、晚餐 之一）" },
            description: { type: Type.STRING, description: "简短的推荐理由或功效（20字以内）" },
            calories: { type: Type.NUMBER, description: "预估卡路里" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "标签，如：下奶、补血、易消化" }
          },
          required: ["name", "type", "description", "tags"]
        }
      }
    },
    required: ["meals"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
        seed: consistencySeed, // Use deterministic seed
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    // Generate IDs deterministically too if possible, but timestamp is okay for React keys locally
    // We add a salt to ensure keys are unique per render if needed, but here we just need stability
    const mappedMeals = (data.meals || []).map((m: any, index: number) => ({
      id: `${day}-${index}-${consistencySeed}`,
      name: m.name,
      type: m.type,
      description: m.description,
      calories: m.calories,
      tags: m.tags || [],
      isCompleted: false
    }));

    return {
      day,
      phase: phase.name,
      meals: mappedMeals
    };
  } catch (error) {
    console.error("Gemini Plan Generation Error:", error);
    throw new Error("生成食谱失败，请重试。");
  }
};

/** 根据菜名获取菜谱详情 */
export const generateRecipeDetails = async (dishName: string): Promise<RecipeDetails> => {
  // Details are generally static for a dish name, so we can also use a seed
  const seed = generateSeed(dishName);

  const prompt = `
    请提供适合坐月子产妇食用的菜谱详情： "${dishName}"。
    要求：低盐、少油、无刺激性调料。
    请包含：
    1. 食材清单（带大致用量）。
    2. 详细烹饪步骤。
    3. 恢复贴士（为什么这道菜适合产妇）。
    4. 营养亮点（一句话）。
    请使用简体中文回复。
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
      steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      tips: { type: Type.ARRAY, items: { type: Type.STRING } },
      nutritionHighlights: { type: Type.STRING }
    },
    required: ["ingredients", "steps", "tips", "nutritionHighlights"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        seed: seed
      }
    });

    return JSON.parse(response.text || "{}") as RecipeDetails;
  } catch (error) {
    console.error("Recipe Generation Error:", error);
    return {
      ingredients: ["加载失败"],
      steps: ["请稍后重试"],
      tips: [],
      nutritionHighlights: ""
    };
  }
};

/** 获取采购清单 */
export const generateShoppingListAI = async (
  mealNames: string[],
  days: number
): Promise<ShoppingItem[]> => {
  const prompt = `
    请为以下 ${days} 天的月子餐生成一份合并的采购清单：
    ${mealNames.join("、")}。
    
    要求：
    1. 合并相同食材（例如两个菜都需要鸡蛋，合并数量）。
    2. 分类必须为中文：蔬菜、肉禽、水产、粮油干货、调味品、水果、奶制品、其他。
    3. 数量要符合家庭采购习惯（如：500g，1把，3个）。
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            amount: { type: Type.STRING },
            category: { 
              type: Type.STRING, 
              enum: ["蔬菜", "肉禽", "水产", "粮油干货", "调味品", "水果", "奶制品", "其他"] 
            },
          },
          required: ["name", "amount", "category"]
        }
      }
    },
    required: ["items"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const data = JSON.parse(response.text || "{}");
    return (data.items || []).map((item: any) => ({
      ...item,
      checked: false
    }));
  } catch (error) {
    console.error("Shopping List Generation Error:", error);
    throw error;
  }
};