/**
 * The world's own colours (Creative Direction V2). They do not follow the dark / light
 * setting: the farm is always in daylight. Outlines are a warm dark brown rather than
 * black, as in hand-inked cel animation.
 *
 * TEMPORARY: chosen for the prototype's mood, to be replaced by the art direction's palette.
 */
export const W = {
  ink: '#2B2118',

  skyTop: '#2F7FD3',
  skyHigh: '#4F9EE6',
  skyMid: '#8CC8F2',
  skyLow: '#CDEBF8',
  haze: '#EAF6EE',

  sun: '#FFF7CF',
  sunGlow: '#FFE38A',

  cloud: '#FFFFFF',
  cloudShade: '#D3E2F4',
  cloudEdge: '#A9C0DE',

  hillFar: '#9AD3A8',
  hillFarShade: '#83C097',
  treeFar: '#5FA77A',
  hillNear: '#63B85E',
  hillNearShade: '#4E9F4D',

  grass: '#5DBB48',
  grassLight: '#86D766',
  grassDark: '#3F983A',
  grassEdge: '#2D6F2C',

  flowerWhite: '#FFFDF2',
  flowerYellow: '#FFD23F',
  flowerPink: '#FF8FB1',

  soilTop: '#6E4127',
  soil: '#5A341E',
  soilDeep: '#432615',
  soilDeepest: '#2C180D',
  humus: '#3E2414',
  pebble: '#8C6649',
  pebbleLight: '#A88264',
  pebbleDark: '#3A2214',

  root: '#FFFDF4',
  rootShade: '#D9C8B2',
  rootGlow: '#FFF6D6',
  rootFaint: 'rgba(255, 238, 214, 0.16)',

  wood: '#B97A47',
  woodLight: '#D9A06A',
  woodDark: '#80502D',
  awning: '#E5574A',
  awningShade: '#C2443A',
  awningCream: '#FFF3DC',
  fence: '#EEDDBF',
  fenceShade: '#C8B08A',

  trunk: '#8E5C3B',
  trunkShade: '#6A4028',
  trunkLine: '#4E2E1B',
  leaf: '#2FB89B',
  leafShade: '#1E8E7B',
  leafLight: '#7DE6CB',
  leafEdge: '#14594C',
  bell: '#C9A8F4',
  bellShade: '#9C7AD8',
  bellEdge: '#5E4392',
  fruit: '#FFC93C',
  fruitShade: '#E7951B',
  fruitEdge: '#9A5A0C',
  fruitGlow: '#FFF0A8',
  seed: '#C98B4B',
  seedShade: '#8E5A2A',

  card: '#FFFBF0',
  cardInk: '#2B2118',
  cardSoft: '#6E5C4B',
  cardLine: '#E8DCC6',
  gold: '#F2A900',
  goldSoft: '#FFE7A3',
  chip: 'rgba(255, 252, 242, 0.88)',
  chipInk: '#3B2E22',
  soilChip: 'rgba(30, 16, 8, 0.62)',
  soilInk: '#FFF3DE',
} as const;
