export const REGION_KANAGAWA = 'kanagawa';
export const REGION_YOKOHAMA = 'yokohama';

export const KANAGAWA_CODES = [
  '14100', '14130', '14150', '14201', '14203', '14204', '14205', '14206', '14207',
  '14208', '14210', '14211', '14212', '14213', '14214', '14215', '14216', '14217',
  '14218', '14301', '14321', '14341', '14342', '14361', '14362', '14363', '14364',
  '14366', '14382', '14383', '14384', '14401', '14402',
];

export const YOKOHAMA_WARD_CODES = [
  '14101', '14102', '14103', '14104', '14105', '14106', '14107', '14108', '14109',
  '14110', '14111', '14112', '14113', '14114', '14115', '14116', '14117', '14118',
];

export const PLAY_MODES: { id: string; label: string; codes: string[]; dataset: 'municipalities' | 'wards' }[] = [
  { id: REGION_KANAGAWA, label: '神奈川県（33市町村）', codes: KANAGAWA_CODES, dataset: 'municipalities' },
  { id: REGION_YOKOHAMA, label: '横浜市（18区）', codes: YOKOHAMA_WARD_CODES, dataset: 'wards' },
];
