interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
}: CategoryTabsProps) {
  return (
    <div className="category-tabs">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-pill ${
            activeCategory === cat ? 'category-pill--active' : ''
          }`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
