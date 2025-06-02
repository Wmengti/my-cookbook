import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { Recipe } from '../../../types';

const csvFilePath = path.join(process.cwd(), 'public', 'cookbook.csv');

// 添加内存缓存
let cachedRecipes: Recipe[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 缓存有效期1分钟

// 从CSV读取所有菜谱
async function getRecipesFromCSV(): Promise<Recipe[]> {
  // 检查缓存是否有效
  const now = Date.now();
  if (cachedRecipes && (now - lastFetchTime < CACHE_TTL)) {
    return cachedRecipes;
  }

  try {
    const content = await fs.readFile(csvFilePath, 'utf-8');
    const recipes: Recipe[] = [];
    
    // 简单解析CSV内容
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // 处理引号内有逗号的情况
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      values.push(currentValue);
      
      if (values.length >= 6) {
        recipes.push({
          菜名: values[0],
          类型: values[1],
          主要原料: values[2],
          配料调料: values[3],
          做法: values[4],
          备注: values[5]
        });
      }
    }
    
    // 更新缓存
    cachedRecipes = recipes;
    lastFetchTime = now;
    
    return recipes;
  } catch (error) {
    console.error('读取CSV文件出错:', error);
    return [];
  }
}

// 清除缓存
function invalidateCache() {
  cachedRecipes = null;
}

// 获取所有菜谱
export async function GET(request: NextRequest) {
  try {
    const recipes = await getRecipesFromCSV();
    return NextResponse.json(recipes);
  } catch (error) {
    console.error('获取菜谱出错:', error);
    return NextResponse.json({ error: '获取菜谱失败' }, { status: 500 });
  }
}

// 添加新菜谱
export async function POST(request: NextRequest) {
  try {
    const newRecipe = await request.json() as Recipe;
    const recipes = await getRecipesFromCSV();
    
    // 检查是否已存在同名菜谱
    if (recipes.some(recipe => recipe.菜名 === newRecipe.菜名)) {
      return NextResponse.json({ error: '菜谱已存在' }, { status: 400 });
    }
    
    // 格式化为CSV行
    const newRecipeRow = [
      newRecipe.菜名,
      newRecipe.类型,
      newRecipe.主要原料,
      `"${newRecipe.配料调料}"`,
      `"${newRecipe.做法}"`,
      newRecipe.备注
    ].join(',');
    
    // 追加到CSV文件
    await fs.appendFile(csvFilePath, `\n${newRecipeRow}`);
    
    // 清除缓存
    invalidateCache();
    
    return NextResponse.json({ success: true, recipe: newRecipe });
  } catch (error) {
    console.error('添加菜谱出错:', error);
    return NextResponse.json({ error: '添加菜谱失败' }, { status: 500 });
  }
} 