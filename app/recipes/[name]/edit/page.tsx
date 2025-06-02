'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Recipe } from '../../../../types';
import { Button, Form, Input, Select, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

export default function EditRecipe({ params }: { params: { name: string } }) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 解码URL参数中的菜谱名
  const decodedName = decodeURIComponent(params.name);
  console.log('编辑页面: 当前编辑的菜谱:', decodedName);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('编辑页面: 开始获取菜谱数据...');
      const response = await fetch(`/api/recipes/${encodeURIComponent(decodedName)}`, {
        cache: 'no-store' // 开发环境禁用缓存
      });
      
      console.log('编辑页面: API响应状态:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取菜谱详情失败');
      }
      
      const data = await response.json();
      console.log('编辑页面: 获取到菜谱数据:', data);
      
      if (!data || typeof data !== 'object') {
        throw new Error('菜谱数据格式错误');
      }
      
      setRecipe(data);
      form.setFieldsValue(data);
    } catch (error: any) {
      console.error('编辑页面: 获取菜谱详情出错:', error);
      setError(error.message || '获取菜谱详情失败');
      message.error('获取菜谱详情失败: ' + error.message);
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('编辑页面: params变化，重新获取菜谱:', decodedName);
    fetchRecipe();
  }, [params.name, decodedName]);

  const handleSubmit = async (values: Recipe) => {
    try {
      setSubmitting(true);
      console.log('编辑页面: 提交更新菜谱:', values);
      
      const response = await fetch(`/api/recipes/${encodeURIComponent(decodedName)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新菜谱失败');
      }

      message.success('更新菜谱成功');
      console.log('编辑页面: 更新成功，跳转到详情页');
      
      // 使用更新后的菜名进行导航
      router.push(`/recipes/${encodeURIComponent(values.菜名)}`);
    } catch (error: any) {
      console.error('编辑页面: 更新菜谱出错:', error);
      message.error('更新失败: ' + error.message);
    } finally {
      setSubmitting(false);
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
          <h2>未找到菜谱 &quot;{decodedName}&quot;</h2>
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
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push(`/recipes/${encodeURIComponent(decodedName)}`)}
        >
          返回详情
        </Button>
        <h1>编辑菜谱</h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={recipe}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="菜名"
          label="菜名"
          rules={[{ required: true, message: '请输入菜名' }]}
        >
          <Input placeholder="请输入菜名" />
        </Form.Item>

        <Form.Item
          name="类型"
          label="类型"
          rules={[{ required: true, message: '请选择菜品类型' }]}
        >
          <Select placeholder="请选择菜品类型">
            <Option value="荤菜">荤菜</Option>
            <Option value="素菜">素菜</Option>
            <Option value="汤类">汤类</Option>
            <Option value="主食">主食</Option>
            <Option value="小吃">小吃</Option>
            <Option value="甜品">甜品</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="主要原料"
          label="主要原料"
          rules={[{ required: true, message: '请输入主要原料' }]}
        >
          <Input placeholder="请输入主要原料" />
        </Form.Item>

        <Form.Item
          name="配料调料"
          label="配料/调料"
          rules={[{ required: true, message: '请输入配料/调料' }]}
        >
          <TextArea placeholder="请输入配料/调料，用逗号分隔" rows={3} />
        </Form.Item>

        <Form.Item
          name="做法"
          label="做法"
          rules={[{ required: true, message: '请输入做法步骤' }]}
        >
          <TextArea placeholder="请输入做法步骤" rows={6} />
        </Form.Item>

        <Form.Item
          name="备注"
          label="备注"
        >
          <Input placeholder="请输入备注信息" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={submitting}
          >
            保存菜谱
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
} 