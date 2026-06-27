import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  TableOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { getOrders } from '../services/order.service';
import { DashboardStats } from '../types';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const orders = await getOrders();
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const pendingOrders = orders.filter(
          (o) => o.status === 'PENDING' || o.status === 'IN_PROGRESS'
        ).length;
        setStats({
          totalOrders,
          totalRevenue,
          activeTables: 5,       // placeholder – replace with real table endpoint when available
          pendingOrders,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center' }} />;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={stats?.totalOrders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Revenue ($)"
              value={stats?.totalRevenue.toFixed(2)}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Tables"
              value={stats?.activeTables}
              prefix={<TableOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Orders"
              value={stats?.pendingOrders}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
