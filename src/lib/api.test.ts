import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './api';
import { supabase } from './supabase';

// Mock Supabase client
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('API Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch instances', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    const result = await api.getInstances();
    expect(result).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('instances');
  });

  it('should fetch agents', async () => {
    const mockData = [{ id: 'agent-1', name: 'Agent Smith' }];
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    const result = await api.getAgents();
    expect(result).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('agents');
  });

  it('should handle errors when fetching instances', async () => {
    const mockError = { message: 'DB Error' };
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    });

    await expect(api.getInstances()).rejects.toEqual(mockError);
  });
});
