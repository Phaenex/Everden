/** New-game preferences chosen in the character creator Settings tab. */
export interface CreatorSettings {
  /** Skip the 3-line opening narration on Causeway. */
  skipOpeningNarration: boolean;
  /** Show click/E/journal hint toasts after the opening beat. */
  showControlHints: boolean;
}

export function defaultCreatorSettings(): CreatorSettings {
  return {
    skipOpeningNarration: false,
    showControlHints: true,
  };
}
