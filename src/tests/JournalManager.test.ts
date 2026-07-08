import { describe, it, expect } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { DataRegistry } from '@/data/DataRegistry';
import { JournalManager } from '@/gameplay/JournalManager';

const journalData = {
  journal: [
    {
      id: 'disc_test',
      title: 'Test Discovery',
      body: 'Found something.',
      category: 'discovery' as const,
      trigger: { type: 'examine' as const, target: 'test_site' },
    },
    {
      id: 'quest_test',
      title: 'Quest Done',
      body: 'Finished.',
      category: 'quest' as const,
      trigger: { type: 'quest_complete' as const, target: 'test_quest' },
    },
  ],
};

describe('JournalManager', () => {
  it('unlocks on examine objective', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject(journalData);
    const journal = new JournalManager(bus, data);
    journal.init();

    bus.emit('objective:complete', { type: 'examine', target: 'test_site' });
    expect(journal.getEntries()).toHaveLength(1);
    expect(journal.getEntries()[0]?.id).toBe('disc_test');
  });

  it('persists unlocked entries', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject(journalData);
    const journal = new JournalManager(bus, data);
    journal.init();
    journal.unlock('disc_test');

    const journal2 = new JournalManager(bus, data);
    journal2.deserialize(journal.serialize());
    expect(journal2.getEntries()).toHaveLength(1);
  });

  it('does not duplicate entries', () => {
    const bus = new EventBus();
    const data = new DataRegistry();
    data.loadFromObject(journalData);
    const journal = new JournalManager(bus, data);
    journal.init();

    bus.emit('objective:complete', { type: 'examine', target: 'test_site' });
    bus.emit('objective:complete', { type: 'examine', target: 'test_site' });
    expect(journal.getEntries()).toHaveLength(1);
  });
});
