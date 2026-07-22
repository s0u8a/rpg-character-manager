import { EquipableItem } from '../types/game';

export const ITEM_DATABASE: EquipableItem[] = [
  // --- WEAPONS ---
  {
    id: 'w_sword',
    name: 'ブロードソード',
    slot: 'weapon',
    description: '標準的な鋼鉄の剣。扱いやすくバランスが良い。',
    rarity: 'common',
    atkBonus: 12,
    allowedClasses: ['warrior', 'rogue']
  },
  {
    id: 'w_greatsword',
    name: '神なる大剣 (ラグナロク)',
    slot: 'weapon',
    description: '両手で構える超重量の聖剣。圧倒的な攻撃力を誇るが、素早さが少し低下する。',
    rarity: 'legendary',
    atkBonus: 32,
    allowedClasses: ['warrior']
  },
  {
    id: 'w_staff',
    name: '見習い魔術師の杖',
    slot: 'weapon',
    description: '魔法の増幅器。微量の魔力が込められている。',
    rarity: 'common',
    atkBonus: 2,
    matkBonus: 8,
    allowedClasses: ['mage', 'cleric']
  },
  {
    id: 'w_archangel_staff',
    name: '大天使の聖杖',
    slot: 'weapon',
    description: '大天使の祝福を受けた最高級の聖杖。圧倒的な魔力と回復力を高める。',
    rarity: 'legendary',
    atkBonus: 4,
    matkBonus: 28,
    allowedClasses: ['mage', 'cleric']
  },
  {
    id: 'w_dagger',
    name: 'アサシンダガー',
    slot: 'weapon',
    description: '暗殺用に研ぎ澄まされた短剣。素早さが上昇する。',
    rarity: 'rare',
    atkBonus: 15,
    allowedClasses: ['rogue']
  },

  // --- SHIELDS ---
  {
    id: 's_bronze',
    name: 'ブロンズシールド',
    slot: 'shield',
    description: '銅で作られた円形の盾。基本的な防御力を提供する。',
    rarity: 'common',
    defBonus: 6,
    allowedClasses: ['warrior', 'cleric']
  },
  {
    id: 's_aegis',
    name: 'イージスの魔盾',
    slot: 'shield',
    description: 'あらゆる邪悪を跳ね返す伝説の盾。物理・魔法両方のダメージを大きく軽減する。',
    rarity: 'epic',
    defBonus: 18,
    mdefBonus: 12,
    allowedClasses: ['warrior', 'cleric']
  },

  // --- ARMOR ---
  {
    id: 'a_plate',
    name: '鋼鉄のプレートメイル',
    slot: 'armor',
    description: '全身を硬い鋼鉄で覆う重鎧。防御力と最大HPが上昇する。',
    rarity: 'rare',
    defBonus: 18,
    hpBonus: 30,
    allowedClasses: ['warrior']
  },
  {
    id: 'a_robe',
    name: 'マジシャンのローブ',
    slot: 'armor',
    description: '魔力を帯びた糸で織られた軽装のローブ。魔法防御力が高い。',
    rarity: 'common',
    defBonus: 4,
    hpBonus: 10,
    allowedClasses: ['mage', 'cleric']
  },
  {
    id: 'a_leather',
    name: 'スカウトの隠密革鎧',
    slot: 'armor',
    description: '素早い身のこなしを邪魔しない軽量の皮鎧。',
    rarity: 'rare',
    defBonus: 8,
    allowedClasses: ['rogue']
  },

  // --- ACCESSORIES ---
  {
    id: 'ac_ring',
    name: 'スピードリング',
    slot: 'accessory',
    description: '風のルーンが刻まれた指輪。素早さを向上させる。',
    rarity: 'rare',
    spdBonus: 8
  },
  {
    id: 'ac_ruby',
    name: '命のルビー',
    slot: 'accessory',
    description: '生命力が宿る赤い宝石。最大HPが増加する。',
    rarity: 'rare',
    hpBonus: 25
  },
  {
    id: 'ac_philosopher',
    name: '賢者の石',
    slot: 'accessory',
    description: '万物の真理が宿る宝珠。最大MPと魔法攻撃力を大幅に引き上げる。',
    rarity: 'legendary',
    mpBonus: 50,
    matkBonus: 10
  }
];
