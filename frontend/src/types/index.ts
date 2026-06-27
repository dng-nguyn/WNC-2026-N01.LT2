export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Menu {
  id: string;
  name: string;
  description?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  menuId: string;   // category id
  menu?: Menu;      // optional full category object
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  tableId?: string;
  table?: { id: string; tableNumber: string };
  items: OrderItem[];
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Table {
  id: string;
  tableNumber: string;
  status: string;
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeTables: number;
  pendingOrders: number;
}
