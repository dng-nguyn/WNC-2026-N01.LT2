interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface TopItemsTableProps {
  items: TopItem[];
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n);

export default function TopItemsTable({ items }: TopItemsTableProps) {
  if (items.length === 0) {
    return <p className="text-muted">No orders yet</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th>Quantity Sold</th>
          <th>Revenue</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={item.name}>
            <td>{i + 1}</td>
            <td>{item.name}</td>
            <td>{item.quantity}</td>
            <td>{formatCurrency(item.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
