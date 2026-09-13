import { describe, expect, it } from 'vitest';
import { escapeLikePattern } from './players';

describe('escapeLikePattern', () => {
  it('makes LIKE and PostgREST wildcards literal', () => {
    expect(escapeLikePattern('%')).toBe('\\%');
    expect(escapeLikePattern('%%')).toBe('\\%\\%');
    expect(escapeLikePattern('**')).toBe('\\*\\*');
    expect(escapeLikePattern('d_nk')).toBe('d\\_nk');
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
  });

  it('leaves real player nicks unchanged', () => {
    expect(escapeLikePattern('donk')).toBe('donk');
    expect(escapeLikePattern('m0NESY')).toBe('m0NESY');
    expect(escapeLikePattern('cJ dA K1nG')).toBe('cJ dA K1nG');
  });
});
