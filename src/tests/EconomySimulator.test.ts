import { describe, it, expect } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { DataRegistry } from '@/data/DataRegistry';
import { EconomySimulator } from '@/simulation/EconomySimulator';

describe('EconomySimulator', () => {
  it('keeps prices within bounds', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject({
      goods: [
        { id: 'fish', name: 'Fish', basePrice: 10, seasonalMods: { spring: 1, summer: 1, autumn: 1, winter: 1 } },
      ],
    });
    const econ = new EconomySimulator(bus, data);
    econ.init();
    for (let i = 0; i < 30; i++) {
      econ.updatePrices('spring');
      econ.applyPlayerPurchase('fish', 5);
    }
    const price = econ.getPrice('fish');
    expect(price).toBeGreaterThanOrEqual(2.5);
    expect(price).toBeLessThanOrEqual(40);
  });
});
