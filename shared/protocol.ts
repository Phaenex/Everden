/** Wire protocol shared by Colyseus server and browser client. */

export type AnimState = 'idle' | 'walk' | 'emote_wave' | 'emote_sit';

export interface Vec2 {
  x: number;
  z: number;
}

export interface PlayerJoinPayload {
  playerId: string;
  name: string;
  species: string;
  appearanceJson: string;
  sceneId: string;
  partyId?: string;
}

export interface WalkIntentPayload {
  x: number;
  z: number;
  stopRadius?: number;
}

export interface ChatPayload {
  text: string;
}

export interface PartyInvitePayload {
  targetPlayerId: string;
}

export interface SceneTransitionPayload {
  targetScene: string;
  exitId: string;
}

export interface CombatActionPayload {
  action: 'attack' | 'useAbility' | 'flee' | 'diplomacy';
  abilityId?: string;
  targetId?: string;
}

export const NET_EVENTS = {
  WALK: 'walk',
  CHAT: 'chat',
  EMOTE: 'emote',
  PARTY_INVITE: 'party_invite',
  PARTY_JOIN: 'party_join',
  SCENE_TRANSITION: 'scene_transition',
  COMBAT_ACTION: 'combat_action',
} as const;
