import { EquipableItem, CharacterClassType } from '../types/game';

/**
 * All-equipment Gacha Pools divided by rarity.
 * Contains Weapons, Shields, Armors, and Accessories.
 */
export const ALL_EQUIPMENT_GACHA_POOL: Record<'common' | 'rare' | 'epic' | 'legendary', EquipableItem[]> = {
  common: [
    // Weapons
    { id: 'g_w_c1', name: '錆びた大剣', slot: 'weapon', description: '使い古されて刃こぼれした両手剣。', rarity: 'common', atkBonus: 6, allowedClasses: ['warrior'] },
    { id: 'g_w_c2', name: '錆びた鉄剣', slot: 'weapon', description: '錆びだらけで少し重い片手剣。', rarity: 'common', atkBonus: 5, allowedClasses: ['warrior', 'rogue'] },
    { id: 'g_m_c1', name: '古ぼけた木の杖', slot: 'weapon', description: 'その辺に落ちていそうな頼りない木の枝。', rarity: 'common', atkBonus: 1, matkBonus: 4, allowedClasses: ['mage', 'cleric'] },
    { id: 'g_m_c2', name: '使い古した魔導書', slot: 'weapon', description: 'インクがかすれて文字が読みにくい魔導入門書。', rarity: 'common', atkBonus: 1, matkBonus: 5, allowedClasses: ['mage'] },
    { id: 'g_r_c1', name: '錆びたナイフ', slot: 'weapon', description: '手入れされておらず、切れ味の落ちた小刀。', rarity: 'common', atkBonus: 4, allowedClasses: ['rogue'] },
    { id: 'g_c_c1', name: '巡礼者の木槌', slot: 'weapon', description: '旅の僧侶が身を守るために携帯する質素な木製の槌。', rarity: 'common', atkBonus: 4, matkBonus: 2, allowedClasses: ['cleric'] },
    
    // Shields
    { id: 'g_s_c1', name: '木製のスモールシールド', slot: 'shield', description: '軽い板で作られた小盾。ほんの少し攻撃を防ぐ。', rarity: 'common', defBonus: 4 },
    
    // Armors
    { id: 'g_a_c1', name: '旅人の皮ベスト', slot: 'armor', description: '旅人が着用するシンプルな皮の防具。', rarity: 'common', defBonus: 4, hpBonus: 10 },
    { id: 'g_a_c2', name: '見習いの布ローブ', slot: 'armor', description: '魔法学校の生徒が着る質素なローブ。', rarity: 'common', defBonus: 3, hpBonus: 8, allowedClasses: ['mage', 'cleric'] },
    
    // Accessories
    { id: 'g_ac_c1', name: '木彫りのアミュレット', slot: 'accessory', description: '素朴な木彫りのお守り。僅かに体力を高める。', rarity: 'common', hpBonus: 15 }
  ],
  
  rare: [
    // Weapons
    { id: 'g_w_r1', name: 'スチールセスタス', slot: 'weapon', description: '鋼鉄で作られた頑丈な片手剣。', rarity: 'rare', atkBonus: 13, allowedClasses: ['warrior', 'rogue'] },
    { id: 'g_w_r2', name: 'バスタードソード', slot: 'weapon', description: '重量感があり、両手・片手どちらでも扱える剣。', rarity: 'rare', atkBonus: 16, allowedClasses: ['warrior'] },
    { id: 'g_m_r1', name: 'ルーンスタッフ', slot: 'weapon', description: 'ルーン文字が刻まれた、魔力の通りがスムーズな杖。', rarity: 'rare', atkBonus: 2, matkBonus: 12, allowedClasses: ['mage', 'cleric'] },
    { id: 'g_r_r1', name: 'アサシンダガー', slot: 'weapon', description: '急所を刺しやすいように薄く尖らせた凶刃。', rarity: 'rare', atkBonus: 14, allowedClasses: ['rogue'] },
    { id: 'g_c_r1', name: 'アイアンメイス', slot: 'weapon', description: '頭部に鉄の突起がついた、防御力を打ち砕く鈍器。', rarity: 'rare', atkBonus: 11, matkBonus: 5, allowedClasses: ['cleric'] },
    
    // Shields
    { id: 'g_s_r1', name: 'ブロンズシールド', slot: 'shield', description: '銅で作られた頑丈な円形盾。', rarity: 'rare', defBonus: 9, allowedClasses: ['warrior', 'cleric'] },
    
    // Armors
    { id: 'g_a_r1', name: '鋼鉄のチェインメイル', slot: 'armor', description: '鉄環を編み込んで作られた堅固な鎖帷子。', rarity: 'rare', defBonus: 14, hpBonus: 25, allowedClasses: ['warrior', 'rogue'] },
    { id: 'g_a_r2', name: 'シルクの魔導ローブ', slot: 'armor', description: '上質なシルクで仕立てられた上級魔術師の服。', rarity: 'rare', defBonus: 7, hpBonus: 20, allowedClasses: ['mage', 'cleric'] },
    
    // Accessories
    { id: 'g_ac_r1', name: 'スピードリング', slot: 'accessory', description: '風のルーンが刻まれた指輪。素早さを向上させる。', rarity: 'rare', spdBonus: 8 },
    { id: 'g_ac_r2', name: '命のルビー', slot: 'accessory', description: '生命力が宿る赤い宝石。最大HPが増加する。', rarity: 'rare', hpBonus: 35 }
  ],
  
  epic: [
    // Weapons
    { id: 'g_w_e1', name: '魔鉄のバトルアクス', slot: 'weapon', description: '魔力が宿る重厚な戦斧。高い攻撃力を持つ。', rarity: 'epic', atkBonus: 24, allowedClasses: ['warrior'] },
    { id: 'g_m_e1', name: 'エレメンタルワンド', slot: 'weapon', description: '四大属性の魔力を帯びた、攻撃呪文を極限まで強化する杖。', rarity: 'epic', atkBonus: 3, matkBonus: 22, allowedClasses: ['mage'] },
    { id: 'g_r_e1', name: 'シャドウクロー', slot: 'weapon', description: '闇の魔獣の爪から削り出した黒塗りの鉤爪。素早さも大きく上がる。', rarity: 'epic', atkBonus: 20, allowedClasses: ['rogue'] },
    { id: 'g_c_e1', name: 'ホーリースパイク', slot: 'weapon', description: '聖水で清められたトゲ付きの金槌。悪魔に大打撃を与える。', rarity: 'epic', atkBonus: 18, matkBonus: 12, allowedClasses: ['cleric'] },
    
    // Shields
    { id: 'g_s_e1', name: 'イージスの魔盾', slot: 'shield', description: 'あらゆる邪悪を跳ね返す伝説の盾。', rarity: 'epic', defBonus: 18, mdefBonus: 12, allowedClasses: ['warrior', 'cleric'] },
    
    // Armors
    { id: 'g_a_e1', name: '聖騎士の銀甲冑', slot: 'armor', description: '銀色に輝く聖なる重鎧。高い防御力と体力を授ける。', rarity: 'epic', defBonus: 22, hpBonus: 50, allowedClasses: ['warrior'] },
    { id: 'g_a_e2', name: '精霊の絹織衣', slot: 'armor', description: '精霊の加護を受けた神秘の衣装。', rarity: 'epic', defBonus: 12, hpBonus: 35, allowedClasses: ['mage', 'cleric'] },
    
    // Accessories
    { id: 'g_ac_e1', name: '疾風のアンクレット', slot: 'accessory', description: '風神の息吹を封じた足輪。動きが俊敏になる。', rarity: 'epic', spdBonus: 14, hpBonus: 20 }
  ],
  
  legendary: [
    // Weapons
    { id: 'w_greatsword', name: '神なる大剣 (ラグナロク)', slot: 'weapon', description: '両手で構える超重量の聖剣。圧倒的な攻撃力を誇る。', rarity: 'legendary', atkBonus: 35, allowedClasses: ['warrior'] },
    { id: 'w_archangel_staff', name: '大天使の聖杖', slot: 'weapon', description: '大天使の祝福を受けた最高級の聖杖。圧倒的な魔力を誇る。', rarity: 'legendary', atkBonus: 4, matkBonus: 32, allowedClasses: ['mage', 'cleric'] },
    { id: 'w_dagger', name: '風神の幻弓', slot: 'weapon', description: '風神の息吹が宿る伝説の弓矢。素早さを極限まで高める。', rarity: 'legendary', atkBonus: 28, allowedClasses: ['rogue'] },
    { id: 'g_c_l1', name: 'セラフィムの輝鎚', slot: 'weapon', description: '熾天使の権能を秘めた黄金のハンマー。圧倒的な威力と回復力。', rarity: 'legendary', atkBonus: 24, matkBonus: 22, allowedClasses: ['cleric'] },
    
    // Shields
    { id: 'g_s_l1', name: '神盾アテナ', slot: 'shield', description: '女神の加護が宿る神聖な盾。全ての攻撃を無効化する勢いで守る。', rarity: 'legendary', defBonus: 28, mdefBonus: 22, allowedClasses: ['warrior', 'cleric'] },
    
    // Armors
    { id: 'g_a_l1', name: '覇王の竜鱗鎧', slot: 'armor', description: '古代ドラゴンを討伐して得られた鱗で作られた究極の鎧。', rarity: 'legendary', defBonus: 32, hpBonus: 80, allowedClasses: ['warrior', 'rogue'] },
    
    // Accessories
    { id: 'ac_philosopher', name: '賢者の石', slot: 'accessory', description: '万物の真理が宿る宝珠。最大MPと魔法攻撃力を大幅に引き上げる。', rarity: 'legendary', mpBonus: 50, matkBonus: 15 }
  ]
};

/**
 * Draws a random equipment (Weapon, Shield, Armor, or Accessory) based on rates:
 * Common: 50%, Rare: 30%, Epic: 15%, Legendary: 5%
 * Optionally filters or prioritizes class compatibility when possible.
 */
export function pullGacha(classType?: CharacterClassType): EquipableItem {
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
  
  const pool = ALL_EQUIPMENT_GACHA_POOL[rarity];
  
  // Filter compatible equipment if classType is specified
  let compatibleItems = pool;
  if (classType) {
    const filtered = pool.filter(item => !item.allowedClasses || item.allowedClasses.includes(classType));
    if (filtered.length > 0) {
      compatibleItems = filtered;
    }
  }

  const randomIndex = Math.floor(Math.random() * compatibleItems.length);
  const selectedItem = compatibleItems[randomIndex];

  if (!selectedItem) {
    return ALL_EQUIPMENT_GACHA_POOL.common[0]!;
  }

  return selectedItem;
}
