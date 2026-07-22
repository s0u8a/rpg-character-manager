export type StatType = 'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'matk' | 'mdef';

/**
 * A utility record mapping each StatType to a numerical score.
 * Example of Mapped Types in TypeScript.
 */
export type Stats = Record<StatType, number>;

export type CharacterClassType = 'warrior' | 'mage' | 'rogue' | 'cleric';

export interface ClassDefinition {
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly baseStats: Stats;
  readonly growthStats: Stats; // Stats gained per level-up
  readonly weaponRestrictions?: string[]; // Types of items they cannot equip
}

export type EquipmentSlot = 'weapon' | 'shield' | 'armor' | 'accessory';

/**
 * Discriminated Union for items.
 * The 'slot' property serves as the discriminant.
 */
export interface BaseItem {
  readonly id: string;
  readonly name: string;
  readonly slot: EquipmentSlot;
  readonly description: string;
  readonly rarity: 'common' | 'rare' | 'epic' | 'legendary';
  readonly allowedClasses?: readonly CharacterClassType[]; // If undefined, all classes can equip
}

export interface WeaponItem extends BaseItem {
  readonly slot: 'weapon';
  readonly atkBonus: number;
  readonly matkBonus?: number;
}

export interface ShieldItem extends BaseItem {
  readonly slot: 'shield';
  readonly defBonus: number;
  readonly mdefBonus?: number;
}

export interface ArmorItem extends BaseItem {
  readonly slot: 'armor';
  readonly defBonus: number;
  readonly hpBonus?: number;
}

export interface AccessoryItem extends BaseItem {
  readonly slot: 'accessory';
  readonly spdBonus?: number;
  readonly mpBonus?: number;
  readonly matkBonus?: number;
  readonly hpBonus?: number;
}

// Union Type representing any equipable item
export type EquipableItem = WeaponItem | ShieldItem | ArmorItem | AccessoryItem;

/**
 * Buff and Debuff system using utility types and partials
 */
export type BuffType = 'might' | 'haste' | 'poison' | 'shield';

export interface StatModifier {
  readonly multiplier?: number; // E.g., 1.30 for +30%
  readonly flat?: number;       // E.g., +15
}

export interface Buff {
  readonly type: BuffType;
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  // Partial mapping of stats to their modifiers
  readonly modifiers: Partial<Record<StatType, StatModifier>>;
}

export interface CompanionNPC {
  readonly name: string;
  readonly classType: CharacterClassType;
  stats: Stats;
  avatarUrl?: string;
  affection: number; // 0 to 100 trust level
}

/**
 * The core Character state
 */
export interface Character {
  readonly id: string;
  readonly name: string;
  readonly classType: CharacterClassType;
  level: number;
  exp: number;
  currentHp: number;
  currentMp: number;
  readonly baseStats: Stats;
  readonly equipment: Record<EquipmentSlot, EquipableItem | null>;
  readonly activeBuffs: Set<BuffType>;
  avatarUrl?: string; // Base64 image string uploaded by user
  gold: number;
  alignment: number; // Positive = Hero, Negative = Demon Lord path
  companion: CompanionNPC;
  daysSinceLastInn: number; // Days elapsed since resting at Inn
}

export interface Enemy {
  readonly name: string;
  readonly level: number;
  readonly maxHp: number;
  hp: number;
  readonly atk: number;
  readonly def: number;
  readonly icon: string;       // fallback emoji
  readonly imageUrl?: string;  // path to monster sprite in /img
  readonly rewardExp: number;
}

