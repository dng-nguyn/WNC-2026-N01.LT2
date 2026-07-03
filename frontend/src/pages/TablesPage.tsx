import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchActiveOrders, updateOrder } from '../services/order.service';
import { PaymentModal } from '../components/payment';
import { Alert } from '../components/ui';
import { OrderStatus, type Order } from '../types';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n);

const formatTime = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

interface TableGroup {
  tableId: string;
  tableNumber: string;
  orders: Order[];
  totalAmount: number;
  totalItems: number;
}

export default function TablesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [splitTables, setSplitTables] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await fetchActiveOrders();
      setOrders(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  const tableGroups = useMemo((): TableGroup[] => {
    const grouped = new Map<string, TableGroup>();
    for (const order of orders) {
      if (!order.table) continue;
      const key = order.table.id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          tableId: key,
          tableNumber: order.table.tableNumber,
          orders: [],
          totalAmount: 0,
          totalItems: 0,
        });
      }
      const group = grouped.get(key)!;
      group.orders.push(order);
      group.totalAmount += Number(order.totalAmount);
      group.totalItems += order.items.reduce((s, i) => s + i.quantity, 0);
    }
    return Array.from(grouped.values());
  }, [orders]);

  const selectedGroup = useMemo(
    () => tableGroups.find((g) => g.tableId === selectedTableId) ?? null,
    [tableGroups, selectedTableId],
  );

  const selectedOrder = useMemo(
    () => selectedGroup?.orders.find((o) => o.id === selectedOrderId) ?? null,
    [selectedGroup, selectedOrderId],
  );

  const isSplit = selectedTableId ? (splitTables[selectedTableId] ?? false) : false;

  const consolidatedItems = useMemo(() => {
    if (!selectedGroup) return [];
    const merged = new Map<string, { name: string; quantity: number; price: number }>();
    for (const order of selectedGroup.orders) {
      for (const item of order.items) {
        const key = item.menuItem.id;
        if (merged.has(key)) {
          merged.get(key)!.quantity += item.quantity;
        } else {
          merged.set(key, {
            name: item.menuItem.name,
            quantity: item.quantity,
            price: Number(item.price),
          });
        }
      }
    }
    return Array.from(merged.values());
  }, [selectedGroup]);

  async function handleCompleteTable() {
    if (!selectedGroup) return;
    try {
      await Promise.all(
        selectedGroup.orders.map((o) =>
          updateOrder(o.id, { status: OrderStatus.COMPLETED }),
        ),
      );
      setOrders((prev) =>
        prev.filter((o) => !selectedGroup.orders.some((so) => so.id === o.id)),
      );
      setSelectedTableId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete orders');
    }
  }

  async function handleCompleteOrder(orderId: string) {
    try {
      await updateOrder(orderId, { status: OrderStatus.COMPLETED });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setSelectedOrderId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete order');
    }
  }

  function handlePaymentSuccess() {
    if (isSplit && selectedOrder) {
      handleCompleteOrder(selectedOrder.id);
    } else if (selectedGroup) {
      handleCompleteTable();
    }
    setShowPayment(false);
  }

  function handleSelectTable(tableId: string) {
    setSelectedTableId(tableId);
    setSelectedOrderId(null);
  }

  function toggleSplit(tableId: string) {
    setSplitTables((prev) => ({ ...prev, [tableId]: !(prev[tableId] ?? false) }));
    setSelectedOrderId(null);
  }

  const payOrderId = isSplit ? selectedOrderId : selectedGroup?.orders[0]?.id;
  const payOrderTotal = isSplit
    ? selectedOrder ? Number(selectedOrder.totalAmount) : 0
    : selectedGroup?.totalAmount ?? 0;

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading tables…</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Tables</h1>
        </div>
        <button className="btn btn-secondary" onClick={loadOrders}>
          Refresh
        </button>
      </header>

      {error && (
        <Alert variant="error" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {tableGroups.length === 0 ? (
        <div className="tables-empty">
          <p className="text-muted">No active orders on any table.</p>
          <button className="btn btn-primary" onClick={() => navigate('/pos')}>
            Go to POS
          </button>
        </div>
      ) : (
        <div className="tables-grid">
          {tableGroups.map((group) => (
            <div
              key={group.tableId}
              className={`table-card ${selectedTableId === group.tableId ? 'table-card--selected' : ''}`}
              onClick={() => handleSelectTable(group.tableId)}
            >
              <div className="table-card-header">
                <h3>{group.tableNumber}</h3>
                <span className="badge badge-info">
                  {group.totalItems} item{group.totalItems !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="table-card-orders">
                <div className="table-order-row">
                  <div className="table-order-info">
                    <span className="table-order-amount">
                      {formatCurrency(group.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedTableId && selectedGroup && !showPayment && (
        <div className="order-detail-panel">
          <div className="order-detail-header">
            <h3>{selectedGroup.tableNumber}</h3>
            <button
              className="modal-close"
              onClick={() => {
                setSelectedTableId(null);
                setSelectedOrderId(null);
              }}
            >
              ×
            </button>
          </div>

          {/* Split toggle */}
          <div className="order-detail-controls">
            <label className="cart-takeout-toggle" style={{ marginBottom: 0 }}>
              <input
                type="checkbox"
                checked={isSplit}
                onChange={() => toggleSplit(selectedTableId)}
              />
              Split orders
            </label>
          </div>

          {isSplit ? (
            <>
              {/* Split view — individual order rows */}
              <div className="order-detail-orders">
                {selectedGroup.orders.map((order) => (
                  <div
                    key={order.id}
                    className={`table-order-row ${selectedOrderId === order.id ? 'table-order-row--selected' : ''}`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="table-order-info">
                      <span className="table-order-time">
                        {formatTime(order.createdAt)}
                      </span>
                      <span className="table-order-count">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </span>
                      <span className="table-order-amount">
                        {formatCurrency(Number(order.totalAmount))}
                      </span>
                    </div>
                    <span className={`table-order-status table-order-status--${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Selected order detail */}
              {selectedOrder && (
                <>
                  <div className="order-detail-meta">
                    <span>Order at {formatTime(selectedOrder.createdAt)}</span>
                    <span className={`table-order-status table-order-status--${selectedOrder.status.toLowerCase()}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="order-detail-items">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="order-detail-item">
                        <span className="order-detail-item-name">
                          {item.quantity}× {item.menuItem.name}
                        </span>
                        <span className="order-detail-item-price">
                          {formatCurrency(item.quantity * Number(item.price))}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="order-detail-total">
                    <span>Total</span>
                    <span className="order-detail-total-amount">
                      {formatCurrency(Number(selectedOrder.totalAmount))}
                    </span>
                  </div>
                  <div className="order-detail-actions">
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => setShowPayment(true)}
                    >
                      Pay {formatCurrency(Number(selectedOrder.totalAmount))}
                    </button>
                    <button
                      className="btn btn-secondary btn-block"
                      onClick={() => handleCompleteOrder(selectedOrder.id)}
                    >
                      Mark as Completed
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Consolidated view */}
              <div className="order-detail-meta">
                <span>{selectedGroup.orders.length} order{selectedGroup.orders.length !== 1 ? 's' : ''}</span>
                <span>{selectedGroup.totalItems} item{selectedGroup.totalItems !== 1 ? 's' : ''}</span>
              </div>
              <div className="order-detail-items">
                {consolidatedItems.map((item, i) => (
                  <div key={i} className="order-detail-item">
                    <span className="order-detail-item-name">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="order-detail-item-price">
                      {formatCurrency(item.quantity * item.price)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="order-detail-total">
                <span>Total</span>
                <span className="order-detail-total-amount">
                  {formatCurrency(selectedGroup.totalAmount)}
                </span>
              </div>
              <div className="order-detail-actions">
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => setShowPayment(true)}
                >
                  Pay {formatCurrency(selectedGroup.totalAmount)}
                </button>
                <button
                  className="btn btn-secondary btn-block"
                  onClick={handleCompleteTable}
                >
                  Mark All as Completed
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Payment modal */}
      {showPayment && payOrderId && (
        <PaymentModal
          open
          existingOrderId={payOrderId}
          existingOrderTotal={payOrderTotal}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
