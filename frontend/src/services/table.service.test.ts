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
  fetchTables,
  fetchTable,
  createTable,
  updateTable,
  deleteTable,
} from './table.service';

describe('table.service', () => {
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

  it('fetchTables calls GET /tables', async () => {
    const expected = [
      { id: '1', tableNumber: 'A1', status: 'EMPTY', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: '2', tableNumber: 'A2', status: 'OCCUPIED', createdAt: '2024-01-01T00:00:00.000Z' },
    ];
    mockGet.mockResolvedValue(expected);

    const result = await fetchTables();

    expect(mockGet).toHaveBeenCalledWith('/tables');
    expect(result).toEqual(expected);
  });

  it('fetchTable calls GET /tables/:id', async () => {
    const expected = { id: '1', tableNumber: 'A1', status: 'EMPTY', createdAt: '2024-01-01T00:00:00.000Z' };
    mockGet.mockResolvedValue(expected);

    const result = await fetchTable('1');

    expect(mockGet).toHaveBeenCalledWith('/tables/1');
    expect(result).toEqual(expected);
  });

  it('createTable calls POST /tables with dto', async () => {
    const dto = { tableNumber: 'A3' };
    const expected = { id: '3', ...dto, status: 'EMPTY', createdAt: '2024-01-01T00:00:00.000Z' };
    mockPost.mockResolvedValue(expected);

    const result = await createTable(dto);

    expect(mockPost).toHaveBeenCalledWith('/tables', dto);
    expect(result).toEqual(expected);
  });

  it('updateTable calls PATCH /tables/:id with dto', async () => {
    const dto = { status: 'OCCUPIED' as const };
    const expected = { id: '1', tableNumber: 'A1', status: 'OCCUPIED', createdAt: '2024-01-01T00:00:00.000Z' };
    mockPatch.mockResolvedValue(expected);

    const result = await updateTable('1', dto);

    expect(mockPatch).toHaveBeenCalledWith('/tables/1', dto);
    expect(result).toEqual(expected);
  });

  it('deleteTable calls DELETE /tables/:id', async () => {
    mockDel.mockResolvedValue(undefined);

    await deleteTable('1');

    expect(mockDel).toHaveBeenCalledWith('/tables/1');
  });
});