import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { UIManager } from '@/ui/UIManager';

describe('UIManager.showConfirm (regression: combat used to start instantly with no confirmation)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="ui-root"></div>';
  });

  it('shows the confirm text and does not call onConfirm until the confirm button is clicked', () => {
    const ui = new UIManager(new EventBus());
    let confirmed = false;
    ui.showConfirm('Blackfen Poachers', 'This will start a fight.', 'Fight', 'Back away', () => {
      confirmed = true;
    });

    const panel = document.querySelector('.dialogue-panel')!;
    expect(panel.classList.contains('hidden')).toBe(false);
    expect(panel.textContent).toContain('Blackfen Poachers');
    expect(panel.textContent).toContain('This will start a fight.');
    expect(confirmed).toBe(false);
  });

  it('calls onConfirm and closes the panel when the confirm button is clicked', () => {
    const ui = new UIManager(new EventBus());
    let confirmed = false;
    ui.showConfirm('Blackfen Poachers', 'This will start a fight.', 'Fight', 'Back away', () => {
      confirmed = true;
    });

    const buttons = [...document.querySelectorAll('.dialogue-choices button')];
    const fightBtn = buttons.find((b) => b.textContent === 'Fight')!;
    (fightBtn as HTMLButtonElement).click();

    expect(confirmed).toBe(true);
    expect(document.querySelector('.dialogue-panel')!.classList.contains('hidden')).toBe(true);
  });

  it('does not call onConfirm when the cancel button is clicked', () => {
    const ui = new UIManager(new EventBus());
    let confirmed = false;
    ui.showConfirm('Blackfen Poachers', 'This will start a fight.', 'Fight', 'Back away', () => {
      confirmed = true;
    });

    const buttons = [...document.querySelectorAll('.dialogue-choices button')];
    const cancelBtn = buttons.find((b) => b.textContent === 'Back away')!;
    (cancelBtn as HTMLButtonElement).click();

    expect(confirmed).toBe(false);
    expect(document.querySelector('.dialogue-panel')!.classList.contains('hidden')).toBe(true);
  });
});

describe('UIManager.showNarration (new-game opening beat)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="ui-root"></div>';
  });

  it('steps through each line on Continue, locks interaction via dialogue:opened, and only calls onDone + emits dialogue:closed after the last line', () => {
    const bus = new EventBus();
    const opened: unknown[] = [];
    const closed: unknown[] = [];
    bus.on('dialogue:opened', () => opened.push(true));
    bus.on('dialogue:closed', () => closed.push(true));
    const ui = new UIManager(bus);
    let done = false;
    ui.showNarration(['First.', 'Second.', 'Third.'], () => {
      done = true;
    });

    expect(opened).toHaveLength(1);
    const panel = document.querySelector('.dialogue-panel')!;
    expect(panel.classList.contains('hidden')).toBe(false);
    expect(panel.textContent).toContain('First.');

    const clickContinue = () => {
      const buttons = [...document.querySelectorAll('.dialogue-choices button')];
      (buttons[0] as HTMLButtonElement).click();
    };

    clickContinue();
    expect(panel.textContent).toContain('Second.');
    expect(done).toBe(false);
    expect(closed).toHaveLength(0);

    clickContinue();
    expect(panel.textContent).toContain('Third.');
    // last line's button reads "Begin", not "Continue" — signals the sequence is ending
    expect(document.querySelector('.dialogue-choices button')!.textContent).toBe('Begin');

    clickContinue();
    expect(done).toBe(true);
    expect(closed).toHaveLength(1);
    expect(panel.classList.contains('hidden')).toBe(true);
  });

  it('calls onDone immediately without opening the panel when given an empty line list', () => {
    const bus = new EventBus();
    const opened: unknown[] = [];
    bus.on('dialogue:opened', () => opened.push(true));
    const ui = new UIManager(bus);
    let done = false;
    ui.showNarration([], () => {
      done = true;
    });

    expect(done).toBe(true);
    expect(opened).toHaveLength(0);
  });
});

describe('UIManager.showToast custom duration (first-time control hint)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="ui-root"></div>';
  });

  it('respects a longer duration override instead of the default 2s, so a control hint stays readable', () => {
    vi.useFakeTimers();
    const ui = new UIManager(new EventBus());
    ui.showToast('Click to move · [E] to interact · [J] for journal', 6000);

    const toast = document.querySelectorAll('.interaction-prompt')[1]!;
    expect(toast.classList.contains('hidden')).toBe(false);

    vi.advanceTimersByTime(2000);
    expect(toast.classList.contains('hidden')).toBe(false); // still visible past the old default

    vi.advanceTimersByTime(4001);
    expect(toast.classList.contains('hidden')).toBe(true);
    vi.useRealTimers();
  });
});
