/** In-memory party registry — party members share room instance routing. */
export class PartyService {
  private parties = new Map<string, Set<string>>();
  private memberParty = new Map<string, string>();

  create(partyId: string, leaderId: string): void {
    const set = new Set<string>([leaderId]);
    this.parties.set(partyId, set);
    this.memberParty.set(leaderId, partyId);
  }

  join(partyId: string, playerId: string): boolean {
    const party = this.parties.get(partyId);
    if (!party || party.size >= 16) return false;
    party.add(playerId);
    this.memberParty.set(playerId, partyId);
    return true;
  }

  leave(playerId: string): void {
    const partyId = this.memberParty.get(playerId);
    if (!partyId) return;
    const party = this.parties.get(partyId);
    party?.delete(playerId);
    this.memberParty.delete(playerId);
    if (party && party.size === 0) this.parties.delete(partyId);
  }

  getPartyId(playerId: string): string | undefined {
    return this.memberParty.get(playerId);
  }

  members(partyId: string): string[] {
    return [...(this.parties.get(partyId) ?? [])];
  }
}

export const partyService = new PartyService();
