/** 選手の登録ポジション（括り） */
export const PLAYER_POSITIONS = ['投手', '捕手', '内野手', '外野手'];

const LEGACY_POSITION_MAP = {
  一塁手: '内野手',
  二塁手: '内野手',
  三塁手: '内野手',
  遊撃手: '内野手',
  指名打者: '',
};

/** 旧ポジション名を現在の括りに変換（表示・編集フォーム用） */
export function normalizePosition(position) {
  if (!position) return '';
  if (PLAYER_POSITIONS.includes(position)) return position;
  return LEGACY_POSITION_MAP[position] ?? position;
}

export function isValidPlayerPosition(position) {
  return position === '' || PLAYER_POSITIONS.includes(position);
}
