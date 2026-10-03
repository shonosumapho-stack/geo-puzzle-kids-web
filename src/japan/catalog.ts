export const REGION_EAST = 'east';
export const REGION_WEST = 'west';
export const REGION_NATIONWIDE = 'nationwide';

export const EAST_CODES = [
  '01', '02', '03', '04', '05', '06', '07',
  '08', '09', '10', '11', '12', '13', '14',
  '15', '16', '17', '18', '19', '20', '21', '22', '23',
];

export const WEST_CODES = [
  '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35',
  '36', '37', '38', '39',
  '40', '41', '42', '43', '44', '45', '46', '47',
];

export const PLAY_MODES: { id: string; label: string; codes: string[] }[] = [
  { id: REGION_EAST, label: '東日本', codes: EAST_CODES },
  { id: REGION_WEST, label: '西日本', codes: WEST_CODES },
  { id: REGION_NATIONWIDE, label: '全国', codes: [...EAST_CODES, ...WEST_CODES] },
];
