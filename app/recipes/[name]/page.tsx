'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Recipe } from '../../../types';
import { Button, Card, Tag, Descriptions, Divider, message, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export default function RecipeDetail({ params }: { params: { name: string } }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 解码URL参数中的菜谱名
  const decodedName = decodeURIComponent(params.name);
  console.log('当前查看的菜谱:', decodedName);

  useEffect(() => {
    console.log('params变化，重新获取菜谱:', decodedName);
    fetchRecipe();
  }, [params.name]);

  // 确保当URL参数变化时重新获取菜谱
  useEffect(() => {
    const handleRouteChange = () => {
      fetchRecipe();
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('开始获取菜谱数据...');
      const response = await fetch(`/api/recipes/${encodeURIComponent(decodedName)}`, {
        cache: 'no-store' // 开发环境禁用缓存
      });
      
      console.log('API响应状态:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取菜谱详情失败');
      }
      
      const data = await response.json();
      console.log('获取到菜谱数据:', data);
      
      if (!data || typeof data !== 'object') {
        throw new Error('菜谱数据格式错误');
      }
      
      setRecipe(data);
    } catch (error: any) {
      console.error('获取菜谱详情出错:', error);
      setError(error.message || '获取菜谱详情失败');
      message.error('获取菜谱详情失败: ' + error.message);
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${encodeURIComponent(decodedName)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('删除菜谱失败');
      }
      
      message.success('删除成功');
      router.push('/');
    } catch (error: any) {
      console.error('删除菜谱出错:', error);
      message.error('删除失败: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载菜谱中..." />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container">
        <div className="page-header">
          <Link href="/">
            <Button icon={<ArrowLeftOutlined />}>返回首页</Button>
          </Link>
        </div>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h2>未找到菜谱 "{decodedName}"</h2>
          <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
          <Button 
            type="primary" 
            onClick={fetchRecipe} 
            style={{ marginTop: '20px' }}
          >
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <Link href="/">
          <Button icon={<ArrowLeftOutlined />}>返回首页</Button>
        </Link>
        <div>
          <Link href={`/recipes/${encodeURIComponent(decodedName)}/edit`}>
            <Button icon={<EditOutlined />} style={{ marginRight: '10px' }}>
              编辑菜谱
            </Button>
          </Link>
          <Button danger icon={<DeleteOutlined />} onClick={deleteRecipe}>
            删除菜谱
          </Button>
        </div>
      </div>

      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1>{recipe.菜名}</h1>
            <Tag color={recipe.类型 === '荤菜' ? 'red' : recipe.类型 === '素菜' ? 'green' : 'blue'}>
              {recipe.类型}
            </Tag>
          </div>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="主要原料">{recipe.主要原料}</Descriptions.Item>
          <Descriptions.Item label="配料/调料">{recipe.配料调料}</Descriptions.Item>
          <Descriptions.Item label="做法">
            <div style={{ whiteSpace: 'pre-line' }}>{recipe.做法}</div>
          </Descriptions.Item>
          <Descriptions.Item label="备注">{recipe.备注}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
} 