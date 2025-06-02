'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, message, Card } from 'antd';

export default function RandomMenu() {
  const [days, setDays] = useState(7);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const generateMenu = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/menu?days=${days}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成菜单失败');
      }
      const data = await response.json();
      setMenu(data);
    } catch (error: any) {
      console.error('生成菜单出错:', error);
      message.error(error.message || '生成菜单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>生成天数:</label>
        <Input 
          type="number" 
          value={days} 
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ width: '100px' }}
          min={1}
        />
        <Button 
          type="primary" 
          onClick={generateMenu} 
          loading={loading}
          style={{ marginLeft: '10px' }}
        >
          生成菜单
        </Button>
      </div>

      {menu.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '16px' }}>生成的{days}天菜单</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {menu.map((day, index) => (
              <Card key={index} title={day.日期}>
                <div>
                  <h3>荤菜</h3>
                  <p><strong>{day.荤菜.菜名}</strong></p>
                  <p>主要原料: {day.荤菜.主要原料}</p>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <h3>素菜</h3>
                  <p><strong>{day.素菜.菜名}</strong></p>
                  <p>主要原料: {day.素菜.主要原料}</p>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <Link href={`/recipes/${encodeURIComponent(day.荤菜.菜名)}`}>
                    <Button type="link" style={{ padding: 0 }}>荤菜详情</Button>
                  </Link>
                  {' | '}
                  <Link href={`/recipes/${encodeURIComponent(day.素菜.菜名)}`}>
                    <Button type="link" style={{ padding: 0 }}>素菜详情</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 