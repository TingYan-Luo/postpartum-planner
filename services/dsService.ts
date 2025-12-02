import { DailyPlan, RecipeDetails, ShoppingItem, UserSettings } from "../types";

// Configuration for DeepSeek
// Prioritize DS_API_KEY, fallback to API_KEY if user just swaps the key in the same env var
const API_KEY = process.env.DS_API_KEY || process.env.API_KEY;
const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL_ID = "deepseek-chat"; // DeepSeek V3

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

// Helper function to call DeepSeek API
async function callDeepSeek(messages: any[], seed: number, jsonMode: boolean = true) {
  if (!API_KEY) {
    throw new Error("Missing API Key for DeepSeek");
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: messages,
        temperature: 1.0, // Use seed for determinism instead of low temp if possible, or balance it
        seed: seed,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" },
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API Error:", errorText);
      throw new Error(`DeepSeek API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    // DeepSeek is usually good with json_object mode, but sometimes adds markdown
    if (jsonMode) {
      try {
        return JSON.parse(content);
      } catch (e) {
        // Fallback cleanup if strict JSON mode fails or markdown is included
        const cleanJson = content.replace(/```json\n?|```/g, "").trim();
        return JSON.parse(cleanJson);
      }
    }
    
    return content;
  } catch (error) {
    console.error("DeepSeek Service Error:", error);
    throw error;
  }
}

export const generateDailyPlan = async (
  day: number,
  settings: UserSettings,
  existingPlan?: DailyPlan
): Promise<DailyPlan> => {
  const phase = getPhaseInfo(day);
  const lactationInstruction = settings.lactationSupport 
    ? "需要催乳：请在食谱中适当安排科学下奶的汤水（如去油鲫鱼汤、去油猪蹄汤、木瓜等），并保证水分充足。"
    : "无需催乳：饮食清淡均衡即可，避免过度摄入油腻下奶汤水，防止堵奶。";
  
  const seedString = `${settings.startDate}-Day-${day}`;
  const consistencySeed = generateSeed(seedString);

  const systemPrompt = `你是一位专业的月子餐营养师。请根据产妇的产后天数和身体状况，生成科学的膳食计划。请务必以纯 JSON 格式返回数据。`;

  const userPrompt = `
    请为坐月子的产妇生成第 ${day} 天的月子餐计划（所属阶段：${phase.name}）。
    阶段重点：${phase.focus}。
    用户忌口/不喜欢：${settings.dislikes.join("、") || "无"}。请不要仅仅去除某项食材，而是直接更换菜品。
    用户过敏源：${settings.allergies.join("、") || "无"}。
    ${lactationInstruction}
    
    遵循原则：
    1. 结合传统中医坐月子理念（温补、忌生冷）和现代营养学（低盐、高蛋白）。
    2. 提供5顿餐点：早餐、早加餐、午餐、午加餐、晚餐。
    3. 菜名要地道、具体（例如“小米红糖粥”而不是“粥”）。
    
    请严格按照以下 JSON 结构返回：
    {
      "meals": [
        {
          "name": "具体的菜品名称",
          "type": "餐点类型（必须是：早餐、早加餐、午餐、午加餐、晚餐 之一）",
          "description": "简短的推荐理由或功效（20字以内）",
          "calories": 300,
          "tags": ["标签1", "标签2"]
        }
      ]
    }
  `;

  try {
    const data = await callDeepSeek(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ], 
      consistencySeed
    );
    
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
    console.error("Plan Generation Error:", error);
    throw new Error("生成食谱失败，请重试。");
  }
};

export const generateRecipeDetails = async (dishName: string): Promise<RecipeDetails> => {
  const seed = generateSeed(dishName);

  const systemPrompt = `你是一位经验丰富的月子餐大厨。请以纯 JSON 格式提供详细的菜谱制作指南。`;

  const userPrompt = `
    请提供适合坐月子产妇食用的菜谱详情： "${dishName}"。
    要求：低盐、少油、无刺激性调料。
    请包含：
    1. 食材清单（带大致用量）。
    2. 详细烹饪步骤。
    3. 恢复贴士（为什么这道菜适合产妇）。
    4. 营养亮点（一句话）。
    
    返回 JSON 格式如下：
    {
      "ingredients": ["食材1", "食材2"],
      "steps": ["步骤1", "步骤2"],
      "tips": ["贴士1", "贴士2"],
      "nutritionHighlights": "营养亮点描述"
    }
  `;

  try {
    const data = await callDeepSeek(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      seed
    );

    return data as RecipeDetails;
  } catch (error) {
    console.error("Recipe Generation Error:", error);
    return {
      ingredients: ["加载失败"],
      steps: ["请检查网络或重试"],
      tips: [],
      nutritionHighlights: ""
    };
  }
};

export const generateShoppingListAI = async (
  mealNames: string[],
  days: number
): Promise<ShoppingItem[]> => {
  const seed = generateSeed(mealNames.join(","));
  
  const systemPrompt = "你是一个智能生活助手，擅长整理采购清单。请以纯 JSON 格式返回。";

  const userPrompt = `
    请为以下 ${days} 天的月子餐生成一份合并的采购清单：
    ${mealNames.join("、")}。
    
    要求：
    1. 合并相同食材（例如两个菜都需要鸡蛋，合并数量）。
    2. 分类必须为中文：蔬菜、肉禽、水产、粮油干货、调味品、水果、奶制品、其他。
    3. 数量要符合家庭采购习惯（如：500g，1把，3个）。
    
    返回 JSON 结构：
    {
      "items": [
        {
          "name": "食材名",
          "amount": "数量",
          "category": "分类"
        }
      ]
    }
  `;

  try {
    const data = await callDeepSeek(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      seed
    );

    return (data.items || []).map((item: any) => ({
      ...item,
      checked: false
    }));
  } catch (error) {
    console.error("Shopping List Generation Error:", error);
    throw error;
  }
};