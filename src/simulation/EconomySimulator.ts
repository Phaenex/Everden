import type { EventBus } from '@/core/EventBus';
import type { ISaveable } from '@/core/IGameModule';
import type { DataRegistry } from '@/data/DataRegistry';
import type { GoodDefinition } from '@/data/types';
import type { Season } from './WorldClock';

export interface MarketState {
  prices: Record<string, number>;
  supply: Record<string, number>;
  demand: Record<string, number>;
}

const MIN_MULT = 0.25;
const MAX_MULT = 4;

/**
 * Settlement supply/demand economy. Updates daily.
 */
export class EconomySimulator implements ISaveable {
  readonly saveKey = 'economySimulator';
  private prices: Record<string, number> = {};
  private supply: Record<string, number> = {};
  private demand: Record<string, number> = {};

  constructor(
    private eventBus: EventBus,
    private data: DataRegistry,
  ) {}

  init(): void {
    for (const good of this.data.get('goods')) {
      this.prices[good.id] = good.basePrice;
      this.supply[good.id] = 100;
      this.demand[good.id] = 100;
    }
    this.eventBus.on<{ season: Season }>('time:day', ({ season }) => this.updatePrices(season));
  }

  getPrice(goodId: string): number {
    return this.prices[goodId] ?? 0;
  }

  getState(): MarketState {
    return { prices: { ...this.prices }, supply: { ...this.supply }, demand: { ...this.demand } };
  }

  applyPlayerPurchase(goodId: string, qty: number): void {
    this.supply[goodId] = Math.max(0, (this.supply[goodId] ?? 100) - qty);
    this.demand[goodId] = (this.demand[goodId] ?? 100) + qty * 0.5;
    this.clampAndEmit(goodId);
  }

  updatePrices(season: Season): void {
    for (const good of this.data.get('goods')) {
      const seasonal = good.seasonalMods[season] ?? 1;
      const ratio = (this.demand[good.id] ?? 100) / Math.max(1, this.supply[good.id] ?? 100);
      let price = good.basePrice * ratio * seasonal;
      price = Math.max(good.basePrice * MIN_MULT, Math.min(good.basePrice * MAX_MULT, price));
      this.prices[good.id] = Math.round(price * 100) / 100;
      // drift supply/demand toward equilibrium
      this.supply[good.id] = Math.min(150, (this.supply[good.id] ?? 100) + 5);
      this.demand[good.id] = Math.max(50, (this.demand[good.id] ?? 100) - 2);
      this.eventBus.emit('price:changed', { goodId: good.id, price: this.prices[good.id] });
    }
  }

  private clampAndEmit(goodId: string): void {
    const good = this.data.getById<GoodDefinition>('goods', goodId);
    if (!good) return;
    const ratio = this.demand[goodId]! / Math.max(1, this.supply[goodId]!);
    let price = good.basePrice * ratio;
    price = Math.max(good.basePrice * MIN_MULT, Math.min(good.basePrice * MAX_MULT, price));
    this.prices[goodId] = Math.round(price * 100) / 100;
    this.eventBus.emit('price:changed', { goodId, price: this.prices[goodId] });
  }

  serialize(): MarketState {
    return this.getState();
  }

  deserialize(data: unknown): void {
    const state = data as MarketState;
    this.prices = { ...state.prices };
    this.supply = { ...state.supply };
    this.demand = { ...state.demand };
  }
}
