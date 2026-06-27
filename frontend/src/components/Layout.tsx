import React from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = AntLayout;

const Layout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
    { key: '/pos', icon: <ShoppingCartOutlined />, label: <Link to="/pos">POS</Link> },
    { key: '/menus', icon: <UnorderedListOutlined />, label: <Link to="/menus">Menu Categories</Link> },
    { key: '/menu-items', icon: <AppstoreOutlined />, label: <Link to="/menu-items">Menu Items</Link> },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ color: 'white', padding: '16px', fontWeight: 'bold' }}>Coffee Shop</div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {user && <span>{user.fullName} ({user.role})</span>}
        </Header>
        <Content style={{ margin: '16px' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
