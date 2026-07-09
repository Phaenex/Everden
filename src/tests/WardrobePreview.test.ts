import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { drawSpeciesCardThumbnail, drawVariantThumbnail, patternLabel } from '@/ui/characterCreation/WardrobePreview';
import { defaultAppearance } from '@/gameplay/CharacterAppearance';
import { setSpeciesAppearanceRegistry } from '@/data/SpeciesAppearanceRegistry';

describe('WardrobePreview thumbnails', () => {
  beforeEach(() => {
    setSpeciesAppearanceRegistry({
      frog: {
        playable: true,
        skinRamps: ['#4c7842'],
        eyeRamps: ['#c8e8c0'],
        crestColorRamps: ['#4c7842'],
        patterns: [
          { id: 'moss', label: 'Moss', sheetSuffix: 'p1' },
          { id: 'reed', label: 'Reed', sheetSuffix: 'p2' },
          { id: 'marsh', label: 'Marsh', sheetSuffix: 'p3' },
          { id: 'bog', label: 'Bog', sheetSuffix: 'p4' },
        ],
        crests: [{ id: 'none', label: 'Bare' }],
        markings: ['none'],
        wardrobeSlots: ['hat', 'cloak', 'accessory', 'held'],
      },
      vole: {
        playable: true,
        skinRamps: ['#8a7868'],
        eyeRamps: ['#1a1410'],
        crestColorRamps: ['#8a7868'],
        patterns: [
          { id: 'dust', label: 'Dust', sheetSuffix: 'p1' },
          { id: 'clay', label: 'Clay', sheetSuffix: 'p2' },
          { id: 'hazel', label: 'Hazel', sheetSuffix: 'p3' },
          { id: 'soot', label: 'Soot', sheetSuffix: 'p4' },
        ],
        crests: [{ id: 'none', label: 'Bare' }],
        markings: ['none'],
        wardrobeSlots: ['hat', 'cloak', 'accessory', 'held'],
      },
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      const w = this.width || 72;
      const h = this.height || 72;
      return {
        imageSmoothingEnabled: true,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        drawImage: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
        putImageData: () => {},
      } as unknown as CanvasRenderingContext2D;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('patternLabel returns species palette names', () => {
    expect(patternLabel('frog', 0)).toBe('Moss');
    expect(patternLabel('vole', 3)).toBe('Soot');
  });

  it('each species card thumb gets its own seq (not a shared global winner)', () => {
    const wardrobe: never[] = [];
    const a = drawSpeciesCardThumbnail('frog', false, defaultAppearance(), wardrobe);
    const b = drawSpeciesCardThumbnail('toad', false, defaultAppearance(), wardrobe);
    const c = drawSpeciesCardThumbnail('vole', true, defaultAppearance(), wardrobe);
    expect((a as { __thumbSeq?: number }).__thumbSeq).toBeDefined();
    expect((b as { __thumbSeq?: number }).__thumbSeq).toBeDefined();
    expect((c as { __thumbSeq?: number }).__thumbSeq).toBeDefined();
    expect((a as { __thumbSeq?: number }).__thumbSeq).not.toBe((b as { __thumbSeq?: number }).__thumbSeq);
    expect((b as { __thumbSeq?: number }).__thumbSeq).not.toBe((c as { __thumbSeq?: number }).__thumbSeq);
  });

  it('variant thumbs are isolated per pattern id', () => {
    const wardrobe: never[] = [];
    const thumbs = ['moss', 'reed', 'marsh', 'bog'].map((id) =>
      drawVariantThumbnail('frog', id, defaultAppearance(), wardrobe),
    );
    const seqs = thumbs.map((t) => (t as { __thumbSeq?: number }).__thumbSeq);
    expect(new Set(seqs).size).toBe(4);
  });

  it('folk card thumbs always use that species default palette (not player variant)', () => {
    const wardrobe: never[] = [];
    const app = { ...defaultAppearance(), patternId: 'bog', build: 2 as const, marking: 'stripes' as const };
    const frog = drawSpeciesCardThumbnail('frog', true, app, wardrobe);
    const toad = drawSpeciesCardThumbnail('toad', false, app, wardrobe);
    expect((frog as { __thumbSeq?: number }).__thumbSeq).not.toBe((toad as { __thumbSeq?: number }).__thumbSeq);
  });
});
