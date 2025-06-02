'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Recipe } from '../../../types';
import { Button, Form, Input, Select, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const initialRecipe: Recipe = {
  菜名: '',
  类型: '荤菜',
  主要原料: '',
  配料调料: '',
  做法: '',
  备注: ''
};

export default function NewRecipe() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: Recipe) => {
    try {
      setLoading(true);
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '添加菜谱失败');
      }

      message.success('添加菜谱成功');
      router.push('/');
    } catch (error: any) {
      console.error('添加菜谱出错:', error);
      message.error(error.message || '添加菜谱失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <Link href="/">
          <Button icon={<ArrowLeftOutlined />}>返回首页</Button>
        </Link>
        <h1>新增菜谱</h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialRecipe}
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
            loading={loading}
          >
            保存菜谱
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
} 