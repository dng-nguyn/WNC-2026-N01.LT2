import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDel = vi.fn();

vi.mock('./api', () => ({
  get: (...args: unknown[]) => mockGet(...args),
  post: (...args: unknown[]) => mockPost(...args),
  patch: (...args: unknown[]) => mockPatch(...args),
  del: (...args: unknown[]) => mockDel(...args),
}));

import {
  fetchMenuItems,
  fetchMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from './menuItem.service';

describe('menuItem.service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockGet.mockReset();
    mockPost.mockReset();
    mockPatch.mockReset();
    mockDel.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchMenuItems calls GET /menu-items', async () => {
    const expected = [
      { id: '1', menu: { id: '1', name: 'Coffee', description: '', createdAt: '2024-01-01T00:00:00.000Z' }, name: 'Espresso', price: 3.5, isAvailable: true, createdAt: '2024-01-01T00:00:00.000Z' },
    ];
    mockGet.mockResolvedValue(expected);

    const result = await fetchMenuItems();

    expect(mockGet).toHaveBeenCalledWith('/menu-items');
    expect(result).toEqual(expected);
  });

  it('fetchMenuItem calls GET /menu-items/:id', async () => {
    const expected = { id: '1', menu: { id: '1', name: 'Coffee', description: '', createdAt: '2024-01-01T00:00:00.000Z' }, name: 'Espresso', price: 3.5, isAvailable: true, createdAt: '2024-01-01T00:00:00.000Z' };
    mockGet.mockResolvedValue(expected);

    const result = await fetchMenuItem('1');

    expect(mockGet).toHaveBeenCalledWith('/menu-items/1');
    expect(result).toEqual(expected);
  });

  it('createMenuItem calls POST /menu-items with dto', async () => {
    const dto = { menuId: '1', name: 'Latte', price: 4.5, isAvailable: true };
    const expected = { id: '2', menu: { id: '1', name: 'Coffee', description: '', createdAt: '2024-01-01T00:00:00.000Z' }, ...dto, createdAt: '2024-01-01T00:00:00.000Z' };
    mockPost.mockResolvedValue(expected);

    const result = await createMenuItem(dto);

    expect(mockPost).toHaveBeenCalledWith('/menu-items', dto);
    expect(result).toEqual(expected);
  });

  it('updateMenuItem calls PATCH /menu-items/:id with dto', async () => {
    const dto = { price: 5.0 };
    const expected = { id: '1', menu: { id: '1', name: 'Coffee', description: '', createdAt: '2024-01-01T00:00:00.000Z' }, name: 'Espresso', price: 5.0, isAvailable: true, createdAt: '2024-01-01T00:00:00.000Z' };
    mockPatch.mockResolvedValue(expected);

    const result = await updateMenuItem('1', dto);

    expect(mockPatch).toHaveBeenCalledWith('/menu-items/1', dto);
    expect(result).toEqual(expected);
  });

  it('deleteMenuItem calls DELETE /menu-items/:id', async () => {
    mockDel.mockResolvedValue(undefined);

    await deleteMenuItem('1');

    expect(mockDel).toHaveBeenCalledWith('/menu-items/1');
  });
});