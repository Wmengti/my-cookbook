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

// 随机生成菜单
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ error: '天数必须是正整数' }, { status: 400 });
    }
    
    const recipes = await getRecipesFromCSV();
    
    // 按类型分类菜谱
    const meatDishes = recipes.filter(recipe => recipe.类型 === '荤菜');
    const vegDishes = recipes.filter(recipe => recipe.类型 === '素菜');
    
    // 如果菜谱不足，返回错误
    if (meatDishes.length < days || vegDishes.length < days) {
      return NextResponse.json(
        { 
          error: '菜谱数量不足，无法生成菜单',
          现有荤菜: meatDishes.length,
          现有素菜: vegDishes.length,
          需要的每类菜数量: days
        }, 
        { status: 400 }
      );
    }
    
    // 随机打乱菜谱顺序
    const shuffledMeat = [...meatDishes].sort(() => 0.5 - Math.random());
    const shuffledVeg = [...vegDishes].sort(() => 0.5 - Math.random());
    
    // 生成菜单
    const menu = [];
    for (let i = 0; i < days; i++) {
      menu.push({
        日期: `第${i + 1}天`,
        荤菜: shuffledMeat[i],
        素菜: shuffledVeg[i]
      });
    }
    
    return NextResponse.json(menu);
  } catch (error) {
    console.error('生成菜单出错:', error);
    return NextResponse.json({ error: '生成菜单失败' }, { status: 500 });
  }
} 