import { WeaponItem, CharacterClassType } from '../types/game';

// Class-specific weapon gacha pools
export const GACHA_POOLS: Record<CharacterClassType, {
  common: WeaponItem[];
  rare: WeaponItem[];
  epic: WeaponItem[];
  legendary: WeaponItem[];
}> = {
  warrior: {
    common: [
      { id: 'g_w_c1', name: '錆びた大剣', slot: 'weapon', description: '使い古されて刃こぼれした両手剣。', rarity: 'common', atkBonus: 6, allowedClasses: ['warrior'] },
      { id: 'g_w_c2', name: '錆びた鉄剣', slot: 'weapon', description: '錆びだらけで少し重い片手剣。', rarity: 'common', atkBonus: 5, allowedClasses: ['warrior', 'rogue'] }
    ],
    rare: [
      { id: 'g_w_r1', name: 'スチールセスタス', slot: 'weapon', description: '鋼鉄で作られた頑丈な片手剣。', rarity: 'rare', atkBonus: 13, allowedClasses: ['warrior', 'rogue'] },
      { id: 'g_w_r2', name: 'バスタードソード', slot: 'weapon', description: '重量感があり、両手・片手どちらでも扱える剣。', rarity: 'rare', atkBonus: 16, allowedClasses: ['warrior'] }
    ],
    epic: [
      { id: 'g_w_e1', name: '魔鉄のバトルアクス', slot: 'weapon', description: '魔力が宿る重厚な戦斧。高い攻撃力を持つ。', rarity: 'epic', atkBonus: 24, allowedClasses: ['warrior'] },
      { id: 'g_w_e2', name: 'ドラゴンブレイカー', slot: 'weapon', description: '竜をも屠る重剣。物理防御も僅かに上昇する。', rarity: 'epic', atkBonus: 28, allowedClasses: ['warrior'] }
    ],
    legendary: [
      { id: 'w_greatsword', name: '神なる大剣 (ラグナロク)', slot: 'weapon', description: '両手で構える超重量の聖剣。圧倒的な攻撃力を誇る。', rarity: 'legendary', atkBonus: 35, allowedClasses: ['warrior'] }
    ]
  },
  mage: {
    common: [
      { id: 'g_m_c1', name: '古ぼけた木の杖', slot: 'weapon', description: 'その辺に落ちていそうな頼りない木の枝。', rarity: 'common', atkBonus: 1, matkBonus: 4, allowedClasses: ['mage', 'cleric'] },
      { id: 'g_m_c2', name: '使い古した魔導書', slot: 'weapon', description: 'インクがかすれて文字が読みにくい魔導入門書。', rarity: 'common', atkBonus: 1, matkBonus: 5, allowedClasses: ['mage'] }
    ],
    rare: [
      { id: 'g_m_r1', name: 'ルーンスタッフ', slot: 'weapon', description: 'ルーン文字が刻まれた、魔力の通りがスムーズな杖。', rarity: 'rare', atkBonus: 2, matkBonus: 12, allowedClasses: ['mage', 'cleric'] },
      { id: 'g_m_r2', name: '賢者の見習い書', slot: 'weapon', description: '初級の攻撃魔法が記された使い勝手の良い魔導書。', rarity: 'rare', atkBonus: 2, matkBonus: 14, allowedClasses: ['mage'] }
    ],
    epic: [
      { id: 'g_m_e1', name: 'エレメンタルワンド', slot: 'weapon', description: '四大属性の魔力を帯びた、攻撃呪文を極限まで強化する杖。', rarity: 'epic', atkBonus: 3, matkBonus: 22, allowedClasses: ['mage'] },
      { id: 'g_m_e2', name: 'クリムゾングリモア', slot: 'weapon', description: '紅蓮の火炎魔術が封印された禁断の魔導書。', rarity: 'epic', atkBonus: 2, matkBonus: 25, allowedClasses: ['mage'] }
    ],
    legendary: [
      { id: 'w_archangel_staff', name: '大天使の聖杖', slot: 'weapon', description: '大天使の祝福を受けた最高級の聖杖。圧倒的な魔力を誇る。', rarity: 'legendary', atkBonus: 4, matkBonus: 32, allowedClasses: ['mage', 'cleric'] }
    ]
  },
  rogue: {
    common: [
      { id: 'g_r_c1', name: '錆びたナイフ', slot: 'weapon', description: '手入れされておらず、切れ味の落ちた小刀。', rarity: 'common', atkBonus: 4, allowedClasses: ['rogue'] },
      { id: 'g_r_c2', name: 'ブロンズナイフ', slot: 'weapon', description: '青銅で作られた安価なナイフ。', rarity: 'common', atkBonus: 6, allowedClasses: ['rogue', 'warrior'] }
    ],
    rare: [
      { id: 'g_r_r1', name: 'アサシンダガー', slot: 'weapon', description: '急所を刺しやすいように薄く尖らせた凶刃。', rarity: 'rare', atkBonus: 14, allowedClasses: ['rogue'] },
      { id: 'g_r_r2', name: 'ハンターボウ', slot: 'weapon', description: '獲物を狩るための強弓。少し離れた位置から急所を狙う。', rarity: 'rare', atkBonus: 12, allowedClasses: ['rogue'] }
    ],
    epic: [
      { id: 'g_r_e1', name: 'シャドウクロー', slot: 'weapon', description: '闇の魔獣の爪から削り出した黒塗りの鉤爪。素早さも大きく上がる。', rarity: 'epic', atkBonus: 20, allowedClasses: ['rogue'] },
      { id: 'g_r_e2', name: 'ウィンドスライサー', slot: 'weapon', description: '風の魔力を纏い、目にも留まらぬ速さで切り刻む双小太刀。', rarity: 'epic', atkBonus: 22, allowedClasses: ['rogue'] }
    ],
    legendary: [
      { id: 'w_dagger', name: '風神の幻弓', slot: 'weapon', description: '風神の息吹が宿る伝説の弓矢。素早さを極限まで高める。', rarity: 'legendary', atkBonus: 28, allowedClasses: ['rogue'] }
    ]
  },
  cleric: {
    common: [
      { id: 'g_c_c1', name: '巡礼者の木槌', slot: 'weapon', description: '旅の僧侶が身を守るために携帯する質素な木製の槌。', rarity: 'common', atkBonus: 4, matkBonus: 2, allowedClasses: ['cleric'] },
      { id: 'g_c_c2', name: 'すり切れた聖書', slot: 'weapon', description: '祈りの言葉が書かれた、ページがボロボロの本。', rarity: 'common', atkBonus: 2, matkBonus: 4, allowedClasses: ['cleric', 'mage'] }
    ],
    rare: [
      { id: 'g_c_r1', name: 'アイアンメイス', slot: 'weapon', description: '頭部に鉄の突起がついた、防御力を打ち砕く鈍器。', rarity: 'rare', atkBonus: 11, matkBonus: 5, allowedClasses: ['cleric'] },
      { id: 'g_c_r2', name: '祝福のクロス', slot: 'weapon', description: '癒やしの魔力を込められた銀の十字架。', rarity: 'rare', atkBonus: 5, matkBonus: 10, allowedClasses: ['cleric'] }
    ],
    epic: [
      { id: 'g_c_e1', name: 'ホーリースパイク', slot: 'weapon', description: '聖水で清められたトゲ付きの金槌。悪魔に大打撃を与える。', rarity: 'epic', atkBonus: 18, matkBonus: 12, allowedClasses: ['cleric'] },
      { id: 'g_c_e2', name: 'ルーメン聖典', slot: 'weapon', description: '天界の言語で書かれた光の教典。魔法防御も向上する。', rarity: 'epic', atkBonus: 6, matkBonus: 20, allowedClasses: ['cleric', 'mage'] }
    ],
    legendary: [
      { id: 'g_c_l1', name: 'セラフィムの輝鎚', slot: 'weapon', description: '熾天使の権能を秘めた黄金のハンマー。圧倒的な威力と回復力。', rarity: 'legendary', atkBonus: 24, matkBonus: 22, allowedClasses: ['cleric'] }
    ]
  }
};

/**
 * Draws a random weapon based on rates:
 * Common: 50%, Rare: 30%, Epic: 15%, Legendary: 5%
 */
export function pullGacha(classType: CharacterClassType): WeaponItem {
  const pool = GACHA_POOLS[classType];
  const rate = Math.random() * 100;
  
  let rarity: 'common' | 'rare' | 'epic' | 'legendary';
  if (rate < 5) {
    rarity = 'legendary';
  } else if (rate < 20) {
    rarity = 'epic';
  } else if (rate < 50) {
    rarity = 'rare';
  } else {
    rarity = 'common';
  }
  
  const weapons = pool[rarity];
  const randomIndex = Math.floor(Math.random() * weapons.length);
  const selectedWeapon = weapons[randomIndex];

  if (!selectedWeapon) {
    // Fallback just in case
    return pool.common[0]!;
  }

  return selectedWeapon;
}
