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
  fetchMenus,
  fetchMenu,
  createMenu,
  updateMenu,
  deleteMenu,
} from './menu.service';

describe('menu.service', () => {
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

  it('fetchMenus calls GET /menus', async () => {
    const expected = [
      { id: '1', name: 'Coffee', description: 'Hot drinks', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: '2', name: 'Food', description: 'Snacks', createdAt: '2024-01-01T00:00:00.000Z' },
    ];
    mockGet.mockResolvedValue(expected);

    const result = await fetchMenus();

    expect(mockGet).toHaveBeenCalledWith('/menus');
    expect(result).toEqual(expected);
  });

  it('fetchMenu calls GET /menus/:id', async () => {
    const expected = { id: '1', name: 'Coffee', description: 'Hot drinks', createdAt: '2024-01-01T00:00:00.000Z' };
    mockGet.mockResolvedValue(expected);

    const result = await fetchMenu('1');

    expect(mockGet).toHaveBeenCalledWith('/menus/1');
    expect(result).toEqual(expected);
  });

  it('createMenu calls POST /menus with dto', async () => {
    const dto = { name: 'Desserts', description: 'Sweet treats' };
    const expected = { id: '3', ...dto, createdAt: '2024-01-01T00:00:00.000Z' };
    mockPost.mockResolvedValue(expected);

    const result = await createMenu(dto);

    expect(mockPost).toHaveBeenCalledWith('/menus', dto);
    expect(result).toEqual(expected);
  });

  it('updateMenu calls PATCH /menus/:id with dto', async () => {
    const dto = { description: 'Updated description' };
    const expected = { id: '1', name: 'Coffee', description: 'Updated description', createdAt: '2024-01-01T00:00:00.000Z' };
    mockPatch.mockResolvedValue(expected);

    const result = await updateMenu('1', dto);

    expect(mockPatch).toHaveBeenCalledWith('/menus/1', dto);
    expect(result).toEqual(expected);
  });

  it('deleteMenu calls DELETE /menus/:id', async () => {
    mockDel.mockResolvedValue(undefined);

    await deleteMenu('1');

    expect(mockDel).toHaveBeenCalledWith('/menus/1');
  });
});