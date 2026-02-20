import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSortedPostsData } from './posts';
import fs from 'fs';

// Mock the 'fs' module
vi.mock('fs');

// Mock 'path' to ensure consistent behavior if needed,
// though typically mocking 'fs' is enough for this scenario unless path.join is complex
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    join: (...args: string[]) => args.join('/'), // Simple join for testing
  };
});

// Mock 'gray-matter'
vi.mock('gray-matter', () => ({
  default: (fileContents: string) => {
    // Simple parser mock
    const [_, metaString, content] = fileContents.split('---');
    const data = metaString
      .trim()
      .split('\n')
      .reduce((acc: any, line) => {
        const [key, value] = line.split(': ');
        acc[key] = value.replace(/"/g, ''); // Simple cleanup
        return acc;
      }, {});
    return { data, content: content?.trim() || '' };
  },
}));

describe('getSortedPostsData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return empty array if directory does not exist', () => {
    (fs.existsSync as any).mockReturnValue(false);
    const posts = getSortedPostsData();
    expect(posts).toEqual([]);
  });

  it('should return sorted posts', () => {
    (fs.existsSync as any).mockReturnValue(true);
    // Mock readdirSync
    (fs.readdirSync as any).mockReturnValue(['a.md', 'b.md']);

    // Mock readFileSync
    (fs.readFileSync as any).mockImplementation((path: string) => {
      if (path.includes('a.md')) {
        return '---\ntitle: Post A\ndate: 2023-01-01\n---\nContent A';
      }
      if (path.includes('b.md')) {
        return '---\ntitle: Post B\ndate: 2023-01-02\n---\nContent B';
      }
      return '';
    });

    const posts = getSortedPostsData();

    expect(posts).toHaveLength(2);
    // Post B (2023-01-02) should come before Post A (2023-01-01)
    expect(posts[0].id).toBe('b');
    expect(posts[1].id).toBe('a');
    expect(posts[0].title).toBe('Post B');
  });
});
