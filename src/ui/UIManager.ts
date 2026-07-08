import type { EventBus } from '@/core/EventBus';
import type { InteractableTarget } from '@/gameplay/PlayerController';
import type { CombatLogEntry } from '@/gameplay/CombatManager';
import type { DialogueNode } from '@/data/types';
import { applyArtToImage, drawCharacterCanvas } from '@/presentation/CharacterSprites';
import { DiceDuelOverlay } from '@/presentation/DiceDuelOverlay';
import type { DiceDuelEvent } from '@/gameplay/DiceDuelTypes';

/**
 * DOM overlay: HUD, dialogue, combat log, pause, merchant.
 */
export class UIManager {
  private root: HTMLElement;
  private hud: HTMLElement;
  private prompt: HTMLElement;
  private clockEl: HTMLElement;
  private districtEl: HTMLElement;
  private toastEl: HTMLElement;
  private dialoguePanel: HTMLElement;
  private dialogueText: HTMLElement;
  private dialogueChoices: HTMLElement;
  private combatLog: HTMLElement;
  private pauseMenu: HTMLElement;
  private questEl: HTMLElement;
  private merchantPanel: HTMLElement | null = null;
  private combatPanel!: HTMLElement;
  private combatActions!: HTMLElement;
  private combatStatus!: HTMLElement;
  private paused = false;
  private inCombat = false;
  private journalPanel!: HTMLElement;
  private journalList!: HTMLElement;
  private weatherEl!: HTMLElement;
  private audioBtn!: HTMLElement;
  private playerEl!: HTMLElement;
  private journalOpen = false;
  private getJournalEntries: (() => import('@/gameplay/JournalManager').JournalEntry[]) | null = null;
  private diceOverlay: DiceDuelOverlay;

  constructor(private eventBus: EventBus) {
    this.root = document.getElementById('ui-root')!;
    this.root.innerHTML = '';
    this.hud = this.el('div', 'hud');
    this.clockEl = this.el('div', 'hud-clock', 'Day 1 · Spring · 08:00');
    this.districtEl = this.el('div', 'hud-district', 'Reedwater Causeway');
    this.weatherEl = this.el('div', 'hud-weather', '☀ Clear');
    this.prompt = this.el('div', 'interaction-prompt hidden', '[E] Interact');
    this.questEl = this.el('div', 'quest-tracker', '');
    this.audioBtn = this.el('button', 'hud-audio', '♪');
    this.audioBtn.setAttribute('type', 'button');
    this.audioBtn.setAttribute('aria-label', 'Toggle sound');
    this.toastEl = this.el('div', 'interaction-prompt hidden');
    this.toastEl.style.bottom = '5rem';
    this.dialoguePanel = this.el('div', 'dialogue-panel hidden');
    this.dialogueText = this.el('div', 'dialogue-text', '');
    this.dialogueChoices = this.el('div', 'dialogue-choices');
    this.combatLog = this.el('div', 'combat-log hidden');
    this.combatPanel = this.el('div', 'combat-panel hidden');
    this.combatStatus = this.el('div', 'combat-status', '');
    this.combatActions = this.el('div', 'combat-actions');
    this.combatPanel.append(this.combatStatus, this.combatActions);
    this.pauseMenu = this.el('div', 'pause-menu hidden');
    this.pauseMenu.innerHTML = '<h2>Paused</h2><button id="resume-btn">Resume</button><button id="save-btn">Save</button>';
    this.journalPanel = this.el('div', 'journal-panel hidden');
    this.journalPanel.innerHTML = '<h2>Field Journal</h2><p class="journal-hint">[J] to close</p>';
    this.journalList = this.el('div', 'journal-list');

    this.playerEl = this.el('div', 'hud-player', '');
    this.hud.append(this.playerEl, this.clockEl, this.districtEl, this.weatherEl, this.audioBtn, this.questEl);
    this.dialoguePanel.append(this.dialogueText, this.dialogueChoices);
    // `.interaction-prompt` is `position: absolute; bottom: 2rem` meant to anchor to the
    // viewport. `.hud` is also `position: absolute`, so nesting the prompt inside it made
    // "bottom: 2rem" resolve against the hud's own ~40px-tall box instead of the screen —
    // pushing the prompt off the top of the page. Mount it on `root` directly, like toastEl.
    this.root.append(this.hud, this.prompt, this.toastEl, this.dialoguePanel, this.combatLog, this.combatPanel, this.pauseMenu);
    this.journalPanel.append(this.journalList);
    this.root.append(this.journalPanel);

    document.getElementById('resume-btn')?.addEventListener('click', () => this.setPaused(false));
    document.getElementById('save-btn')?.addEventListener('click', () => this.eventBus.emit('game:save'));

    // Self-contained overlay — mounts on #ui-root and subscribes to combat:dice_duel
    // itself; UIManager also calls show() for dialogue skill checks.
    this.diceOverlay = new DiceDuelOverlay(this.eventBus);
  }

  init(): void {
    this.eventBus.on<InteractableTarget | null>('interaction:nearby', (t) => {
      if (this.inCombat) {
        this.prompt.classList.add('hidden');
        return;
      }
      if (t) {
        const prefix = t.type === 'exit' ? 'Click or [E]' : '[E]';
        this.prompt.textContent = `${prefix} ${t.label}`;
        this.prompt.classList.remove('hidden');
      } else {
        this.prompt.classList.add('hidden');
      }
    });
    this.eventBus.on<{ hour: number; day: number; season?: string }>('time:hour', (p) => {
      const season = p.season ?? 'spring';
      this.clockEl.textContent = `Day ${p.day} · ${season} · ${String(p.hour).padStart(2, '0')}:00`;
    });
    this.eventBus.on<{ entries: CombatLogEntry[] }>('combat:log', ({ entries }) => {
      this.combatLog.classList.remove('hidden');
      this.combatLog.replaceChildren();
      for (const e of entries) {
        const line = document.createElement('div');
        line.className = `log-${e.type}`;
        line.textContent = e.text;
        this.combatLog.append(line);
      }
      this.combatLog.scrollTop = this.combatLog.scrollHeight;
    });
    this.eventBus.on('combat:started', () => {
      this.inCombat = true;
      this.combatPanel.classList.remove('hidden');
      this.prompt.classList.add('hidden');
    });
    this.eventBus.on('combat:ended', () => {
      this.inCombat = false;
      setTimeout(() => {
        this.combatLog.classList.add('hidden');
        this.combatPanel.classList.add('hidden');
      }, 3000);
    });
    this.eventBus.on<{ team: string; actorId: string }>('combat:turn', (p) => {
      this.combatStatus.textContent =
        p.team === 'player' ? 'Your turn' : `Turn: ${p.actorId.replace(/_/g, ' ')}`;
      this.eventBus.emit('ui:combat_refresh', { playerTurn: p.team === 'player' });
    });
    this.eventBus.on<{ questId: string; description: string }>('quest:outcome', (p) => {
      this.showToast(p.description);
    });
    this.eventBus.on<{ questId: string; gold?: number }>('quest:completed', (p) => {
      this.questEl.textContent = `Completed: ${p.questId}`;
      if (p.gold) this.showToast(`+${p.gold} gold`);
    });
    this.eventBus.on<{ questId: string }>('quest:council_ready', () => {
      this.showToast('Council ready — visit the rostrum near Elder Domet.');
    });
    this.eventBus.on<{ questId: string; stage: string; title?: string; stageDescription?: string }>(
      'quest:stage',
      (p) => {
        this.questEl.textContent = `${p.title ?? p.questId}: ${p.stageDescription ?? p.stage}`;
      },
    );
    this.eventBus.on<{ weather: string }>('weather:changed', (p) => {
      const icons: Record<string, string> = { clear: '☀ Clear', rain: '🌧 Rain', fog: '🌫 Fog' };
      this.weatherEl.textContent = icons[p.weather] ?? p.weather;
    });
    this.eventBus.on<{ title: string }>('journal:entry', (p) => {
      this.showToast(`Journal: ${p.title}`);
      if (this.journalOpen) this.refreshJournal();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.setPaused(!this.paused);
      if (e.key === 'j' || e.key === 'J') this.toggleJournal();
    });
  }

  bindJournal(getEntries: () => import('@/gameplay/JournalManager').JournalEntry[]): void {
    this.getJournalEntries = getEntries;
  }

  private toggleJournal(): void {
    if (this.inCombat) return;
    this.journalOpen = !this.journalOpen;
    this.journalPanel.classList.toggle('hidden', !this.journalOpen);
    if (this.journalOpen) this.refreshJournal();
  }

  private refreshJournal(): void {
    if (!this.getJournalEntries) return;
    const entries = this.getJournalEntries();
    this.journalList.replaceChildren();
    if (entries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'journal-empty';
      empty.textContent = 'No discoveries yet. Examine sites and talk to folk.';
      this.journalList.append(empty);
      return;
    }
    for (const e of entries) {
      const card = document.createElement('article');
      card.className = `journal-card journal-${e.category}`;
      const h = document.createElement('h3');
      h.textContent = e.title;
      card.append(h);
      if (e.image) {
        const img = document.createElement('img');
        img.src = e.image;
        img.alt = e.title;
        img.onerror = () => img.remove();
        card.append(img);
      }
      const p = document.createElement('p');
      p.textContent = e.body;
      card.append(p);
      this.journalList.append(card);
    }
  }

  /** Wires the HUD mute toggle. `isMuted` is read fresh on each click to stay in sync. */
  bindAudioToggle(isMuted: () => boolean, onToggle: () => void): void {
    const render = () => {
      this.audioBtn.textContent = isMuted() ? '♪ Off' : '♪ On';
      this.audioBtn.classList.toggle('muted', isMuted());
    };
    this.audioBtn.addEventListener('click', () => {
      onToggle();
      render();
    });
    render();
  }

  /** Build attack / ability / flee / diplomacy buttons for player turn. */
  bindCombatActions(
    getAbilities: () => { id: string; name: string }[],
    getEnemies: () => { id: string; name: string }[],
    onAttack: (targetId: string) => void,
    onAbility: (abilityId: string, targetId?: string) => void,
    onFlee: () => void,
    canDiplomacy?: () => boolean,
    onDiplomacy?: (mode: 'persuade' | 'intimidate') => void,
  ): void {
    const render = (playerTurn: boolean) => {
      this.combatActions.replaceChildren();
      if (!playerTurn) return;

      if (canDiplomacy?.()) {
        const persuade = document.createElement('button');
        persuade.textContent = 'Persuade (CHA)';
        persuade.onclick = () => onDiplomacy?.('persuade');
        this.combatActions.append(persuade);

        const intimidate = document.createElement('button');
        intimidate.textContent = 'Intimidate (STR)';
        intimidate.onclick = () => onDiplomacy?.('intimidate');
        this.combatActions.append(intimidate);
      }

      const enemies = getEnemies();
      for (const enemy of enemies) {
        const atk = document.createElement('button');
        atk.textContent = `Attack ${enemy.name}`;
        atk.onclick = () => onAttack(enemy.id);
        this.combatActions.append(atk);
      }

      const firstEnemy = enemies[0];
      for (const ab of getAbilities()) {
        const btn = document.createElement('button');
        btn.textContent = ab.name;
        btn.onclick = () => onAbility(ab.id, firstEnemy?.id);
        this.combatActions.append(btn);
      }

      const flee = document.createElement('button');
      flee.textContent = 'Flee';
      flee.onclick = onFlee;
      this.combatActions.append(flee);
    };

    this.eventBus.on<{ playerTurn: boolean }>('ui:combat_refresh', ({ playerTurn }) => render(playerTurn));
  }

  showDialogue(
    node: DialogueNode,
    onChoice: (nextId: string) => void,
    species?: string,
    onSkillCheck?: (check: NonNullable<import('@/data/types').DialogueChoice['skillCheck']>) => import('@/gameplay/SkillCheckResolver').SkillCheckResult,
    npcId?: string,
    playerSpecies?: string,
  ): void {
    this.eventBus.emit('dialogue:opened', {});
    this.dialoguePanel.classList.remove('hidden');
    this.dialogueText.replaceChildren();

    if (species) {
      const row = document.createElement('div');
      row.className = 'speaker-row';
      const img = document.createElement('img');
      img.className = 'dialogue-portrait';
      img.src = drawCharacterCanvas(species, 0).toDataURL();
      img.alt = node.speaker;
      applyArtToImage(img, species, npcId);
      const strong = document.createElement('strong');
      strong.textContent = node.speaker;
      row.append(img, strong);
      this.dialogueText.append(row);
    } else {
      const strong = document.createElement('strong');
      strong.textContent = node.speaker;
      this.dialogueText.append(strong);
    }

    const p = document.createElement('p');
    p.textContent = node.text;
    this.dialogueText.append(p);

    this.dialogueChoices.replaceChildren();
    if (node.choices) {
      for (const c of node.choices) {
        const btn = document.createElement('button');
        const checkHint = c.skillCheck ? ` [${c.skillCheck.label ?? c.skillCheck.stat} DC ${c.skillCheck.dc}]` : '';
        btn.textContent = c.text + checkHint;
        btn.onclick = async () => {
          if (c.skillCheck && onSkillCheck) {
            const result = onSkillCheck(c.skillCheck);
            const speakerName = node.speaker.split(' · ')[0] ?? node.speaker;
            const outcome: DiceDuelEvent['outcome'] =
              result.natural === 20
                ? 'crit'
                : result.natural === 1
                  ? 'fumble'
                  : result.success
                    ? 'success'
                    : 'fail';
            await this.diceOverlay.show({
              label: result.label,
              actor: {
                id: 'player',
                name: 'You',
                speciesId: playerSpecies ?? 'frog',
                isEnemy: false,
              },
              target: species
                ? {
                    id: npcId ?? 'npc',
                    name: speakerName,
                    speciesId: species,
                    isEnemy: false,
                  }
                : undefined,
              natural: result.natural,
              rolls: [result.natural],
              modifier: result.modifier,
              total: result.total,
              dc: result.dc,
              outcome,
            });
            this.dialogueChoices.replaceChildren();
            const cont = document.createElement('button');
            cont.textContent = result.success ? 'Continue' : 'Continue anyway';
            cont.onclick = () => {
              if (c.next === 'end' || (!result.success && (c.failNext ?? 'end') === 'end')) this.hideDialogue();
              else onChoice(result.success ? c.next : (c.failNext ?? 'end'));
            };
            this.dialogueChoices.append(cont);
            return;
          }
          if (c.next === 'end') this.hideDialogue();
          else onChoice(c.next);
        };
        this.dialogueChoices.append(btn);
      }
    } else {
      const btn = document.createElement('button');
      btn.textContent = 'Continue';
      btn.onclick = () => this.hideDialogue();
      this.dialogueChoices.append(btn);
    }
  }

  showMerchant(name: string, itemIds: string[], onBuy: (id: string) => void): void {
    this.hideMerchant();
    this.merchantPanel = this.el('div', 'merchant-panel');
    const h3 = document.createElement('h3');
    h3.textContent = name;
    this.merchantPanel.append(h3);
    for (const id of itemIds) {
      const btn = document.createElement('button');
      btn.className = 'merchant-item';
      const icon = document.createElement('img');
      icon.className = 'merchant-icon';
      icon.alt = '';
      icon.src = `/assets/items/${id}.png`;
      icon.onerror = () => icon.remove();
      const label = document.createElement('span');
      label.textContent = `Buy ${id.replace(/_/g, ' ')}`;
      btn.append(icon, label);
      btn.onclick = () => onBuy(id);
      this.merchantPanel.append(btn);
    }
    const close = document.createElement('button');
    close.textContent = 'Close';
    close.onclick = () => this.hideMerchant();
    this.merchantPanel.append(close);
    this.root.append(this.merchantPanel);
  }

  hideMerchant(): void {
    this.merchantPanel?.remove();
    this.merchantPanel = null;
  }

  showToast(msg: string, durationMs = 2000): void {
    this.toastEl.textContent = msg;
    this.toastEl.classList.remove('hidden');
    this.eventBus.emit('ui:toast', {});
    setTimeout(() => this.toastEl.classList.add('hidden'), durationMs);
  }

  hideDialogue(): void {
    this.dialoguePanel.classList.add('hidden');
    this.eventBus.emit('dialogue:closed', {});
  }

  /**
   * Skippable multi-line narration for scripted beats (new-game opening). Reuses the
   * dialogue panel — no speaker portrait — so it locks player movement/interaction via
   * the same `dialogue:opened`/`dialogue:closed` events `PlayerController` already listens
   * for, and any real dialogue that opens afterward just overwrites the content normally.
   */
  showNarration(lines: string[], onDone: () => void): void {
    if (lines.length === 0) {
      onDone();
      return;
    }
    this.eventBus.emit('dialogue:opened', {});
    this.dialoguePanel.classList.remove('hidden');
    let idx = 0;
    const renderLine = () => {
      this.dialogueText.replaceChildren();
      const p = document.createElement('p');
      p.textContent = lines[idx]!;
      this.dialogueText.append(p);

      this.dialogueChoices.replaceChildren();
      const btn = document.createElement('button');
      const isLast = idx === lines.length - 1;
      btn.textContent = isLast ? 'Begin' : 'Continue';
      btn.onclick = () => {
        idx++;
        if (idx >= lines.length) {
          this.hideDialogue();
          onDone();
        } else {
          renderLine();
        }
      };
      this.dialogueChoices.append(btn);
    };
    renderLine();
  }

  /** Blocking yes/no prompt — used before anything irreversible (starting a fight). */
  showConfirm(speaker: string, text: string, confirmLabel: string, cancelLabel: string, onConfirm: () => void): void {
    this.eventBus.emit('dialogue:opened', {});
    this.dialoguePanel.classList.remove('hidden');
    this.dialogueText.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = speaker;
    const p = document.createElement('p');
    p.textContent = text;
    this.dialogueText.append(strong, p);

    this.dialogueChoices.replaceChildren();
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmLabel;
    confirmBtn.onclick = () => {
      this.hideDialogue();
      onConfirm();
    };
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = cancelLabel;
    cancelBtn.onclick = () => this.hideDialogue();
    this.dialogueChoices.append(confirmBtn, cancelBtn);
  }

  setDistrictName(name: string): void {
    this.districtEl.textContent = name;
  }

  setPlayerLabel(name: string, speciesId: string): void {
    const species =
      speciesId.charAt(0).toUpperCase() + speciesId.slice(1).replace(/_/g, ' ');
    const display = name.trim() && name !== 'Traveler' ? `${name} · ${species}` : species;
    this.playerEl.textContent = display;
  }

  setPaused(p: boolean): void {
    this.paused = p;
    this.pauseMenu.classList.toggle('hidden', !p);
    this.eventBus.emit('game:pause', { paused: p });
  }

  private el(tag: string, className: string, text = ''): HTMLElement {
    const e = document.createElement(tag);
    e.className = className;
    if (text) e.textContent = text;
    return e;
  }
}
