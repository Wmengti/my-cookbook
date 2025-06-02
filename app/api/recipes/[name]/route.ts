import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { Recipe } from '../../../../types';

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

// 保存菜谱到CSV
async function saveRecipesToCSV(recipes: Recipe[]): Promise<boolean> {
  try {
    const headers = '菜名,类型,主要原料,配料/调料,做法,备注';
    const rows = recipes.map(recipe => {
      return [
        recipe.菜名,
        recipe.类型,
        recipe.主要原料,
        `"${recipe.配料调料}"`,
        `"${recipe.做法}"`,
        recipe.备注
      ].join(',');
    });
    
    const content = [headers, ...rows].join('\n');
    await fs.writeFile(csvFilePath, content, 'utf-8');
    
    // 清除缓存
    invalidateCache();
    
    return true;
  } catch (error) {
    console.error('保存CSV文件出错:', error);
    return false;
  }
}

// 获取单个菜谱
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const decodedName = decodeURIComponent(params.name);
    console.log('API: 请求获取菜谱:', decodedName);
    
    const recipes = await getRecipesFromCSV();
    console.log('API: 获取到菜谱总数:', recipes.length);
    
    const recipe = recipes.find(r => r.菜名 === decodedName);
    
    if (!recipe) {
      console.log('API: 未找到菜谱:', decodedName);
      console.log('API: 现有菜谱名称列表:', recipes.map(r => r.菜名));
      return NextResponse.json({ 
        error: `未找到菜谱 "${decodedName}"`,
        availableRecipes: recipes.map(r => r.菜名)
      }, { status: 404 });
    }
    
    console.log('API: 成功找到菜谱:', recipe.菜名);
    return NextResponse.json(recipe);
  } catch (error: any) {
    console.error('API: 获取菜谱出错:', error);
    return NextResponse.json({ 
      error: '获取菜谱失败', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// 删除菜谱
export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const recipes = await getRecipesFromCSV();
    const decodedName = decodeURIComponent(params.name);
    const recipeIndex = recipes.findIndex(r => r.菜名 === decodedName);
    
    if (recipeIndex === -1) {
      return NextResponse.json({ error: '未找到该菜谱' }, { status: 404 });
    }
    
    // 删除菜谱
    recipes.splice(recipeIndex, 1);
    
    // 保存更新后的菜谱列表
    const success = await saveRecipesToCSV(recipes);
    
    if (!success) {
      return NextResponse.json({ error: '删除菜谱失败' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除菜谱出错:', error);
    return NextResponse.json({ error: '删除菜谱失败' }, { status: 500 });
  }
}

// 更新菜谱
export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const decodedName = decodeURIComponent(params.name);
    const updatedRecipe = await request.json() as Recipe;
    const recipes = await getRecipesFromCSV();
    const recipeIndex = recipes.findIndex(r => r.菜名 === decodedName);
    
    if (recipeIndex === -1) {
      return NextResponse.json({ error: '未找到该菜谱' }, { status: 404 });
    }
    
    // 更新菜谱
    recipes[recipeIndex] = updatedRecipe;
    
    // 保存更新后的菜谱列表
    const success = await saveRecipesToCSV(recipes);
    
    if (!success) {
      return NextResponse.json({ error: '更新菜谱失败' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, recipe: updatedRecipe });
  } catch (error) {
    console.error('更新菜谱出错:', error);
    return NextResponse.json({ error: '更新菜谱失败' }, { status: 500 });
  }
} 