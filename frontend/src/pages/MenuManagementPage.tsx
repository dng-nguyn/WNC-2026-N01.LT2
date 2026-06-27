import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { getMenus, createMenu, updateMenu, deleteMenu } from '../services/menu.service';
import { Menu } from '../types';

const MenuManagementPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [form] = Form.useForm();

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const data = await getMenus();
      setMenus(data);
    } catch {
      message.error('Failed to load menus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleOpenCreate = () => {
    setEditingMenu(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: Menu) => {
    setEditingMenu(record);
    form.setFieldsValue({ name: record.name, description: record.description });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingMenu) {
        await updateMenu(editingMenu.id, values);
        message.success('Menu updated');
      } else {
        await createMenu(values);
        message.success('Menu created');
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch {
      message.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMenu(id);
      message.success('Menu deleted');
      fetchMenus();
    } catch {
      message.error('Failed to delete menu');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Menu) => (
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
      <h2>Menu Categories</h2>
      <Button type="primary" onClick={handleOpenCreate} style={{ marginBottom: 16 }}>
        Add Category
      </Button>
      <Table dataSource={menus} columns={columns} rowKey="id" loading={loading} />
      <Modal
        title={editingMenu ? 'Edit Category' : 'New Category'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MenuManagementPage;
