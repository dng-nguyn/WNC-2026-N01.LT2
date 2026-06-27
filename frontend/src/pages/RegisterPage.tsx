import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, message } from 'antd';
import { useAuth } from '../hooks/useAuth';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: {
    username: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => {
    setSubmitting(true);
    try {
      await register(values.username, values.password, values.fullName, values.phone);
      message.success('Registration successful');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <div style={{ width: 400, padding: 24, background: '#fff', borderRadius: 8 }}>
        <Typography.Title level={3}>Register</Typography.Title>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="fullName"
            rules={[{ required: true, message: 'Please input your full name' }]}
          >
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username' }]}
          >
            <Input placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item name="phone">
            <Input placeholder="Phone (optional)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Register
            </Button>
          </Form.Item>
        </Form>
        <Typography.Text>
          Already have an account? <Link to="/login">Log in</Link>
        </Typography.Text>
      </div>
    </div>
  );
};

export default RegisterPage;
