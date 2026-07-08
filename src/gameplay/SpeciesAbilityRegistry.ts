import type { DataRegistry } from '@/data/DataRegistry';
import type { AbilityDefinition } from '@/data/types';

/**
 * Maps species ability ids to combat definitions.
 */
export class SpeciesAbilityRegistry {
  private abilities = new Map<string, AbilityDefinition>();

  constructor(private data: DataRegistry) {}

  init(): void {
    for (const ability of this.data.get('abilities')) {
      this.abilities.set(ability.id, ability);
    }
  }

  get(id: string): AbilityDefinition | undefined {
    return this.abilities.get(id);
  }

  forSpecies(speciesId: string): AbilityDefinition[] {
    return this.data.get('abilities').filter((a) => a.species === speciesId);
  }
}
