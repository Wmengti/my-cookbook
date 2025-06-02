'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';
import { Recipe } from '../types';
import { Button, Input, message, Modal, Card, Tag, Tabs, Spin, Skeleton } from 'antd';
import { SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

// 懒加载随机菜单组件
const RandomMenu = lazy(() => import('../components/RandomMenu'));

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      // 添加缓存控制
      const response = await fetch('/api/recipes', {
        cache: 'no-store' // 开发环境禁用缓存以便测试，生产环境可改为 'force-cache'
      });
      
      if (!response.ok) {
        throw new Error('获取菜谱失败');
      }
      
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('获取菜谱出错:', error);
      message.error('获取菜谱失败');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async (name: string) => {
    Modal.confirm({
      title: '确定删除?',
      content: `确定要删除菜谱"${name}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/recipes/${encodeURIComponent(name)}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error('删除菜谱失败');
          }
          
          message.success('删除成功');
          fetchRecipes();
        } catch (error) {
          console.error('删除菜谱出错:', error);
          message.error('删除失败');
        }
      }
    });
  };

  // 避免在每次渲染时都重新过滤
  const filteredRecipes = recipes.filter(recipe => 
    recipe.菜名.toLowerCase().includes(searchTerm.toLowerCase()) || 
    recipe.主要原料.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.类型.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 优化内容渲染，只在需要时渲染内容
  const renderRecipeList = () => {
    if (loading) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      );
    }

    if (recipes.length === 0) {
      return <div style={{ textAlign: 'center', padding: '40px 0' }}>暂无菜谱，请添加新菜谱</div>;
    }

    if (filteredRecipes.length === 0) {
      return <div style={{ textAlign: 'center', padding: '40px 0' }}>没有找到匹配的菜谱</div>;
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filteredRecipes.map((recipe) => (
          <Card
            key={recipe.菜名}
            title={recipe.菜名}
            className="recipe-card"
            extra={
              <Tag color={recipe.类型 === '荤菜' ? 'red' : recipe.类型 === '素菜' ? 'green' : 'blue'}>
                {recipe.类型}
              </Tag>
            }
            actions={[
              <Link key="edit" href={`/recipes/${encodeURIComponent(recipe.菜名)}/edit`}>
                <EditOutlined />
              </Link>,
              <DeleteOutlined key="delete" onClick={() => deleteRecipe(recipe.菜名)} />
            ]}
          >
            <p><strong>主要原料:</strong> {recipe.主要原料}</p>
            <p><strong>备注:</strong> {recipe.备注}</p>
            <div style={{ marginTop: '10px' }}>
              <Link href={`/recipes/${encodeURIComponent(recipe.菜名)}`}>
                <Button type="link" style={{ padding: 0 }}>查看详情</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const items = [
    {
      key: '1',
      label: '所有菜谱',
      children: (
        <div>
          <div className="page-header">
            <Input 
              placeholder="搜索菜谱..." 
              prefix={<SearchOutlined />} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
            />
            <Link href="/recipes/new">
              <Button type="primary" icon={<PlusOutlined />}>新增菜谱</Button>
            </Link>
          </div>
          
          {renderRecipeList()}
        </div>
      ),
    },
    {
      key: '2',
      label: '随机生成菜单',
      children: (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>}>
          <RandomMenu />
        </Suspense>
      ),
    },
  ];

  return (
    <main className="container">
      <h1 className="page-title" style={{ marginBottom: '24px' }}>我的菜谱</h1>
      <Tabs 
        defaultActiveKey="1" 
        items={items} 
        onChange={(key) => setActiveTab(key)}
      />
    </main>
  );
} 