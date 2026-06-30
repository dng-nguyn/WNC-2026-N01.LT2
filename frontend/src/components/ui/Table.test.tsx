import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Table from './Table';

interface TestItem {
  id: string;
  name: string;
  age: number;
}

const columns = [
  { key: 'name', header: 'Name', render: (item: TestItem) => item.name },
  { key: 'age', header: 'Age', render: (item: TestItem) => item.age },
];

const data: TestItem[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
];

describe('Table', () => {
  it('renders table headers', () => {
    render(<Table columns={columns} data={data} keyExtractor={(i) => i.id} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<Table columns={columns} data={data} keyExtractor={(i) => i.id} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(<Table columns={columns} data={[]} keyExtractor={(i) => i.id} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Table columns={columns} data={data} keyExtractor={(i) => i.id} className="custom-table" />);
    expect(container.querySelector('table')).toHaveClass('custom-table');
  });
});
