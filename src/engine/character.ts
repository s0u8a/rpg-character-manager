import {
  Character,
  CharacterClassType,
  ClassDefinition,
  Stats,
  StatType,
  EquipableItem,
  EquipmentSlot,
  BuffType,
  Buff,
  CompanionNPC
} from '../types/game';

/**
 * Class Definitions with starting stats and growth parameters per level-up.
 */
export const CLASS_DEFINITIONS: Record<CharacterClassType, ClassDefinition> = {
  warrior: {
    name: '戦士',
    icon: '⚔️',
    description: '強靭な肉体と高い防御力を誇り、最前線で味方を守る物理アタッカー。',
    baseStats: {
      hp: 120,
      mp: 20,
      atk: 18,
      def: 14,
      spd: 8,
      matk: 4,
      mdef: 6
    },
    growthStats: {
      hp: 18,
      mp: 2,
      atk: 3,
      def: 2,
      spd: 1,
      matk: 0.5,
      mdef: 1
    }
  },
  mage: {
    name: '魔法使い',
    icon: '🔮',
    description: '強力な古代魔法を操り、広範囲の敵を一掃する魔術の探求者。',
    baseStats: {
      hp: 75,
      mp: 80,
      atk: 6,
      def: 6,
      spd: 11,
      matk: 20,
      mdef: 12
    },
    growthStats: {
      hp: 8,
      mp: 10,
      atk: 0.5,
      def: 0.8,
      spd: 1.5,
      matk: 4,
      mdef: 2
    }
  },
  rogue: {
    name: '盗賊',
    icon: '🗡️',
    description: '圧倒的な素早さと器用さを持ち、急所へのクリティカル攻撃を得意とする。',
    baseStats: {
      hp: 90,
      mp: 35,
      atk: 14,
      def: 9,
      spd: 16,
      matk: 6,
      mdef: 7
    },
    growthStats: {
      hp: 12,
      mp: 3,
      atk: 2.2,
      def: 1.2,
      spd: 2.5,
      matk: 0.8,
      mdef: 1
    }
  },
  cleric: {
    name: '僧侶',
    icon: '🛡️',
    description: '神聖な祈りによって傷を癒やし、闇を払い退ける聖職者。高い魔法防御を持つ。',
    baseStats: {
      hp: 100,
      mp: 60,
      atk: 10,
      def: 11,
      spd: 9,
      matk: 12,
      mdef: 16
    },
    growthStats: {
      hp: 14,
      mp: 6,
      atk: 1.2,
      def: 1.5,
      spd: 1.2,
      matk: 2,
      mdef: 3
    }
  }
};

/**
 * Global active Buff definitions with status effects
 */
export const BUFF_DEFINITIONS: Record<BuffType, Buff> = {
  might: {
    type: 'might',
    name: '怪力 (Might)',
    icon: '🔴',
    description: 'みなぎる筋肉の力によって、物理攻撃力が30%上昇する。',
    modifiers: {
      atk: { multiplier: 1.30 }
    }
  },
  haste: {
    type: 'haste',
    name: '加速 (Haste)',
    icon: '⚡',
    description: '時間の流れが加速し、素早さが50%上昇する。',
    modifiers: {
      spd: { multiplier: 1.50 }
    }
  },
  poison: {
    type: 'poison',
    name: '毒 (Poison)',
    icon: '🟢',
    description: '体力を蝕む毒。最大HPが10%低下し、物理防御が20%低下する。',
    modifiers: {
      hp: { multiplier: 0.90 },
      def: { multiplier: 0.80 }
    }
  },
  shield: {
    type: 'shield',
    name: '防護壁 (Shield)',
    icon: '🛡️',
    description: '魔法の防護壁。物理防御と魔法防御が25%上昇する。',
    modifiers: {
      def: { multiplier: 1.25 },
      mdef: { multiplier: 1.25 }
    }
  }
};

/**
 * Dice roll simulator for starting stats.
 * Generates base class stats + random offset simulated by dice roll.
 */
export function rollDiceStats(classType: CharacterClassType): Stats {
  const base = CLASS_DEFINITIONS[classType].baseStats;
  const roll = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  return {
    hp: base.hp + roll(1, 10) + roll(1, 10) + roll(1, 10), // 3d10 HP
    mp: base.mp + roll(1, 6) + roll(1, 6) + roll(1, 6),    // 3d6 MP
    atk: Math.round(base.atk + roll(1, 6) + roll(1, 6)),    // 2d6 ATK
    def: Math.round(base.def + roll(1, 6) + roll(1, 6)),    // 2d6 DEF
    spd: Math.round(base.spd + roll(1, 4) + roll(1, 4)),    // 2d4 SPD
    matk: Math.round(base.matk + roll(1, 6) + roll(1, 6)),  // 2d6 MATK
    mdef: Math.round(base.mdef + roll(1, 6) + roll(1, 6))   // 2d6 MDEF
  };
}

/**
  * Initialize a new character sheet at Level 1.
  */
export function createCharacter(
  name: string,
  classType: CharacterClassType,
  avatarUrl?: string,
  rolledStats?: Stats,
  companion?: CompanionNPC
): Character {
  const classDef = CLASS_DEFINITIONS[classType];
  const finalStats = rolledStats || { ...classDef.baseStats };
  
  const defaultCompanion: CompanionNPC = companion || {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    name: 'セリア',
    gender: 'female',
    classType: 'cleric',
    level: 1,
    stats: { ...CLASS_DEFINITIONS.cleric.baseStats },
    affection: 80
  };
  if (!defaultCompanion.level) {
    defaultCompanion.level = 1;
  }
  
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    name,
    classType,
    level: 1,
    exp: 0,
    currentHp: finalStats.hp,
    currentMp: finalStats.mp,
    baseStats: finalStats,
    equipment: {
      weapon: null,
      shield: null,
      armor: null,
      accessory: null
    },
    activeBuffs: new Set<BuffType>(),
    avatarUrl,
    gold: 150, // Start with 150 Gold for weapon Gacha!
    alignment: 0, // Starts neutral
    companion: defaultCompanion,
    companions: [defaultCompanion],
    daysSinceLastInn: 0
  };
}

/**
 * Helper to construct a new recruited companion NPC
 */
export function createCompanionNPC(
  name: string,
  gender: 'female' | 'male',
  classType: CharacterClassType,
  stats?: Stats,
  avatarUrl?: string
): CompanionNPC {
  const baseStats = stats || rollDiceStats(classType);
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    name,
    gender,
    classType,
    level: 1,
    stats: { ...baseStats },
    avatarUrl,
    affection: 80
  };
}


/**
 * Calculates current base stats including level growth.
 * Does not include items and buffs.
 */
export function getBaseStatsAtLevel(char: Character): Stats {
  const classDef = CLASS_DEFINITIONS[char.classType];
  const levelDiff = char.level - 1;
  
  const stats: Stats = { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, matk: 0, mdef: 0 };
  
  for (const key of Object.keys(classDef.baseStats) as StatType[]) {
    // Stat = Base + (Level - 1) * Growth, rounded to 1 decimal place
    stats[key] = Math.round((classDef.baseStats[key] + levelDiff * classDef.growthStats[key]) * 10) / 10;
  }
  
  return stats;
}

/**
 * Calculates the final computed effective stats for a Character.
 * Incorporates: Base Stats + Level Growth + Equipment stats + Buff modifiers.
 */
export function calculateEffectiveStats(char: Character): Stats {
  const baseStats = getBaseStatsAtLevel(char);
  
  // 1. Accumulate Item Stats
  const equipmentStats: Record<StatType, number> = {
    hp: 0, mp: 0, atk: 0, def: 0, spd: 0, matk: 0, mdef: 0
  };

  for (const slot of Object.keys(char.equipment) as EquipmentSlot[]) {
    const item = char.equipment[slot];
    if (item) {
      if ('atkBonus' in item) equipmentStats.atk += item.atkBonus;
      if ('matkBonus' in item && item.matkBonus) equipmentStats.matk += item.matkBonus;
      if ('defBonus' in item) equipmentStats.def += item.defBonus;
      if ('mdefBonus' in item && item.mdefBonus) equipmentStats.mdef += item.mdefBonus;
      if ('hpBonus' in item && item.hpBonus) equipmentStats.hp += item.hpBonus;
      if ('mpBonus' in item && item.mpBonus) equipmentStats.mp += item.mpBonus;
      if ('spdBonus' in item && item.spdBonus) equipmentStats.spd += item.spdBonus;
    }
  }

  // Raw stat before buffs = base stats (scaled by level) + equipment stats
  const rawStats: Stats = { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, matk: 0, mdef: 0 };
  for (const key of Object.keys(baseStats) as StatType[]) {
    rawStats[key] = baseStats[key] + equipmentStats[key];
  }

  // 2. Apply Buff/Debuff Modifiers
  // Multipliers multiply; flat values are added.
  const finalStats: Stats = { ...rawStats };
  
  // Initialize multiplier & flat lists
  const multipliers: Record<StatType, number> = { hp: 1, mp: 1, atk: 1, def: 1, spd: 1, matk: 1, mdef: 1 };
  const flats: Record<StatType, number> = { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, matk: 0, mdef: 0 };

  for (const buffType of char.activeBuffs) {
    const buff = BUFF_DEFINITIONS[buffType];
    for (const key of Object.keys(buff.modifiers) as StatType[]) {
      const modifier = buff.modifiers[key];
      if (modifier) {
        if (modifier.multiplier !== undefined) {
          multipliers[key] *= modifier.multiplier;
        }
        if (modifier.flat !== undefined) {
          flats[key] += modifier.flat;
        }
      }
    }
  }

  // Calculate Final Stats: (Raw + Flat) * Multiplier
  for (const key of Object.keys(finalStats) as StatType[]) {
    const finalValue = (finalStats[key] + flats[key]) * multipliers[key];
    // Keep stats clean by rounding to closest integer (or 1 decimal if needed, let's round to nearest integer for standard RPG stats)
    finalStats[key] = Math.max(1, Math.round(finalValue));
  }

  return finalStats;
}

/**
 * Result of trying to equip an item.
 * Utilizes TypeScript Discriminated Unions to return type-safe results.
 */
export type EquipResult = 
  | { readonly success: true; readonly message: string }
  | { readonly success: false; readonly reason: string };

/**
 * Equips an item to a character.
 * Validates: slot matching and class restrictions.
 */
export function equipItem(char: Character, item: EquipableItem): EquipResult {
  // 1. Verify class restrictions
  if (item.allowedClasses && !item.allowedClasses.includes(char.classType)) {
    const allowedNames = item.allowedClasses
      .map(c => CLASS_DEFINITIONS[c].name)
      .join('、');
    return {
      success: false,
      reason: `職業制限: このアイテムは[${allowedNames}]のみ装備可能です。(${CLASS_DEFINITIONS[char.classType].name}は装備できません)`
    };
  }

  // 2. Verify slot compatibility (TypeScript's compiler prevents invalid slot keys in code, but runtime verification is good)
  const targetSlot: EquipmentSlot = item.slot;

  // Perform equip
  char.equipment[targetSlot] = item;
  
  return {
    success: true,
    message: `${item.name} を ${targetSlot === 'weapon' ? '武器' : targetSlot === 'shield' ? '盾' : targetSlot === 'armor' ? '鎧' : '装飾品'} スロットに装備しました。`
  };
}

/**
 * Unequips item from a slot.
 */
export function unequipItem(char: Character, slot: EquipmentSlot): string | null {
  const item = char.equipment[slot];
  if (!item) return null;
  char.equipment[slot] = null;
  return `${item.name} の装備を解除しました。`;
}

/**
 * Level Up action.
 */
export function levelUp(char: Character): void {
  char.level += 1;
  char.exp = 0; // Reset exp on manual level up
  
  // Fully heal HP/MP on level up
  const newMaxStats = calculateEffectiveStats(char);
  char.currentHp = newMaxStats.hp;
  char.currentMp = newMaxStats.mp;
}

/**
 * Gain EXP action. Supports multi-level up if large EXP amount gained.
 */
export function gainExp(char: Character, amount: number): { leveledUp: boolean; levelsGained: number; newExp: number } {
  char.exp += amount;
  let levelsGained = 0;
  
  while (true) {
    const expNeeded = char.level * 100;
    if (char.exp >= expNeeded) {
      char.exp -= expNeeded;
      char.level += 1;
      levelsGained += 1;
      
      // Fully heal HP/MP on level up
      const newMaxStats = calculateEffectiveStats(char);
      char.currentHp = newMaxStats.hp;
      char.currentMp = newMaxStats.mp;
    } else {
      break;
    }
  }
  
  return { leveledUp: levelsGained > 0, levelsGained, newExp: char.exp };
}
