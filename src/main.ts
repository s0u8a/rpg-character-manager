import { Character, EquipmentSlot, EquipableItem, StatType, Enemy, CompanionNPC, Stats, CharacterClassType, BuffType } from './types/game';
import { createCharacter, calculateEffectiveStats, getBaseStatsAtLevel, equipItem, unequipItem, gainExp, CLASS_DEFINITIONS, rollDiceStats } from './engine/character';
import { pullGacha } from './engine/gacha';

// App state
let activeCharacter: Character | null = null;
let activeEnemy: Enemy | null = null;
let currentStage: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 1;
let isPlayerDefending = false;

// Selected avatars
let selectedAvatarUrl: string | null = null;
let selectedCompanionAvatarUrl: string | null = null;

// Rolled base stats
let rolledPlayerStats: Stats | null = null;
let rolledCompanionStats: Stats | null = null;

// Gacha-obtained weapons (separate from static ITEM_DATABASE)
// Each entry gets a unique instanceId so duplicates stack properly
let playerInventory: EquipableItem[] = [];

// Enemy templates mapped to quest stages (High level monsters)
const ENEMY_TEMPLATES: Record<1 | 2 | 3 | 4 | 5 | 6, Omit<Enemy, 'hp'>> = {
  1: { name: 'スライム (Stage 1)',           level: 5,  maxHp: 90,  atk: 16, def: 5,  icon: '🟢', imageUrl: '/img/suraimu.png', rewardExp: 150 },
  2: { name: 'ゴブリン (Stage 2)',           level: 12, maxHp: 170, atk: 28, def: 10, icon: '😈', imageUrl: '/img/goburin.png', rewardExp: 280 },
  3: { name: 'ジャイアントスパイダー (Stage 3)', level: 20, maxHp: 280, atk: 42, def: 18, icon: '🕷️', imageUrl: '/img/kumo.png',    rewardExp: 420 },
  4: { name: 'ならず者の盗賊 (Stage 4)',     level: 28, maxHp: 420, atk: 60, def: 26, icon: '👤', imageUrl: '/img/touzoku.png', rewardExp: 600 },
  5: { name: '狂暴なオーガ (Stage 5)',       level: 36, maxHp: 620, atk: 80, def: 36, icon: '👹', imageUrl: '/img/o-ga.png',    rewardExp: 850 },
  6: { name: '滅びのレッドドラゴン (Stage 6)', level: 48, maxHp: 950, atk: 105, def: 48, icon: '🐉', imageUrl: '/img/doragon.png', rewardExp: 1200 }
};

// Story Choice definitions
interface StoryChoice {
  text: string;
  alignEffect: number;
  logMessage: string;
  choiceClass: 'light' | 'dark';
  goldReward?: number;
}

interface StoryStageEvent {
  narration: string;
  choices: StoryChoice[];
}

// Inter-stage dialogue events
const STORY_EVENTS: Record<1 | 2 | 3 | 4 | 5 | 6, StoryStageEvent> = {
  1: {
    narration: "スライムを打ち破り、森の入り口へと差し掛かった。仲間が話しかけてくる。\n\n「無事で良かったです！この先の薄暗い森には、より狡猾な『ゴブリン』の群れが潜んでいるようです。どう進みましょう？」",
    choices: [
      { text: '☀️「周りの安全を確保するため、慎重に索敵しながら進もう」', alignEffect: 1, logMessage: '慎重に進むことを選び、仲間の信頼を高めた。', choiceClass: 'light' },
      { text: '🌙「時間を無駄にするな。強行突破して邪魔な魔物は薙ぎ払う」', alignEffect: -1, logMessage: '強引な突破を選び、力による解決を肯定した。', choiceClass: 'dark' }
    ]
  },
  2: {
    narration: "ゴブリンのねぐらを制圧した。仲間はうつむきながら倒れた魔物を見つめている。\n\n「少し…やりすぎてはいませんか？生き延びるためとはいえ、ここまで無残に殲滅しなくても…」",
    choices: [
      { text: '☀️「すまない、焦っていた。魔物とはいえ必要以上の殺生は控えよう」', alignEffect: 1, logMessage: '必要以上の殺生を悔い、慈愛の心を示した。', choiceClass: 'light' },
      { text: '🌙「甘いことを言うな。脅威は根絶やしにするのが鉄則だ」', alignEffect: -2, logMessage: '敵への冷酷さを露にし、仲間との距離が生じた。', choiceClass: 'dark' }
    ]
  },
  3: {
    narration: "洞窟の奥で大クモを撃破した。巣の残骸から、妖しく輝く『混沌の魔結晶』を発見した。\n\n「その結晶…とても禍々しい魔力を感じます。絶対に触れず、聖堂に持ち帰って封印しましょう！」",
    choices: [
      { text: '☀️「分かった。危険な闇の力だ、しっかりと封印して持ち帰ろう」', alignEffect: 1, logMessage: '混沌の魔結晶の封印を誓い、秩序の道を選んだ。', choiceClass: 'light' },
      { text: '🌙「この力、俺が取り込んで利用する。魔王を倒すためなら手段は問わない」', alignEffect: -2, logMessage: '混沌の魔結晶を体内に取り込み、闇の力をその身に宿した。', choiceClass: 'dark' }
    ]
  },
  4: {
    narration: "行く手を阻んだ盗賊団の首領を降伏させた。首領は頭を地面に擦り付けて懇願している。\n\n「命だけは助けてくれ！奪った宝はすべて差し上げる！だから見逃してくれ…！」",
    choices: [
      { text: '☀️「略奪した宝を受け取るわけにはいかない。大人しく衛兵に投降しろ」', alignEffect: 1, logMessage: '盗賊を衛兵に引き渡し、正義を貫いた。', choiceClass: 'light' },
      { text: '🌙「命が惜しければすべての財宝を置いて立ち去れ」', alignEffect: -1, logMessage: '盗賊から身代金を回収し、懐を潤した。(+100G獲得)', choiceClass: 'dark', goldReward: 100 }
    ]
  },
  5: {
    narration: "オーガの巨体を切り伏せた。戦いの跡で、仲間があなたの顔を不安そうに見つめる。\n\n「あなたの瞳の奥…冷酷な影が見えるような気がします。まるで魔王の力と共鳴しているかのような…本当に大丈夫ですか？」",
    choices: [
      { text: '☀️「心配をかけてすまない。俺の心は常に君たちと共にある」', alignEffect: 2, logMessage: '仲間の手を握り、強い絆と光の忠誠を示した。', choiceClass: 'light' },
      { text: '🌙「余計な詮索はするな。俺に付き従うか、ここで去るか、自分で決めろ」', alignEffect: -2, logMessage: '冷たい言葉を浴びせ、独裁的な覇道を突き進んだ。', choiceClass: 'dark' }
    ]
  },
  6: {
    narration: "滅びの竜が倒れたその時、背後から冷徹な殺気が突き刺さる。\n\n振り返ると、仲間が武器を構えて涙を浮かべていた。\n\n(アライメント判定分岐...)",
    choices: []
  }
};

// Endings Text templates
const NARRATIVE_HERO_ENDING = `...そして、激闘の末に魔王は塵となってアストラルアリーナの深淵へと消え去った。\n\n[Name]と仲間の[CompName]は、ボロボロになりながらも手を取り合い、青空の下へ帰還した。\n\n人々は二人の偉業を称え、歴史の碑石に「世界を救いし二人の聖勇者」としてその名を永遠に刻んだ。\n\n――ここに、[Name]と[CompName]の旅は美しき大団円を迎えた。世界に再び平和の光が満ち溢れたのだ。`;

const NARRATIVE_DEMON_ENDING = `...激闘の末、光の化身となった[CompName]の心臓を、[Name]の闇の刃が貫いた。\n\n「どうして…こうなってしまったの…」そう言い残し、[CompName]は光 of 粒子となって消滅した。\n\n魔王の王座に腰掛けた[Name]の体に、完全なる闇の魔力が宿る。もはやかつての勇者の面影はなく、新たな魔王「ラスボス」が誕生したのだ。\n\n世界は救われなかった。ただ、より深い漆黒の絶望に支配されただけだった。`;

// DOM Elements
const appHeader = document.getElementById('simulation-panel') ? document.querySelector('.app-header')! : document.createElement('header');
const creatorCard = document.getElementById('creator-card')!;
const characterCard = document.getElementById('character-card')!;
const companionCard = document.getElementById('companion-card')!;
const equipmentCard = document.getElementById('equipment-card')!;
const gachaCard = document.getElementById('gacha-card')!;
const inventoryCard = document.getElementById('inventory-card')!;
const effectsCard = document.getElementById('effects-card')!;
const simulationPanel = document.getElementById('simulation-panel')!;

const createForm = document.getElementById('create-character-form') as HTMLFormElement;
const charNameInput = document.getElementById('char-name') as HTMLInputElement;

// Narrative elements
const storyCard = document.getElementById('story-card')!;
const storyText = document.getElementById('story-text')!;
const storyChoicesBox = document.getElementById('story-choices-box')!;
const storyChoicesList = document.getElementById('story-choices-list')!;
const btnStartQuest = document.getElementById('btn-start-quest') as HTMLButtonElement;

const endingCard = document.getElementById('ending-card')!;
const endingText = document.getElementById('ending-text')!;
const btnRestartGame = document.getElementById('btn-restart-game')!;
const endingBadge = document.getElementById('ending-badge')!;

// Character Details elements
const avatarWrapper = document.getElementById('char-avatar-wrapper')!;
const displayNameEl = document.getElementById('display-name')!;
const displayClassEl = document.getElementById('display-class')!;
const displayLevelEl = document.getElementById('display-level')!;
const displayExpTextEl = document.getElementById('display-exp-text')!;
const displayExpFillEl = document.getElementById('display-exp-fill')!;

// Stat display elements
const statHpBase = document.getElementById('stat-base-hp')!;
const statHpCalc = document.getElementById('stat-calc-hp')!;
const statMpBase = document.getElementById('stat-base-mp')!;
const statMpCalc = document.getElementById('stat-calc-mp')!;
const statAtkBase = document.getElementById('stat-base-atk')!;
const statAtkCalc = document.getElementById('stat-calc-atk')!;
const statDefBase = document.getElementById('stat-base-def')!;
const statDefCalc = document.getElementById('stat-calc-def')!;
const statSpdBase = document.getElementById('stat-base-spd')!;
const statSpdCalc = document.getElementById('stat-calc-spd')!;
const statMatkBase = document.getElementById('stat-base-matk')!;
const statMatkCalc = document.getElementById('stat-calc-matk')!;
const statMdefBase = document.getElementById('stat-base-mdef')!;
const statMdefCalc = document.getElementById('stat-calc-mdef')!;

// Companion NPC DOM elements
const compAvatarWrapper = document.getElementById('comp-avatar-wrapper')!;
const displayCompName = document.getElementById('display-comp-name')!;
const displayCompClass = document.getElementById('display-comp-class')!;
const compAffectionText = document.getElementById('comp-affection-text')!;
const btnTalkCompanion = document.getElementById('btn-talk-companion')!;
const speechBubbleBox = document.getElementById('speech-bubble-box')!;
const compSpeechText = document.getElementById('comp-speech-text')!;

const innCard = document.getElementById('inn-card')!;
const innDaysDisplay = document.getElementById('inn-days-display')!;
const innAffectionStatus = document.getElementById('inn-affection-status')!;
const innDangerWarning = document.getElementById('inn-danger-warning')!;
const btnStayInn = document.getElementById('btn-stay-inn')!;

const gameOverCard = document.getElementById('game-over-card')!;
const gameOverText = document.getElementById('game-over-text')!;
const btnRestartGameover = document.getElementById('btn-restart-gameover')!;

const compStatHp = document.getElementById('comp-stat-hp')!;
const compStatMp = document.getElementById('comp-stat-mp')!;
const compStatAtk = document.getElementById('comp-stat-atk')!;
const compStatDef = document.getElementById('comp-stat-def')!;
const compStatSpd = document.getElementById('comp-stat-spd')!;

// Gacha HUD Elements
const displayGold = document.getElementById('display-gold')!;
const btnDrawGacha = document.getElementById('btn-draw-gacha')!;
const gachaResultBox = document.getElementById('gacha-result-box')!;
const gachaResultCard = document.getElementById('gacha-result-card')!;

// Console Log
const consoleLogsContainer = document.getElementById('console-logs')!;
const btnClearConsole = document.getElementById('btn-clear-console')!;

// Buffs checkboxes
const buffMightCheck = document.getElementById('effect-might') as HTMLInputElement;
const buffHasteCheck = document.getElementById('effect-haste') as HTMLInputElement;
const buffPoisonCheck = document.getElementById('effect-poison') as HTMLInputElement;
const buffShieldCheck = document.getElementById('effect-shield') as HTMLInputElement;

// Equipment slots
const slotWeapon = document.getElementById('slot-weapon')!;
const slotShield = document.getElementById('slot-shield')!;
const slotArmor = document.getElementById('slot-armor')!;
const slotAccessory = document.getElementById('slot-accessory')!;

// Inventory
const inventoryContainer = document.getElementById('inventory-container')!;

// Interaction buttons
const btnResetChar = document.getElementById('btn-reset-character')!;

// Avatar file upload elements
const charAvatarInput = document.getElementById('char-avatar-input') as HTMLInputElement;
const avatarUploadPreview = document.getElementById('avatar-upload-preview')!;
const avatarPreviewImg = document.getElementById('avatar-preview-img') as HTMLImageElement;
const btnRemoveAvatar = document.getElementById('btn-remove-avatar')!;

// Companion image uploader elements
const compNameInput = document.getElementById('comp-name') as HTMLInputElement;
const compAvatarInput = document.getElementById('comp-avatar-input') as HTMLInputElement;
const compAvatarUploadPreview = document.getElementById('comp-avatar-upload-preview')!;
const compAvatarPreviewImg = document.getElementById('comp-avatar-preview-img') as HTMLImageElement;
const btnRemoveCompAvatar = document.getElementById('btn-remove-comp-avatar')!;

// Player Dice Roller elements
const btnRollPlayerStats = document.getElementById('btn-roll-player-stats')!;
const playerStatsPreview = document.getElementById('player-stats-preview')!;

// Companion Dice Roller elements
const btnRollCompStats = document.getElementById('btn-roll-comp-stats')!;
const compStatsPreview = document.getElementById('comp-stats-preview')!;

// Battle Arena elements
const battlePlayerCard = document.getElementById('battle-player-card')!;
const battleEnemyCard = document.getElementById('battle-enemy-card')!;
const battlePlayerName = document.getElementById('battle-player-name')!;
const battlePlayerClass = document.getElementById('battle-player-class')!;
const battlePlayerAvatar = document.getElementById('battle-player-avatar')!;
const battlePlayerHpText = document.getElementById('battle-player-hp-text')!;
const battlePlayerHpFill = document.getElementById('battle-player-hp-fill')!;
const battlePlayerMpText = document.getElementById('battle-player-mp-text')!;
const battlePlayerMpFill = document.getElementById('battle-player-mp-fill')!;

const battleEnemyName = document.getElementById('battle-enemy-name')!;
const battleEnemyAvatar = document.getElementById('battle-enemy-avatar')!;
const battleEnemyHpText = document.getElementById('battle-enemy-hp-text')!;
const battleEnemyHpFill = document.getElementById('battle-enemy-hp-fill')!;
const battleEnemyReward = document.getElementById('battle-enemy-reward')!;

const btnSimAttack = document.getElementById('btn-sim-attack')!;
const btnSimCast = document.getElementById('btn-sim-cast')!;
const btnSimHeal = document.getElementById('btn-sim-heal')!;
const btnSimDefend = document.getElementById('btn-sim-defend')!;
const damageTextLayer = document.getElementById('damage-text-layer')!;

// Quest stages nodes
const stageNode1 = document.getElementById('stage-node-1')!;
const stageNode2 = document.getElementById('stage-node-2')!;
const stageNode3 = document.getElementById('stage-node-3')!;
const stageNode4 = document.getElementById('stage-node-4')!;
const stageNode5 = document.getElementById('stage-node-5')!;
const stageNode6 = document.getElementById('stage-node-6')!;
const stageNode7 = document.getElementById('stage-node-7')!;
const stageNode7Name = document.getElementById('stage-node-7-name')!;
const connector1 = document.getElementById('connector-1')!;
const connector2 = document.getElementById('connector-2')!;
const connector3 = document.getElementById('connector-3')!;
const connector4 = document.getElementById('connector-4')!;
const connector5 = document.getElementById('connector-5')!;
const connector6 = document.getElementById('connector-6')!;

// Typewriter state
let typewriterInterval: number | null = null;

/**
 * Typewriter effect helper
 */
function runTypewriter(element: HTMLElement, text: string, callback?: () => void): void {
  if (typewriterInterval) clearInterval(typewriterInterval);
  
  element.textContent = '';
  element.classList.add('cursor-blink');
  
  let index = 0;
  typewriterInterval = setInterval(() => {
    if (index < text.length) {
      element.textContent += text[index];
      index++;
    } else {
      if (typewriterInterval) clearInterval(typewriterInterval);
      element.classList.remove('cursor-blink');
      if (callback) callback();
    }
  }, 25) as unknown as number;
}

/**
 * Log message to console logger panel
 */
function addLog(text: string, type: 'system' | 'create' | 'levelup' | 'equip' | 'combat-atk' | 'combat-spell' | 'combat-dmg' | 'error' = 'system'): void {
  const logEl = document.createElement('div');
  logEl.className = `log-entry log-${type}`;
  
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  logEl.innerHTML = `[${timeStr}] ${text}`;
  consoleLogsContainer.appendChild(logEl);
  
  while (consoleLogsContainer.children.length > 60) {
    consoleLogsContainer.removeChild(consoleLogsContainer.firstChild!);
  }
  consoleLogsContainer.scrollTop = consoleLogsContainer.scrollHeight;
}

/**
 * Floating damage numbers popup logic
 */
function spawnDamagePop(targetElement: HTMLElement, text: string, type: 'dealt' | 'taken' | 'heal' | 'msg'): void {
  const rect = targetElement.getBoundingClientRect();
  const parentRect = damageTextLayer.getBoundingClientRect();
  
  const pop = document.createElement('div');
  pop.className = `damage-pop pop-${type}`;
  pop.textContent = text;
  
  const posX = (rect.left + rect.width / 2) - parentRect.left;
  const posY = (rect.top + rect.height / 3) - parentRect.top;
  
  const randomOffsetX = Math.floor(Math.random() * 40) - 20;
  
  pop.style.left = `${posX + randomOffsetX}px`;
  pop.style.top = `${posY}px`;
  
  damageTextLayer.appendChild(pop);
  
  setTimeout(() => {
    if (damageTextLayer.contains(pop)) {
      damageTextLayer.removeChild(pop);
    }
  }, 900);
}

/**
 * Get slot display icons helper
 */
function getSlotIcon(item: EquipableItem): string {
  switch (item.slot) {
    case 'weapon':
      if (item.id.includes('staff')) return '🔮';
      if (item.id.includes('dagger')) return '🗡️';
      return '⚔️';
    case 'shield': return '🛡️';
    case 'armor':
      if (item.id.includes('robe')) return '👕';
      return '🦺';
    case 'accessory':
      if (item.id.includes('ring')) return '💍';
      if (item.id.includes('ruby')) return '❤️';
      return '🔮';
  }
}

/**
 * Get equipment bonus description utility
 */
function getItemBonusSummary(item: EquipableItem): string {
  const bonuses: string[] = [];
  if ('atkBonus' in item && item.atkBonus) bonuses.push(`ATK +${item.atkBonus}`);
  if ('matkBonus' in item && item.matkBonus) bonuses.push(`MATK +${item.matkBonus}`);
  if ('defBonus' in item && item.defBonus) bonuses.push(`DEF +${item.defBonus}`);
  if ('mdefBonus' in item && item.mdefBonus) bonuses.push(`MDEF +${item.mdefBonus}`);
  if ('hpBonus' in item && item.hpBonus) bonuses.push(`HP +${item.hpBonus}`);
  if ('mpBonus' in item && item.mpBonus) bonuses.push(`MP +${item.mpBonus}`);
  if ('spdBonus' in item && item.spdBonus) bonuses.push(`SPD +${item.spdBonus}`);
  return bonuses.join(', ');
}

/**
 * Render equipment slots details
 */
function renderSlot(slot: EquipmentSlot, element: HTMLElement): void {
  if (!activeCharacter) return;
  const item = activeCharacter.equipment[slot];
  
  element.className = 'equip-slot';
  element.innerHTML = '';
  
  if (!item) {
    element.classList.add('empty');
    const placeholder = document.createElement('span');
    placeholder.className = 'slot-placeholder';
    
    const icons: Record<EquipmentSlot, string> = {
      weapon: '⚔️ 武器スロット',
      shield: '🛡️ 盾スロット',
      armor: '👕 鎧スロット',
      accessory: '💍 装飾品スロット'
    };
    
    placeholder.textContent = icons[slot];
    element.appendChild(placeholder);
    element.onclick = null;
  } else {
    element.classList.add(`rarity-${item.rarity}-border`);
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'item-icon';
    iconSpan.textContent = getSlotIcon(item);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'item-info';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'item-name';
    nameSpan.textContent = item.name;
    
    const bonusSpan = document.createElement('span');
    bonusSpan.className = 'item-bonus-text';
    bonusSpan.style.color = 'var(--success-color)';
    bonusSpan.textContent = getItemBonusSummary(item);
    
    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(bonusSpan);
    
    element.appendChild(iconSpan);
    element.appendChild(infoDiv);
    
    element.onclick = () => {
      const msg = unequipItem(activeCharacter!, slot);
      if (msg) {
        addLog(`装備解除: ${msg}`, 'equip');
        updateUI();
      }
    };
  }
}

/**
 * Build one inventory card DOM element for a given item.
 * Uses the item's current equipped state at render time (fresh check).
 */
function buildInventoryCard(item: EquipableItem): HTMLElement {
  const char = activeCharacter!;
  const isEquipped = char.equipment[item.slot]?.id === item.id;
  const canEquip = !item.allowedClasses || item.allowedClasses.includes(char.classType);

  const card = document.createElement('div');
  card.className = 'inventory-item';
  if (isEquipped) card.classList.add('selected-equipped');

  // Gacha badge
  const isGachaItem = playerInventory.some(g => g === item);

  const iconSpan = document.createElement('span');
  iconSpan.className = 'item-icon';
  iconSpan.textContent = getSlotIcon(item);

  const infoDiv = document.createElement('div');
  infoDiv.className = 'inv-item-info';

  const header = document.createElement('div');
  header.className = 'inv-item-header';

  const name = document.createElement('span');
  name.className = 'inv-item-name';
  name.textContent = item.name;

  const rarity = document.createElement('span');
  rarity.className = `inv-item-rarity-badge badge-${item.rarity}`;
  const rarityJp: Record<string, string> = { common: '一般', rare: '希少', epic: '叙事', legendary: '伝説' };
  rarity.textContent = rarityJp[item.rarity] ?? item.rarity;

  if (isGachaItem) {
    const gachaBadge = document.createElement('span');
    gachaBadge.className = 'inv-item-rarity-badge';
    gachaBadge.style.cssText = 'background:rgba(255,215,0,0.15);color:#ffd700;border-color:rgba(255,215,0,0.3);margin-left:4px';
    gachaBadge.textContent = '✨ ガチャ';
    header.appendChild(name);
    header.appendChild(rarity);
    header.appendChild(gachaBadge);
  } else {
    header.appendChild(name);
    header.appendChild(rarity);
  }

  const desc = document.createElement('span');
  desc.className = 'inv-item-desc';
  desc.textContent = item.description;

  const statsBadge = document.createElement('span');
  statsBadge.className = 'inv-item-stats-badge';
  statsBadge.textContent = getItemBonusSummary(item);

  infoDiv.appendChild(header);
  infoDiv.appendChild(desc);
  infoDiv.appendChild(statsBadge);

  const req = document.createElement('span');
  req.className = 'inv-item-req';
  if (item.allowedClasses) {
    const allowedNames = item.allowedClasses.map(c => CLASS_DEFINITIONS[c]!.name).join('/');
    req.textContent = `${allowedNames} 専用`;
    if (!canEquip) req.classList.add('inv-item-req-error');
  } else {
    req.textContent = '全職業装備可能';
  }

  card.appendChild(iconSpan);
  card.appendChild(infoDiv);
  card.appendChild(req);

  card.onclick = () => {
    // Re-check equipped state at click time
    const nowEquipped = activeCharacter!.equipment[item.slot]?.id === item.id;
    if (nowEquipped) {
      const msg = unequipItem(activeCharacter!, item.slot);
      if (msg) { addLog(`装備解除: ${msg}`, 'equip'); updateUI(); }
    } else {
      const result = equipItem(activeCharacter!, item);
      if (result.success) { addLog(`装備完了: ${result.message}`, 'equip'); updateUI(); }
      else { addLog(`⚠️ 装備失敗: ${result.reason}`, 'error'); }
    }
  };

  return card;
}

/**
 * Render inventory list containing only player's owned items
 */
function renderInventory(): void {
  if (!activeCharacter) return;

  inventoryContainer.innerHTML = '';

  if (playerInventory.length === 0) {
    const emptyNotice = document.createElement('div');
    emptyNotice.className = 'empty-inventory-notice';
    emptyNotice.innerHTML = '📦 <strong>インベントリは空です</strong><br><span style="font-size:0.85rem; opacity:0.8; margin-top:0.4rem; display:inline-block;">ガチャ（装備召喚）で強力な武器・防具・装飾品を獲得しましょう！</span>';
    inventoryContainer.appendChild(emptyNotice);
    return;
  }

  playerInventory.forEach(item => {
    inventoryContainer.appendChild(buildInventoryCard(item));
  });
}

/**
 * Dice Rolling Stat Simulator (Visual scroll)
 */
function animateStatRoll(previewEl: HTMLElement, stats: Stats, callback: () => void): void {
  previewEl.classList.remove('hidden');
  previewEl.innerHTML = '';
  
  const statsKeys: StatType[] = ['hp', 'mp', 'atk', 'def', 'spd', 'matk', 'mdef'];
  const rollItems: HTMLElement[] = [];
  
  statsKeys.forEach(key => {
    const item = document.createElement('div');
    item.className = 'stat-roll-item';
    item.innerHTML = `<span>${key.toUpperCase()}:</span> <strong class="rolling-glow">--</strong>`;
    previewEl.appendChild(item);
    rollItems.push(item);
  });
  
  let rollTick = 0;
  const rollInterval = setInterval(() => {
    rollItems.forEach((item, index) => {
      const key = statsKeys[index]!;
      const randomOffset = Math.floor(Math.random() * 20);
      item.querySelector('strong')!.textContent = (stats[key] + randomOffset).toString();
    });
    rollTick++;
    if (rollTick > 8) {
      clearInterval(rollInterval);
      rollItems.forEach((item, index) => {
        const key = statsKeys[index]!;
        const valEl = item.querySelector('strong')!;
        valEl.textContent = stats[key].toString();
        valEl.className = '';
      });
      callback();
    }
  }, 50);
}

/**
 * Redraw Entire Dashboard UI sheets
 */
function updateCompanionAffectionUI(): void {
  if (!activeCharacter) return;

  const affection = Math.max(0, Math.min(100, activeCharacter.companion.affection));
  const affectionFill = document.getElementById('comp-affection-fill')!;
  const betrayalBadge = document.getElementById('betrayal-warning-badge')!;
  const daysInnBadge = document.getElementById('days-since-inn-badge')!;

  // Update text and bar width
  compAffectionText.textContent = `${affection} / 100`;
  affectionFill.style.width = `${affection}%`;

  // Update bar color class
  affectionFill.classList.remove('affection-low', 'affection-danger');
  if (affection <= 30) {
    affectionFill.classList.add('affection-danger');
  } else if (affection <= 55) {
    affectionFill.classList.add('affection-low');
  }

  // Betrayal warning
  if (affection <= 30) {
    betrayalBadge.classList.remove('hidden');
  } else {
    betrayalBadge.classList.add('hidden');
  }

  // Days since inn badge
  const days = activeCharacter.daysSinceLastInn;
  daysInnBadge.textContent = `🛏️ 宿泊: ${days}日前`;
  daysInnBadge.classList.remove('badge-inn-warn', 'badge-inn-danger');
  if (days >= 4) {
    daysInnBadge.classList.add('badge-inn-danger');
  } else if (days >= 3) {
    daysInnBadge.classList.add('badge-inn-warn');
  }
}

function updateInnStatusUI(): void {
  if (!activeCharacter) return;

  const days = activeCharacter.daysSinceLastInn;
  const affection = Math.max(0, Math.min(100, activeCharacter.companion.affection));

  // Update inn card info items
  innDaysDisplay.textContent = days === 0 ? 'まだ宿泊なし' : `${days}日前`;

  // Affection status label
  if (affection >= 70) {
    innAffectionStatus.textContent = '😊 良好';
    innAffectionStatus.style.color = 'var(--success-color)';
  } else if (affection >= 50) {
    innAffectionStatus.textContent = '😐 普通';
    innAffectionStatus.style.color = 'var(--accent-color)';
  } else if (affection >= 30) {
    innAffectionStatus.textContent = '😟 低下中';
    innAffectionStatus.style.color = 'var(--accent-color)';
  } else {
    innAffectionStatus.textContent = '💢 裏切り危機';
    innAffectionStatus.style.color = 'var(--danger-color)';
  }

  // Danger warning box
  if (days >= 3) {
    innDangerWarning.classList.remove('hidden');
  } else {
    innDangerWarning.classList.add('hidden');
  }
}

function updateUI(): void {
  if (!activeCharacter) return;
  
  const classDef = CLASS_DEFINITIONS[activeCharacter.classType]!;
  const baseStats = getBaseStatsAtLevel(activeCharacter);
  const effectiveStats = calculateEffectiveStats(activeCharacter);
  
  // 1. Character Avatar headers
  if (activeCharacter.avatarUrl) {
    avatarWrapper.innerHTML = `<img src="${activeCharacter.avatarUrl}" alt="Avatar">`;
    battlePlayerAvatar.innerHTML = `<img src="${activeCharacter.avatarUrl}" alt="Avatar">`;
  } else {
    avatarWrapper.innerHTML = `<span id="char-avatar" class="char-avatar">${classDef.icon}</span>`;
    battlePlayerAvatar.innerHTML = classDef.icon;
  }
  
  displayNameEl.textContent = activeCharacter.name;
  displayClassEl.textContent = classDef.name;
  displayLevelEl.textContent = activeCharacter.level.toString();
  
  // 2. EXP bar
  const expNeeded = activeCharacter.level * 100;
  displayExpTextEl.textContent = `${activeCharacter.exp} / ${expNeeded}`;
  displayExpFillEl.style.width = `${Math.min(100, (activeCharacter.exp / expNeeded) * 100)}%`;
  
  // 3. Render Stats numbers
  const renderStatRow = (baseEl: HTMLElement, calcEl: HTMLElement, stat: StatType) => {
    baseEl.textContent = baseStats[stat].toString();
    calcEl.textContent = effectiveStats[stat].toString();
    
    if (effectiveStats[stat] > baseStats[stat]) {
      calcEl.className = 'calc-val stat-buffed';
    } else if (effectiveStats[stat] < baseStats[stat]) {
      calcEl.className = 'calc-val stat-debuffed';
    } else {
      calcEl.className = 'calc-val';
    }
  };
  
  renderStatRow(statHpBase, statHpCalc, 'hp');
  renderStatRow(statMpBase, statMpCalc, 'mp');
  renderStatRow(statAtkBase, statAtkCalc, 'atk');
  renderStatRow(statDefBase, statDefCalc, 'def');
  renderStatRow(statSpdBase, statSpdCalc, 'spd');
  renderStatRow(statMatkBase, statMatkCalc, 'matk');
  renderStatRow(statMdefBase, statMdefCalc, 'mdef');

  // Cap values
  if (activeCharacter.currentHp > effectiveStats.hp) {
    activeCharacter.currentHp = effectiveStats.hp;
  }
  if (activeCharacter.currentMp > effectiveStats.mp) {
    activeCharacter.currentMp = effectiveStats.mp;
  }

  // 4. Battle Screen Player Details
  battlePlayerName.textContent = activeCharacter.name;
  battlePlayerClass.textContent = `${classDef.name} (Lv.${activeCharacter.level})`;
  battlePlayerHpText.textContent = `${activeCharacter.currentHp} / ${effectiveStats.hp}`;
  battlePlayerHpFill.style.width = `${Math.max(0, Math.min(100, (activeCharacter.currentHp / effectiveStats.hp) * 100))}%`;
  battlePlayerMpText.textContent = `${activeCharacter.currentMp} / ${effectiveStats.mp}`;
  battlePlayerMpFill.style.width = `${Math.max(0, Math.min(100, (activeCharacter.currentMp / effectiveStats.mp) * 100))}%`;

  // 5. Battle Screen Enemy Details
  if (activeEnemy) {
    battleEnemyName.textContent = `${activeEnemy.name} (Lv.${activeEnemy.level})`;
    // Show monster sprite if available, else fall back to emoji icon
    if (activeEnemy.imageUrl) {
      battleEnemyAvatar.innerHTML = `<img src="${activeEnemy.imageUrl}" alt="${activeEnemy.name}" class="enemy-sprite">`;
    } else {
      battleEnemyAvatar.innerHTML = `<span class="enemy-art">${activeEnemy.icon}</span>`;
    }
    battleEnemyHpText.textContent = `${activeEnemy.hp} / ${activeEnemy.maxHp}`;
    battleEnemyHpFill.style.width = `${Math.max(0, (activeEnemy.hp / activeEnemy.maxHp) * 100)}%`;
    battleEnemyReward.textContent = `+${activeEnemy.rewardExp} EXP`;
  }

  // 6. Companion details HUD
  const comp = activeCharacter.companion;
  displayCompName.textContent = comp.name;
  displayCompClass.textContent = CLASS_DEFINITIONS[comp.classType]!.name;
  if (comp.avatarUrl) {
    compAvatarWrapper.innerHTML = `<img src="${comp.avatarUrl}" alt="Companion">`;
  } else {
    compAvatarWrapper.innerHTML = `<span class="comp-avatar">${CLASS_DEFINITIONS[comp.classType]!.icon}</span>`;
  }
  compStatHp.textContent = comp.stats.hp.toString();
  compStatMp.textContent = comp.stats.mp.toString();
  compStatAtk.textContent = comp.stats.atk.toString();
  compStatDef.textContent = comp.stats.def.toString();
  compStatSpd.textContent = comp.stats.spd.toString();

  // 7. Companion affection and inn status
  updateCompanionAffectionUI();
  updateInnStatusUI();

  // 8. Gold HUD
  displayGold.textContent = `${activeCharacter.gold} G`;

  // 9. Equipment slots rendering
  renderSlot('weapon', slotWeapon);
  renderSlot('shield', slotShield);
  renderSlot('armor', slotArmor);
  renderSlot('accessory', slotAccessory);

  // 10. Inventory list
  renderInventory();
}

/**
 * Spawns the monster depending on stage
 */
function spawnStageEnemy(stage: 1 | 2 | 3 | 4 | 5 | 6 | 7): void {
  currentStage = stage;
  isPlayerDefending = false;
  
  const updateNodeState = (node: HTMLElement, nodeStage: number) => {
    node.className = 'quest-node';
    if (nodeStage < currentStage) {
      node.classList.add('completed');
    } else if (nodeStage === currentStage) {
      node.classList.add('active');
    }
  };

  updateNodeState(stageNode1, 1);
  updateNodeState(stageNode2, 2);
  updateNodeState(stageNode3, 3);
  updateNodeState(stageNode4, 4);
  updateNodeState(stageNode5, 5);
  updateNodeState(stageNode6, 6);
  updateNodeState(stageNode7, 7);

  const toggleLine = (line: HTMLElement, lineStage: number) => {
    if (currentStage > lineStage) {
      line.classList.add('active');
    } else {
      line.classList.remove('active');
    }
  };
  toggleLine(connector1, 1);
  toggleLine(connector2, 2);
  toggleLine(connector3, 3);
  toggleLine(connector4, 4);
  toggleLine(connector5, 5);
  toggleLine(connector6, 6);

  if (stage === 7) {
    if (!activeCharacter) return;
    if (activeCharacter.alignment >= 0) {
      stageNode7Name.textContent = '魔王';
      activeEnemy = {
        name: '暗黒魔王 ディアボロス',
        level: 58,
        maxHp: 1400,
        hp: 1400,
        atk: 135,
        def: 65,
        icon: '👿',
        imageUrl: '/img/maou.png',
        rewardExp: 2000
      };
      addLog(`最終試練：[${activeEnemy.name} (Lv.58)] が王座より降臨しました！`, 'error');
    } else {
      stageNode7Name.textContent = '仲間';
      activeEnemy = {
        name: `${activeCharacter.companion.name} (光の勇者)`,
        level: 62,
        maxHp: 1600,
        hp: 1600,
        atk: 145,
        def: 72,
        icon: '👼',
        imageUrl: '/img/maou.png',
        rewardExp: 2500
      };
      addLog(`宿命の戦い：かつての友、[${activeEnemy.name} (Lv.62)] が光の聖剣を構えて立ち塞がります！`, 'error');
    }
  } else {
    const template = ENEMY_TEMPLATES[stage as 1 | 2 | 3 | 4 | 5 | 6]!;
    activeEnemy = {
      ...template,
      hp: template.maxHp
    };
    addLog(`クエスト Stage ${stage}: [${activeEnemy.name}] が出現しました！`, 'system');
  }

  updateUI();
  // Ensure battle buttons are enabled whenever a new enemy spawns
  toggleBattleControls(true);
}

/**
 * Alignment-based choices screen between combat stages
 */
function triggerCompanionSupport(): void {
  if (!activeCharacter || !activeEnemy) return;

  const supportChance = 0.2 + (activeCharacter.companion.affection / 100) * 0.6;
  if (Math.random() > supportChance) return;

  const playerStats = calculateEffectiveStats(activeCharacter);
  const companion = activeCharacter.companion;
  const healThreshold = playerStats.hp * 0.45;
  const compCard = document.getElementById('companion-card');

  if (activeCharacter.currentHp <= healThreshold) {
    const healAmt = Math.max(8, Math.round(companion.stats.matk * 0.8 + activeCharacter.level * 2));
    activeCharacter.currentHp = Math.min(playerStats.hp, activeCharacter.currentHp + healAmt);
    spawnDamagePop(battlePlayerCard, `+${healAmt}`, 'heal');
    addLog(`💗 [仲間支援] ${companion.name} がヒールで ${healAmt} 回復しました！`, 'combat-spell');
  } else {
    const supportDamage = Math.max(5, Math.round(companion.stats.atk * 0.7 + activeCharacter.level * 1.5));
    activeEnemy.hp = Math.max(0, activeEnemy.hp - supportDamage);
    spawnDamagePop(battleEnemyCard, `${supportDamage}`, 'dealt');
    addLog(`✨ [仲間支援] ${companion.name} が援護攻撃を放ち、${activeEnemy.name} に ${supportDamage} ダメージ！`, 'combat-atk');
  }

  // Flash companion card cyan (support)
  if (compCard) {
    compCard.classList.add('comp-support-flash');
    setTimeout(() => compCard.classList.remove('comp-support-flash'), 500);
  }

  updateUI();
}

function triggerCompanionBetrayal(): void {
  if (!activeCharacter) return;

  const compCard = document.getElementById('companion-card');
  activeCharacter.companion.affection = Math.max(0, activeCharacter.companion.affection - 20);
  addLog(`⚠️ ${activeCharacter.companion.name} の不信感が爆発し、あなたを裏切り始めました！`, 'error');
  if (activeCharacter.currentHp > 0) {
    const betrayalDamage = Math.max(8, Math.round(calculateEffectiveStats(activeCharacter).hp * 0.12));
    activeCharacter.currentHp = Math.max(0, activeCharacter.currentHp - betrayalDamage);
    spawnDamagePop(battlePlayerCard, `裏切り! ${betrayalDamage}`, 'taken');
    addLog(`💥 [裏切り] ${activeCharacter.companion.name} の一撃で ${betrayalDamage} ダメージを受けました。`, 'combat-dmg');
  }
  // Flash companion card red (betrayal)
  if (compCard) {
    compCard.classList.add('comp-betray-flash');
    setTimeout(() => compCard.classList.remove('comp-betray-flash'), 600);
  }
  updateUI();
}

function advanceInnDayProgress(): void {
  if (!activeCharacter) return;

  activeCharacter.daysSinceLastInn += 1;
  if (activeCharacter.daysSinceLastInn >= 3) {
    const affectionDrop = 10 + (activeCharacter.daysSinceLastInn - 2) * 5;
    activeCharacter.companion.affection = Math.max(0, activeCharacter.companion.affection - affectionDrop);
    addLog(`🕰️ ${activeCharacter.daysSinceLastInn}日間宿に泊まらなかったため、${activeCharacter.companion.name} の好感度が ${affectionDrop} 低下しました。`, 'error');
    if (activeCharacter.companion.affection <= 20 || activeCharacter.daysSinceLastInn >= 4) {
      triggerCompanionBetrayal();
    }
  }
  updateUI();
}

function showGameOver(message: string): void {
  if (!activeCharacter) return;

  appHeader.classList.add('hidden');
  characterCard.classList.add('hidden');
  companionCard.classList.add('hidden');
  equipmentCard.classList.add('hidden');
  gachaCard.classList.add('hidden');
  inventoryCard.classList.add('hidden');
  effectsCard.classList.add('hidden');
  innCard.classList.add('hidden');
  simulationPanel.classList.add('hidden');
  storyCard.classList.add('hidden');
  endingCard.classList.add('hidden');
  speechBubbleBox.classList.add('hidden');
  gameOverCard.classList.remove('hidden');
  gameOverText.textContent = `${message}\n\n--- 戦斗記録 ---\n健消強たれたステージ: ${currentStage}\nLv.${activeCharacter.level}\n仲間の好感度: ${Math.round(activeCharacter.companion.affection)}\n${activeCharacter.companion.name}とともに陶された日数: ${activeCharacter.daysSinceLastInn}日`;
}

function triggerStageChoiceScreen(stageCompleted: 1 | 2 | 3 | 4 | 5 | 6): void {
  if (!activeCharacter) return;

  appHeader.classList.add('hidden');
  characterCard.classList.add('hidden');
  companionCard.classList.add('hidden');
  equipmentCard.classList.add('hidden');
  gachaCard.classList.add('hidden');
  inventoryCard.classList.add('hidden');
  effectsCard.classList.add('hidden');
  simulationPanel.classList.add('hidden');

  storyCard.classList.remove('hidden');
  btnStartQuest.classList.add('hidden');
  storyChoicesBox.classList.remove('hidden');
  storyChoicesList.innerHTML = '';

  const eventDetails = STORY_EVENTS[stageCompleted]!;
  const parsedNarration = eventDetails.narration
    .replace(/\[Name\]/g, activeCharacter.name)
    .replace(/\[CompName\]/g, activeCharacter.companion.name);

  runTypewriter(storyText, parsedNarration, () => {
    if (stageCompleted === 6) {
      createAlignmentBranchChoices();
    } else {
      eventDetails.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = `btn-choice btn-choice-${choice.choiceClass}`;
        btn.textContent = choice.text;
        btn.addEventListener('click', () => {
          applyChoiceResult(choice, stageCompleted);
        });
        storyChoicesList.appendChild(btn);
      });
    }
  });
}

function applyChoiceResult(choice: StoryChoice, stageCompleted: 1 | 2 | 3 | 4 | 5 | 6): void {
  if (!activeCharacter) return;

  activeCharacter.alignment += choice.alignEffect;
  if (choice.goldReward) {
    activeCharacter.gold += choice.goldReward;
  }
  
  addLog(choice.logMessage, choice.alignEffect >= 0 ? 'levelup' : 'error');

  storyChoicesBox.classList.add('hidden');
  storyText.textContent = `選択：${choice.text}\n\n旅は進んでいく。`;

  btnStartQuest.classList.remove('hidden');
  btnStartQuest.disabled = false;
  
  const nextStage = (stageCompleted + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  btnStartQuest.onclick = () => {
    storyCard.classList.add('hidden');
    storyChoicesBox.classList.add('hidden');
    
    appHeader.classList.remove('hidden');
    characterCard.classList.remove('hidden');
    companionCard.classList.remove('hidden');
    equipmentCard.classList.remove('hidden');
    gachaCard.classList.remove('hidden');
    inventoryCard.classList.remove('hidden');
    effectsCard.classList.remove('hidden');
    innCard.classList.remove('hidden');
    simulationPanel.classList.remove('hidden');

    btnStartQuest.classList.add('hidden');
    btnStartQuest.disabled = true;
    spawnStageEnemy(nextStage);
    updateUI();
  };
}

function createAlignmentBranchChoices(): void {
  if (!activeCharacter) return;

  const list = storyChoicesList;
  list.innerHTML = '';
  const compName = activeCharacter.companion.name;
  
  if (activeCharacter.alignment >= 0) {
    const descText = `「[Name]、魔王の波動が高まっています…！」\n\n仲間の[CompName]が声を震わせる。魔王の影が呪いとなり、彼女の体を侵食し始めている。\n\n魔王ディアボロスが囁く。「その娘を討つか、我が覇道に下るか選択せよ」`;
    storyText.textContent = descText
      .replace(/\[Name\]/g, activeCharacter.name)
      .replace(/\[CompName\]/g, compName);

    const choiceA: StoryChoice = {
      text: `☀️「セリアを絶対に救い出す！魔王、その汚い手を引っ込めろ！」`,
      alignEffect: 2,
      logMessage: 'セリアを救うため、正義の勇者としての闘志を燃やした！',
      choiceClass: 'light'
    };
    
    const choiceB: StoryChoice = {
      text: `🌙「呪われた者は救えない。世界を救うために彼女ごと魔王を叩き斬る」`,
      alignEffect: -2,
      logMessage: '冷酷な決意。魔王とセリア両方を討つことを選んだ。',
      choiceClass: 'dark'
    };

    [choiceA, choiceB].forEach(choice => {
      const btn = document.createElement('button');
      btn.className = `btn-choice btn-choice-${choice.choiceClass}`;
      btn.textContent = choice.text;
      btn.addEventListener('click', () => applyChoiceResult(choice, 6));
      list.appendChild(btn);
    });
  } else {
    const descText = `「ごめんなさい、[Name]…これ以上、あなたを野放しにはできない。あなたの力は魔王と同等、いや、それ以上に世界を滅ぼす闇の権化となってしまった…！」\n\n悲痛な瞳で[CompName]が武器を構える。彼女の後ろには光の加護が集約されている。`;
    storyText.textContent = descText
      .replace(/\[CompName\]/g, compName);

    const choiceA: StoryChoice = {
      text: `☀️「すまない…俺は道を踏み外していた。セリア、君の剣で目を覚まさせてくれ」`,
      alignEffect: 5,
      logMessage: '仲間の涙に心を打たれ、正気を取り戻して光の剣を構え直した。',
      choiceClass: 'light'
    };

    const choiceB: StoryChoice = {
      text: `🌙「やはり裏切ったか…いいだろう、光の小娘。お前を屠り、俺が新たなる闇の王となる！」`,
      alignEffect: -5,
      logMessage: '闇の契約を完全に結んだ。かつての仲間を宿敵として見定めた。',
      choiceClass: 'dark'
    };

    [choiceA, choiceB].forEach(choice => {
      const btn = document.createElement('button');
      btn.className = `btn-choice btn-choice-${choice.choiceClass}`;
      btn.textContent = choice.text;
      btn.addEventListener('click', () => applyChoiceResult(choice, 6));
      list.appendChild(btn);
    });
  }
}

/**
 * Avatar Upload Change Handlers
 */
charAvatarInput.addEventListener('change', (e) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) {
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        selectedAvatarUrl = event.target.result as string;
        avatarPreviewImg.src = selectedAvatarUrl;
        avatarUploadPreview.classList.remove('hidden');
        addLog('主人公の画像をロードしました。', 'system');
      }
    };
    reader.readAsDataURL(file);
  }
});

btnRemoveAvatar.addEventListener('click', () => {
  charAvatarInput.value = '';
  selectedAvatarUrl = null;
  avatarPreviewImg.src = '';
  avatarUploadPreview.classList.add('hidden');
  addLog('主人公の画像をクリアしました。', 'system');
});

compAvatarInput.addEventListener('change', (e) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) {
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        selectedCompanionAvatarUrl = event.target.result as string;
        compAvatarPreviewImg.src = selectedCompanionAvatarUrl;
        compAvatarUploadPreview.classList.remove('hidden');
        addLog('仲間の画像をロードしました。', 'system');
      }
    };
    reader.readAsDataURL(file);
  }
});

btnRemoveCompAvatar.addEventListener('click', () => {
  compAvatarInput.value = '';
  selectedCompanionAvatarUrl = null;
  compAvatarPreviewImg.src = '';
  compAvatarUploadPreview.classList.add('hidden');
  addLog('仲間の画像をクリアしました。', 'system');
});

/**
 * Dice stats triggers
 */
btnRollPlayerStats.addEventListener('click', () => {
  const classRadio = document.querySelector('input[name="char-class"]:checked') as HTMLInputElement;
  const classVal = classRadio.value as CharacterClassType;
  rolledPlayerStats = rollDiceStats(classVal);
  
  animateStatRoll(playerStatsPreview, rolledPlayerStats, () => {
    addLog(`主人公の初期能力値が決定しました！`, 'system');
  });
});

btnRollCompStats.addEventListener('click', () => {
  const classRadio = document.querySelector('input[name="comp-class"]:checked') as HTMLInputElement;
  const classVal = classRadio.value as CharacterClassType;
  rolledCompanionStats = rollDiceStats(classVal);
  
  animateStatRoll(compStatsPreview, rolledCompanionStats, () => {
    addLog(`仲間の初期能力値が決定しました！`, 'system');
  });
});

/**
 * Create Character Form submit hook
 */
createForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = charNameInput.value.trim() || 'アルス';
  const classRadio = document.querySelector('input[name="char-class"]:checked') as HTMLInputElement;
  const classVal = classRadio.value as CharacterClassType;

  const compName = compNameInput.value.trim() || 'セリア';
  const compClassRadio = document.querySelector('input[name="comp-class"]:checked') as HTMLInputElement;
  const compClassVal = compClassRadio.value as CharacterClassType;

  if (!rolledPlayerStats) rolledPlayerStats = rollDiceStats(classVal);
  if (!rolledCompanionStats) rolledCompanionStats = rollDiceStats(compClassVal);

  const companionNPC: CompanionNPC = {
    name: compName,
    classType: compClassVal,
    stats: rolledCompanionStats,
    avatarUrl: selectedCompanionAvatarUrl ?? undefined,
    affection: 80
  };

  activeCharacter = createCharacter(name, classVal, selectedAvatarUrl ?? undefined, rolledPlayerStats, companionNPC);
  currentStage = 1;
  isPlayerDefending = false;

  creatorCard.classList.add('hidden');
  appHeader.classList.add('hidden');
  innCard.classList.add('hidden');
  storyCard.classList.remove('hidden');
  storyChoicesBox.classList.add('hidden');
  btnStartQuest.classList.add('hidden');

  const prologueNarrative = `突如として光に包まれ、見知らぬ地に降り立った[Name]。\n\nそこは、邪悪なる魔王の軍勢によって脅かされし異世界「アエテリア」であった。\n\n「異世界転生…本当にそんなことがあるなんて」\n\n呟く[Name]に駆け寄る少女がいた。その名は[CompName]。\n\n「召喚の儀式は成功したのですね！私は[CompClass]の[CompName]。どうか、この世界を支配せんとする魔王を討伐するため、力を貸してください！」\n\n[Name]は、己の運命を選択する第一歩を踏み出す――。`;
  const classJp = CLASS_DEFINITIONS[compClassVal]!.name;
  
  const parsedIntro = prologueNarrative
    .replace(/\[Name\]/g, name)
    .replace(/\[CompName\]/g, compName)
    .replace(/\[CompClass\]/g, classJp);
    
  runTypewriter(storyText, parsedIntro, () => {
    btnStartQuest.classList.remove('hidden');
    btnStartQuest.disabled = false;
  });
});

/**
 * Start adventure quest (prologue → Stage 1).
 * Extracted to a named function so resetGame() can restore it after restart.
 */
function startAdventureFromPrologue(): void {
  if (!activeCharacter) return;

  storyCard.classList.add('hidden');
  storyChoicesBox.classList.add('hidden');

  appHeader.classList.remove('hidden');
  characterCard.classList.remove('hidden');
  companionCard.classList.remove('hidden');
  equipmentCard.classList.remove('hidden');
  gachaCard.classList.remove('hidden');
  inventoryCard.classList.remove('hidden');
  effectsCard.classList.remove('hidden');
  innCard.classList.remove('hidden');
  simulationPanel.classList.remove('hidden');
  btnStartQuest.classList.add('hidden');
  btnStartQuest.disabled = true;

  addLog('異世界の冒険へ旅立ちました。アリーナの扉が開かれます。', 'system');

  spawnStageEnemy(1);
  updateUI();
}

btnStartQuest.onclick = startAdventureFromPrologue;

/**
 * NPC Companion Talk Dialogues trigger
 */
btnTalkCompanion.addEventListener('click', () => {
  if (!activeCharacter) return;

  speechBubbleBox.classList.remove('hidden');
  
  let quotes: string[] = [];

  if (activeCharacter.alignment >= 0) {
    switch (currentStage) {
      case 1: quotes = [`「一緒に魔王を倒しましょう、${activeCharacter.name}さん！まずはスライムを片付けちゃいましょう！」`, `「私の回復魔法でしっかりサポートしますね！」`]; break;
      case 2: quotes = [`「ゴブリンたちは集団で襲ってきます。気をつけてください！」`, `「${activeCharacter.name}さんが戦ってくれるなら、私は心強いです！」`]; break;
      case 3: quotes = [`「大クモの毒はとても厄介です。少しでも痺れたら言ってください！」`, `「洞窟は暗いですね…私の聖なる光で照らします」`]; break;
      case 4: quotes = [`「盗賊たちに襲われましたね…でも、命を奪わずに衛兵に渡してくれて安心しました。」`, `「旅路にはいろんな人がいますね。油断しないようにしましょう」`]; break;
      case 5: quotes = [`「オーガの怪力、凄まじい破壊力でした…！${activeCharacter.name}さん、怪我はありませんか？」`, `「天と地の神々に誓って、私は${activeCharacter.name}さんを信じています！」`]; break;
      case 6: quotes = [`「ついに滅びの竜まで倒しましたね！世界が私たちの勝利を待ち望んでいます！」`, `「私たちの力を合わせれば、魔王城の扉を開けるはずです！」`]; break;
      case 7: quotes = [`「魔王の呪いになんて、私は負けません！${activeCharacter.name}さん、光の力を信じて！」`]; break;
    }
  } else {
    switch (currentStage) {
      case 1: quotes = [`「${activeCharacter.name}さん…？なんだか目が少し怖いです…大丈夫ですか？」`, `「魔王を倒すためとはいえ、無理はしないでくださいね」`]; break;
      case 2: quotes = [`「魔物を無残に切り刻むあなたの剣…少し容赦がなさすぎる気がします…」`, `「そんな冷たい顔で見つめないでください…」`]; break;
      case 3: quotes = [`「混沌の魔結晶を吸収するなんて！そんなことしたら心まで闇に染まってしまいます！」`, `「…あなたから、魔物のような波動を感じます…嘘ですよね…？」`]; break;
      case 4: quotes = [`「盗賊を脅してお金を奪い取るなんて…私たちは本当に正義の旅をしているのですか…？」`, `「お金は大切ですが、やり方が間違っています！」`]; break;
      case 5: quotes = [`「${activeCharacter.name}、お願いです…昔の優しいあなたに戻って…このままでは…」`, `「私はあなたについていくのが、だんだん怖くなってきました…」`]; break;
      case 6: quotes = [`「あなたは魔王を倒して、自分が新たなる闇の支配者になろうとしているのですか…？」`, `「…もしそうなら、私はあなたの刃になれません」`]; break;
      case 7: quotes = [`「私は世界を護るため、あなたを討ちます！これ以上闇を広げさせない！」`]; break;
    }
  }

  const selectedQuote = quotes[Math.floor(Math.random() * quotes.length)] || '「共に行きましょう！」';
  compSpeechText.textContent = selectedQuote;
});

/**
 * Gacha roll action
 */
btnDrawGacha.addEventListener('click', () => {
  if (!activeCharacter) return;

  const cost = 50;
  if (activeCharacter.gold < cost) {
    addLog(`❌ [召喚失敗] ゴールドが不足しています！ (所持: ${activeCharacter.gold} G / 必要: ${cost} G)`, 'error');
    spawnDamagePop(gachaCard, 'NO GOLD', 'msg');
    return;
  }

  activeCharacter.gold -= cost;

  // Pull from gacha — clone the template and assign a unique instanceId
  // so pulling the same weapon multiple times creates separate inventory entries
  const template = pullGacha(activeCharacter.classType);
  const drawnWeapon: EquipableItem = {
    ...template,
    id: `gacha_${template.id}_${Date.now()}_${Math.floor(Math.random() * 9999)}`
  };

  // Add to player's personal gacha inventory
  playerInventory.push(drawnWeapon);

  addLog(`🎲 [装備召喚] 50G を消費して召喚を実行しました！`, 'system');
  addLog(`✨ 装備獲得: **${drawnWeapon.name}** [レア度:${drawnWeapon.rarity.toUpperCase()}] を手に入れました！ インベントリに追加されました。`, 'levelup');

  gachaResultBox.classList.remove('hidden');
  gachaResultCard.innerHTML = '';
  gachaResultCard.className = `gacha-result-card rarity-${drawnWeapon.rarity}-border`;

  const rarityJp: Record<string, string> = { common: '一般', rare: '希少', epic: '叙事', legendary: '伝説' };

  const rarityBadge = document.createElement('span');
  rarityBadge.className = `inv-item-rarity-badge badge-${drawnWeapon.rarity}`;
  rarityBadge.textContent = rarityJp[drawnWeapon.rarity] ?? drawnWeapon.rarity;

  const infoDiv = document.createElement('div');
  infoDiv.className = 'item-info';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'item-name';
  nameSpan.textContent = drawnWeapon.name;

  const statSpan = document.createElement('span');
  statSpan.className = 'item-bonus-text';
  statSpan.style.color = 'var(--success-color)';
  statSpan.textContent = getItemBonusSummary(drawnWeapon);

  infoDiv.appendChild(nameSpan);
  infoDiv.appendChild(statSpan);

  // ── 「すぐ装備する」ボタン ──
  const equipNowBtn = document.createElement('button');
  equipNowBtn.className = 'btn btn-accent btn-equip-now';
  equipNowBtn.textContent = '⚔️ すぐ装備する';
  equipNowBtn.onclick = () => {
    if (!activeCharacter) return;
    const result = equipItem(activeCharacter, drawnWeapon);
    if (result.success) {
      addLog(`⚔️ [装備] ${drawnWeapon.name} を装備しました！`, 'equip');
      equipNowBtn.textContent = '✅ 装備済み';
      equipNowBtn.disabled = true;
      updateUI();
    } else {
      addLog(`⚠️ 装備失敗: ${result.reason}`, 'error');
    }
  };

  gachaResultCard.appendChild(rarityBadge);
  gachaResultCard.appendChild(infoDiv);
  gachaResultCard.appendChild(equipNowBtn);

  spawnDamagePop(gachaCard, 'SUMMON!', 'heal');
  updateUI();
});

/**
 * Combat enemy counter attacks routines
 */
function triggerEnemyTurn(): void {
  if (!activeCharacter || !activeEnemy || activeEnemy.hp <= 0) return;

  toggleBattleControls(false);

  setTimeout(() => {
    if (!activeCharacter || !activeEnemy || activeEnemy.hp <= 0) {
      toggleBattleControls(true);
      return;
    }

    const playerStats = calculateEffectiveStats(activeCharacter);
    const factor = 0.85 + Math.random() * 0.3;
    const baseDamage = activeEnemy.atk * factor;
    
    let dmgTaken = Math.max(1, Math.round(baseDamage - playerStats.def));
    let isCrit = Math.random() < 0.15;
    if (isCrit) {
      dmgTaken = Math.round(dmgTaken * 1.5);
    }

    if (isPlayerDefending) {
      dmgTaken = Math.max(1, Math.round(dmgTaken * 0.4));
      isPlayerDefending = false;
      addLog(`🛡️ ${activeCharacter.name} は防御している！ 被ダメージを大幅に軽減しました。`, 'system');
    }

    activeCharacter.currentHp = Math.max(0, activeCharacter.currentHp - dmgTaken);
    
    battlePlayerCard.classList.add('shake');
    setTimeout(() => battlePlayerCard.classList.remove('shake'), 250);

    const popText = `${dmgTaken}${isCrit ? '!! Crit' : ''}`;
    spawnDamagePop(battlePlayerCard, popText, 'taken');
    
    addLog(`💥 [被ダメージ] ${activeEnemy.name} の反撃！ ${activeCharacter.name} に **${dmgTaken}** のダメージ！`, 'combat-dmg');

    if (activeCharacter.currentHp <= 0) {
      activeCharacter.currentHp = 0;
      addLog(`💀 ${activeCharacter.name} は倒れた！`, 'error');
      spawnDamagePop(battlePlayerCard, 'GAME OVER', 'msg');
      showGameOver(`敵の猛攻により、${activeCharacter.name} はこの戦いに敗れました。`);
      return;
    }

    updateUI();
    toggleBattleControls(true);
  }, 750);
}

function toggleBattleControls(enable: boolean): void {
  const buttons = [btnSimAttack, btnSimCast, btnSimHeal, btnSimDefend];
  buttons.forEach(btn => {
    (btn as HTMLButtonElement).disabled = !enable;
  });
}

/**
 * Combat logs and attacks bindings
 */
btnSimAttack.addEventListener('click', () => {
  if (!activeCharacter || !activeEnemy) return;
  
  const playerStats = calculateEffectiveStats(activeCharacter);
  const factor = 0.9 + Math.random() * 0.2;
  let damage = Math.round(playerStats.atk * factor);
  
  damage = Math.max(1, damage - activeEnemy.def);
  let isCrit = Math.random() < 0.12;
  if (isCrit) {
    damage = Math.round(damage * 1.6);
  }

  activeEnemy.hp = Math.max(0, activeEnemy.hp - damage);
  
  battleEnemyCard.classList.add('shake');
  setTimeout(() => battleEnemyCard.classList.remove('shake'), 250);

  spawnDamagePop(battleEnemyCard, `${damage}${isCrit ? '!! CRITICAL' : ''}`, 'dealt');
  addLog(`⚔️ [通常攻撃] ${activeCharacter.name} の一撃！ ${activeEnemy.name} に **${damage}** の物理属性ダメージ！`, 'combat-atk');

  updateUI();

  if (activeEnemy.hp <= 0) {
    handleEnemyDefeated();
  } else {
    triggerCompanionSupport();
    triggerEnemyTurn();
  }
});

btnSimCast.addEventListener('click', () => {
  if (!activeCharacter || !activeEnemy) return;
  const playerStats = calculateEffectiveStats(activeCharacter);
  
  const mpCost = 10;
  if (activeCharacter.currentMp < mpCost) {
    addLog(`❌ [呪文詠唱] MPが足りません！ (必要MP: ${mpCost}, 現在MP: ${activeCharacter.currentMp})`, 'error');
    spawnDamagePop(battlePlayerCard, 'NO MP', 'msg');
    return;
  }
  
  activeCharacter.currentMp -= mpCost;
  const factor = 0.95 + Math.random() * 0.15;
  const rawSpellDmg = (playerStats.matk * 2.2) * factor;
  
  const magicMitigation = Math.round(activeEnemy.def * 0.7);
  const damage = Math.max(1, Math.round(rawSpellDmg - magicMitigation));

  activeEnemy.hp = Math.max(0, activeEnemy.hp - damage);
  
  battleEnemyCard.classList.add('shake');
  setTimeout(() => battleEnemyCard.classList.remove('shake'), 250);

  spawnDamagePop(battleEnemyCard, `${damage} (FIRE)`, 'dealt');
  addLog(`🔮 [魔法攻撃] ${activeCharacter.name} のファイア！ (MP -${mpCost}) ${activeEnemy.name} に **${damage}** の炎属性魔法ダメージ！`, 'combat-spell');

  updateUI();

  if (activeEnemy.hp <= 0) {
    handleEnemyDefeated();
  } else {
    triggerCompanionSupport();
    triggerEnemyTurn();
  }
});

btnSimHeal.addEventListener('click', () => {
  if (!activeCharacter) return;
  const playerStats = calculateEffectiveStats(activeCharacter);
  
  const mpCost = 6;
  if (activeCharacter.currentMp < mpCost) {
    addLog(`❌ [回復呪文] MPが足りません！ (必要MP: ${mpCost}, 現在MP: ${activeCharacter.currentMp})`, 'error');
    spawnDamagePop(battlePlayerCard, 'NO MP', 'msg');
    return;
  }

  activeCharacter.currentMp -= mpCost;
  const healAmt = Math.round(playerStats.matk * 1.8 + 10);
  const prevHp = activeCharacter.currentHp;
  activeCharacter.currentHp = Math.min(playerStats.hp, activeCharacter.currentHp + healAmt);
  const actualHeal = activeCharacter.currentHp - prevHp;

  spawnDamagePop(battlePlayerCard, `+${actualHeal}`, 'heal');
  addLog(`💚 [回復呪文] ${activeCharacter.name} のヒール！ (MP -${mpCost}) HPが **${actualHeal}** 回復しました！`, 'combat-spell');

  updateUI();
  triggerCompanionSupport();
  triggerEnemyTurn();
});

btnSimDefend.addEventListener('click', () => {
  if (!activeCharacter) return;

  isPlayerDefending = true;
  spawnDamagePop(battlePlayerCard, 'DEFENDING', 'msg');
  addLog(`🛡️ [ぼうぎょ] ${activeCharacter.name} は防御の構えをとった！ 次の被ダメージを60%軽減します。`, 'system');

  triggerCompanionSupport();
  triggerEnemyTurn();
});

/**
 * Handle monster defeat
 */
function handleEnemyDefeated(): void {
  if (!activeCharacter || !activeEnemy) return;

  const earnedExp = activeEnemy.rewardExp;
  const earnedGold = currentStage * 30;
  const defeatedName = activeEnemy.name; // save before nulling
  activeCharacter.gold += earnedGold;
  advanceInnDayProgress();

  addLog(`🏆 撃破！ [${defeatedName}] を討ち果たしました！`, 'levelup');
  addLog(`🪙 討伐報酬として **${earnedGold} G** を獲得しました！`, 'system');
  spawnDamagePop(battleEnemyCard, 'DEFEATED!', 'msg');

  toggleBattleControls(false);

  const oldLevel = activeCharacter.level;
  const result = gainExp(activeCharacter, earnedExp);
  
  if (result.leveledUp) {
    const lvlText = result.levelsGained > 1 ? ` (+${result.levelsGained} LV)` : '';
    addLog(`🌟 経験値 ${earnedExp} を獲得！ ➡️ レベルアップしました！ LV ${oldLevel} ➡️ LV ${activeCharacter.level}${lvlText}！ HP/MP全回復！`, 'levelup');
    triggerLevelUpAnimation();
    spawnDamagePop(battlePlayerCard, `LEVEL UP!${lvlText}`, 'heal');
  } else {
    addLog(`✨ 経験値 ${earnedExp} を獲得！ 次のレベルまであと: ${activeCharacter.level * 100 - result.newExp} EXP`, 'system');
  }

  displayGold.textContent = `${activeCharacter.gold} G`;

  if (currentStage < 6) {
    updateUI();
    setTimeout(() => {
      triggerStageChoiceScreen(currentStage as 1 | 2 | 3 | 4 | 5);
    }, 1500);
  } else if (currentStage === 6) {
    updateUI();
    setTimeout(() => {
      triggerStageChoiceScreen(6);
    }, 1500);
  } else {
    // Stage 7 (final boss) cleared — clear enemy state before ending screen
    activeEnemy = null;
    updateUI();
    setTimeout(() => {
      triggerEndingScreen();
    }, 1500);
  }
}

/**
 * Trigger final ending narrative cinematic overlay
 */
function triggerEndingScreen(): void {
  if (!activeCharacter) return;

  appHeader.classList.add('hidden');
  characterCard.classList.add('hidden');
  companionCard.classList.add('hidden');
  equipmentCard.classList.add('hidden');
  gachaCard.classList.add('hidden');
  inventoryCard.classList.add('hidden');
  effectsCard.classList.add('hidden');
  innCard.classList.add('hidden');
  speechBubbleBox.classList.add('hidden');
  simulationPanel.classList.add('hidden');

  endingCard.classList.remove('hidden');
  btnRestartGame.classList.add('hidden');

  let endingDesc = '';
  
  if (activeCharacter.alignment >= 0) {
    endingBadge.textContent = '🎉 HERO ENDING (世界平和) 🎉';
    endingBadge.style.textShadow = '0 0 20px rgba(0, 229, 255, 0.6)';
    endingDesc = NARRATIVE_HERO_ENDING;
  } else {
    endingBadge.textContent = '💀 DEMON LORD ENDING (世界崩壊) 💀';
    endingBadge.style.textShadow = '0 0 20px rgba(255, 82, 82, 0.6)';
    endingDesc = NARRATIVE_DEMON_ENDING;
  }

  const parsedEnding = endingDesc
    .replace(/\[Name\]/g, activeCharacter.name)
    .replace(/\[CompName\]/g, activeCharacter.companion.name);

  runTypewriter(endingText, parsedEnding, () => {
    btnRestartGame.classList.remove('hidden');
  });
}

/**
 * Level-up pop animation
 */
function triggerLevelUpAnimation(): void {
  const card = document.getElementById('character-card');
  if (card) {
    card.classList.add('level-up-pop');
    setTimeout(() => {
      card.classList.remove('level-up-pop');
    }, 500);
  }
}

/**
 * Setup Buff checkbox changes hooks
 */
function setupBuffToggles(): void {
  const toggles: { checkbox: HTMLInputElement; buffType: BuffType }[] = [
    { checkbox: buffMightCheck, buffType: 'might' },
    { checkbox: buffHasteCheck, buffType: 'haste' },
    { checkbox: buffPoisonCheck, buffType: 'poison' },
    { checkbox: buffShieldCheck, buffType: 'shield' }
  ];

  toggles.forEach(({ checkbox, buffType }) => {
    checkbox.onchange = () => {
      if (!activeCharacter) return;
      
      if (checkbox.checked) {
        activeCharacter.activeBuffs.add(buffType);
        addLog(`状態変化: [${checkbox.parentNode?.querySelector('.effect-title')?.textContent?.trim() || buffType}] が付与されました。`, 'system');
      } else {
        activeCharacter.activeBuffs.delete(buffType);
        addLog(`状態変化: [${checkbox.parentNode?.querySelector('.effect-title')?.textContent?.trim() || buffType}] が解除されました。`, 'system');
      }
      
      updateUI();
    };
  });
}

setupBuffToggles();

/**
 * Inn Stay — costs 30G, resets day counter, restores HP/MP, boosts affection
 */
btnStayInn.addEventListener('click', () => {
  if (!activeCharacter) return;

  const cost = 30;
  if (activeCharacter.gold < cost) {
    addLog(`❌ [宿屋] ゴールドが足りません！ (所持: ${activeCharacter.gold} G / 必要: ${cost} G)`, 'error');
    spawnDamagePop(innCard, 'NO GOLD', 'msg');
    return;
  }

  const playerStats = calculateEffectiveStats(activeCharacter);
  activeCharacter.gold -= cost;
  activeCharacter.currentHp = playerStats.hp;
  activeCharacter.currentMp = playerStats.mp;
  activeCharacter.daysSinceLastInn = 0;

  // Affection boost for resting
  const prevAffection = activeCharacter.companion.affection;
  activeCharacter.companion.affection = Math.min(100, activeCharacter.companion.affection + 15);
  const affectionGain = activeCharacter.companion.affection - prevAffection;

  addLog(`🛏️ [宿屋] ${activeCharacter.name} は宿屋で体を休めました。(${cost} G 消費)`, 'system');
  addLog(`💗 HP と MP が全回復しました！ (HP: ${playerStats.hp} / MP: ${playerStats.mp})`, 'levelup');
  if (affectionGain > 0) {
    addLog(`😊 ${activeCharacter.companion.name} の好感度が ${affectionGain} 上昇しました！ (現在: ${activeCharacter.companion.affection})`, 'levelup');
  }

  spawnDamagePop(innCard, '宿泊完了！', 'heal');
  updateUI();
});

/**
 * Reset Application back to Character Creator
 */
function resetGame(): void {
  activeCharacter = null;
  activeEnemy = null;
  selectedAvatarUrl = null;
  selectedCompanionAvatarUrl = null;
  rolledPlayerStats = null;
  rolledCompanionStats = null;
  playerInventory = []; // clear gacha inventory on reset
  isPlayerDefending = false;
  currentStage = 1;

  // IMPORTANT: reset the start button back to prologue (Stage 1)
  // so the next new game doesn't jump to a mid-game stage
  btnStartQuest.onclick = startAdventureFromPrologue;
  
  charAvatarInput.value = '';
  avatarPreviewImg.src = '';
  avatarUploadPreview.classList.add('hidden');

  compAvatarInput.value = '';
  compAvatarPreviewImg.src = '';
  compAvatarUploadPreview.classList.add('hidden');

  playerStatsPreview.classList.add('hidden');
  playerStatsPreview.innerHTML = '';
  compStatsPreview.classList.add('hidden');
  compStatsPreview.innerHTML = '';
  
  buffMightCheck.checked = false;
  buffHasteCheck.checked = false;
  buffPoisonCheck.checked = false;
  buffShieldCheck.checked = false;
  
  characterCard.classList.add('hidden');
  companionCard.classList.add('hidden');
  equipmentCard.classList.add('hidden');
  gachaCard.classList.add('hidden');
  inventoryCard.classList.add('hidden');
  effectsCard.classList.add('hidden');
  simulationPanel.classList.add('hidden');
  storyCard.classList.add('hidden');
  endingCard.classList.add('hidden');
  gameOverCard.classList.add('hidden');
  speechBubbleBox.classList.add('hidden');
  gachaResultBox.classList.add('hidden');
  
  appHeader.classList.remove('hidden');
  creatorCard.classList.remove('hidden');
  
  consoleLogsContainer.innerHTML = '';
  addLog('召喚の儀式を初期化しました。', 'system');
}

btnResetChar.addEventListener('click', resetGame);
btnRestartGame.addEventListener('click', resetGame);
btnRestartGameover.addEventListener('click', resetGame);

// Wire clear console
btnClearConsole.addEventListener('click', () => {
  consoleLogsContainer.innerHTML = '';
  addLog('戦闘ログをクリアしました。', 'system');
});


