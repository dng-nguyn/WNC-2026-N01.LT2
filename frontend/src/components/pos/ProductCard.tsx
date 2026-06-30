import type { MenuItem } from '../../types';

interface ProductCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(n);

export default function ProductCard({ item, onAdd }: ProductCardProps) {
  return (
    <button
      className="product-card"
      onClick={() => onAdd(item)}
      disabled={!item.isAvailable}
    >
      <span className="product-card-name">{item.name}</span>
      <span className="product-card-category">{item.menu.name}</span>
      <span className="product-card-price-pill">
        {formatCurrency(Number(item.price))}
      </span>
      {!item.isAvailable && (
        <span className="product-card-unavailable">Unavailable</span>
      )}
    </button>
  );
}
