import type { ArrivalMotivation } from '@/gameplay/PlayerProfile';

const SPECIES_OPENING: Record<string, string> = {
  frog: "You came in light — frog folk always do, even when the basin isn't. Rain beads on your skin like it belongs there.",
  toad: 'Toad folk notice what others step over. You smelled the cellar mold before you saw the causeway lanterns.',
  turtle: 'Turtle folk travel heavy and arrive heavier. Your shell still carries the dust of whoever sent you.',
  tortoise: 'Tortoise folk measure time in flood lines, not days. You already know this water has flooded higher before.',
  vole: 'Vole folk slip through crowds the way water slips through reed. Nobody marked your arrival — that suits you.',
};

const MOTIVATION_OPENING: Record<ArrivalMotivation, string> = {
  investigator:
    "Someone upstream wanted answers, not rumors. Lilymarket's cellars are flooding when they shouldn't, the turtle masons swear their levy isn't to blame, and the council votes in seven days.",
  messenger:
    "You're carrying someone else's worry — a letter, a debt, a rumor too heavy to keep. The cellars are flooding, the masons deny their levy, and the council votes in seven days whether to believe them.",
  neighbor:
    "This isn't abstract. Your basin too — cellars flooding, masons swearing it isn't their levy, a council vote in seven days that could drown half the market if they're wrong.",
};

const CLOSING_LINE = 'Lilymarket sits north across the reeds. That seems like the place to start.';

export function getOpeningNarrationLines(species: string, motivation: ArrivalMotivation): string[] {
  return [
    SPECIES_OPENING[species] ?? SPECIES_OPENING.frog!,
    MOTIVATION_OPENING[motivation],
    CLOSING_LINE,
  ];
}

/** 5e ability modifier — same formula as CombatManager.statMod. */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Playable folk on the title screen — must have selectBlurb in species.json. */
export function isPlayableSpecies(species: { selectBlurb?: string }): boolean {
  return Boolean(species.selectBlurb);
}
