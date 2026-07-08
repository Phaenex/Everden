export interface DiceDuelParticipant {
  id: string;
  name: string;
  speciesId: string;
  isEnemy: boolean;
}

/** Shared payload for combat + dialogue duel popups. */
export interface DiceDuelEvent {
  label: string;
  actor: DiceDuelParticipant;
  target?: DiceDuelParticipant;
  natural: number;
  rolls: number[];
  modifier: number;
  total: number;
  dc: number;
  outcome: 'crit' | 'hit' | 'miss' | 'fumble' | 'success' | 'fail';
}
