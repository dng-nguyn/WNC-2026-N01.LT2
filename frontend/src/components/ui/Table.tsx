import type { ReactNode, TableHTMLAttributes } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data',
  className = '',
  ...rest
}: TableProps<T>) {
  const classes = ['table', className].filter(Boolean).join(' ');

  if (data.length === 0) {
    return (
      <table className={classes} {...rest}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="text-muted">
              {emptyMessage}
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className={classes} {...rest}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={col.className}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={keyExtractor(item)}>
            {columns.map((col) => (
              <td key={col.key} className={col.className}>
                {col.render(item)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
