import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, InputNumber, Select, message, Table } from 'antd';
import { getMenuItems } from '../services/menuItem.service';
import { getMenus } from '../services/menu.service';
import { createOrder } from '../services/order.service';
import { MenuItem, Menu } from '../types';
import { useAuth } from '../hooks/useAuth';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

const POSPage: React.FC = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | undefined>(undefined);
  const [tableOptions, setTableOptions] = useState<{ id: string; tableNumber: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [items, categories] = await Promise.all([getMenuItems(), getMenus()]);
        setMenuItems(items);
        setMenus(categories);

        // Replace with a real table endpoint call when available
        setTableOptions([
          { id: '1', tableNumber: '1' },
          { id: '2', tableNumber: '2' },
          { id: '3', tableNumber: '3' },
        ]);
      } catch {
        message.error('Failed to load data');
      }
    };
    fetchData();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((ci) => ci.menuItem.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((ci) => (ci.menuItem.id === itemId ? { ...ci, quantity } : ci))
      );
    }
  };

  const totalAmount = cart.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      message.warning('Cart is empty');
      return;
    }
    if (!user) {
      message.error('User not authenticated');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        userId: user.id,
        tableId: selectedTable,
        items: cart.map((ci) => ({
          menuItemId: ci.menuItem.id,
          quantity: ci.quantity,
        })),
      };
      await createOrder(payload);
      message.success('Order placed successfully');
      setCart([]);
      setSelectedTable(undefined);
    } catch {
      message.error('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const cartColumns = [
    { title: 'Item', dataIndex: ['menuItem', 'name'], key: 'name' },
    {
      title: 'Price',
      key: 'price',
      render: (_: any, record: CartItem) => `$${record.menuItem.price.toFixed(2)}`,
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_: any, record: CartItem) => (
        <InputNumber
          min={0}
          value={record.quantity}
          onChange={(val) => updateQuantity(record.menuItem.id, val || 0)}
        />
      ),
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      render: (_: any, record: CartItem) =>
        `$${(record.menuItem.price * record.quantity).toFixed(2)}`,
    },
  ];

  const grouped: Record<string, MenuItem[]> = {};
  menuItems.forEach((item) => {
    const catId = item.menuId;
    if (!grouped[catId]) grouped[catId] = [];
    grouped[catId].push(item);
  });

  return (
    <div>
      <h2>Point of Sale</h2>
      <Row gutter={[16, 16]}>
        <Col span={16}>
          {menus
            .filter((m) => grouped[m.id]?.length)
            .map((menu) => (
              <div key={menu.id} style={{ marginBottom: 24 }}>
                <h3>{menu.name}</h3>
                <Row gutter={[12, 12]}>
                  {grouped[menu.id].map((item) => (
                    <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                      <Card hoverable onClick={() => addToCart(item)}>
                        <Card.Meta title={item.name} description={`$${item.price.toFixed(2)}`} />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
        </Col>
        <Col span={8}>
          <Card
            title="Cart"
            actions={[
              <Button
                type="primary"
                block
                loading={submitting}
                onClick={handleCheckout}
              >
                Place Order (${totalAmount.toFixed(2)})
              </Button>,
            ]}
          >
            <div style={{ marginBottom: 12 }}>
              <Select
                placeholder="Select table (optional)"
                allowClear
                style={{ width: '100%' }}
                value={selectedTable}
                onChange={setSelectedTable}
                options={tableOptions.map((t) => ({
                  label: `Table ${t.tableNumber}`,
                  value: t.id,
                }))}
              />
            </div>
            <Table
              dataSource={cart}
              columns={cartColumns}
              rowKey={(record) => record.menuItem.id}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    Total
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>${totalAmount.toFixed(2)}</Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default POSPage;
