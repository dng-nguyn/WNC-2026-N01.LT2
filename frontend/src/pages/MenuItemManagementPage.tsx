import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../services/menuItem.service';
import { getMenus } from '../services/menu.service';
import { MenuItem, Menu } from '../types';

const MenuItemManagementPage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuItemsData, menusData] = await Promise.all([getMenuItems(), getMenus()]);
      setItems(menuItemsData);
      setMenus(menusData);
    } catch {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: MenuItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      price: record.price,
      menuId: record.menuId,
      description: record.description,
      imageUrl: record.imageUrl,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await updateMenuItem(editingItem.id, values);
        message.success('Item updated');
      } else {
        await createMenuItem(values);
        message.success('Item created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      message.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMenuItem(id);
      message.success('Item deleted');
      fetchData();
    } catch {
      message.error('Failed to delete item');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (val: number) => `$${val.toFixed(2)}`,
    },
    {
      title: 'Category',
      key: 'menu',
      render: (_: any, record: MenuItem) => {
        const menu = menus.find((m) => m.id === record.menuId);
        return menu?.name || record.menuId;
      },
    },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: MenuItem) => (
        <Space>
          <Button onClick={() => handleOpenEdit(record)}>Edit</Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>Menu Items</h2>
      <Button type="primary" onClick={handleOpenCreate} style={{ marginBottom: 16 }}>
        Add Item
      </Button>
      <Table dataSource={items} columns={columns} rowKey="id" loading={loading} />
      <Modal
        title={editingItem ? 'Edit Item' : 'New Item'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="menuId"
            label="Category"
            rules={[{ required: true, message: 'Select category' }]}
          >
            <Select placeholder="Select category">
              {menus.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image URL">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuItemManagementPage;
