import { writable, derived } from 'svelte/store';
import { computeBlock, computeCircle, computeWedge, computeSplinePath } from '../lib/drill-math.ts';
import { fieldToSVG } from '../lib/field-coords.ts';

export { fieldToSVG, computeBlock, computeCircle, computeWedge, computeSplinePath };

// 1. Performer Data Store with explicit unique IDs for Svelte's keyed loops
export const sections = writable([
  { id: 'sec-flutes', name: 'Flutes', count: 0, color: '#ff1744', style: 'dots' },
  { id: 'sec-clarinets', name: 'Clarinets', count: 0, color: '#2979ff', style: 'dots' },
  { id: 'sec-saxophones', name: 'Saxophones', count: 0, color: '#00e676', style: 'dots' },
  { id: 'sec-trumpets', name: 'Trumpets', count: 0, color: '#ffd600', style: 'labels' },
  { id: 'sec-mellos', name: 'Mello', count: 0, color: '#d500f9', style: 'labels' },
  { id: 'sec-trombones', name: 'Trombones', count: 0, color: '#00bfa5', style: 'labels' },
  { id: 'sec-tubas', name: 'Tubas', count: 0, color: '#ff6d00', style: 'labels' }
]);

// Fallback alias for App.svelte
export const S = sections;

// 2. Grid & Step Settings Store
export const formationSettings = writable({
  type: 4,
  cx: 0,
  cy: 0,
  step: 4,
  closed: false
});

// 3. Sidebar Color Palettes Store
export const PRESET_COLORS = [
  ['#ff9100', '#ffd600', '#00e676', '#2979ff', '#d500f9'],
  ['#ff6100', '#ffab00', '#1b5e20', '#0d47a1', '#4a148c']
];

// 4. View Mode Store
export const canvasMode = writable('football');
export const Mode = canvasMode;