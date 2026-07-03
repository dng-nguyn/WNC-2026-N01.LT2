// ===== Enums =====

export enum UserRole {
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TableStatus {
  EMPTY = 'EMPTY',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
}

// ===== User & Auth =====

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

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    createdAt: string;
  };
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface ProfileResponse {
  message: string;
  user: User;
  session: unknown;
}

// ===== Menu (Category) =====

export interface Menu {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface CreateMenuDto {
  name: string;
  description?: string;
}

export interface UpdateMenuDto {
  name?: string;
  description?: string;
}

// ===== MenuItem (Product) =====

export interface MenuItem {
  id: string;
  menu: Menu;
  name: string;
  price: number;
  isAvailable: boolean;
  createdAt: string;
}

export interface CreateMenuItemDto {
  menuId: string;
  name: string;
  price: number;
  isAvailable?: boolean;
}

export interface UpdateMenuItemDto {
  menuId?: string;
  name?: string;
  price?: number;
  isAvailable?: boolean;
}

// ===== Table =====

export interface Table {
  id: string;
  tableNumber: string;
  status: TableStatus;
  createdAt: string;
}

export interface CreateTableDto {
  tableNumber: string;
}

export interface UpdateTableDto {
  tableNumber?: string;
  status?: TableStatus;
}

// ===== Order & OrderItem =====

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  price: number;
  note: string | null;
}

export interface Order {
  id: string;
  table: Table | null;
  user: User;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemDto {
  menuItemId: string;
  quantity: number;
  note?: string;
}

export interface CreateOrderDto {
  tableId?: string;
  userId: string;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  tableId?: string;
}

// ===== Employee =====

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  salary: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  fullName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  salary?: number;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  salary?: number;
  isActive?: boolean;
}

// ===== Payment =====

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export interface Payment {
  id: string;
  order: Order;
  code: string;
  amount: number;
  status: PaymentStatus;
  qrUrl: string;
  sepayTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ===== Dashboard / Stats types =====

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  topSellingItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

// ===== Transaction =====

export enum VerificationType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export interface Transaction {
  id: string;
  order: Order;
  payment: Payment | null;
  amount: number;
  verificationType: VerificationType;
  verifiedAt: string;
  reverifiedAt: string | null;
  sepayTransactionId: string | null;
  immudbTxId: string | null;
  createdAt: string;
  updatedAt: string;
}
