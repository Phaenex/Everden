import { describe, it, expect } from 'vitest';
import { PartyService } from '../../server/src/services/PartyService.js';

describe('PartyService', () => {
  it('creates and joins parties up to 16 members', () => {
    const svc = new PartyService();
    svc.create('p1', 'leader');
    for (let i = 0; i < 15; i++) {
      expect(svc.join('p1', `m${i}`)).toBe(true);
    }
    expect(svc.join('p1', 'overflow')).toBe(false);
    expect(svc.members('p1').length).toBe(16);
  });

  it('removes members on leave', () => {
    const svc = new PartyService();
    svc.create('p2', 'a');
    svc.join('p2', 'b');
    svc.leave('b');
    expect(svc.members('p2')).toEqual(['a']);
  });
});
