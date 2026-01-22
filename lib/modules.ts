
export interface MediaModule {
  id: string;
  name: string;
  core_techniques: string[];
  common_mistakes: string[];
}

export interface StyleModule {
  id: string;
  name: string; // Added name for UI display
  reference_type: string;
  core_features: string[];
  focus_priority: string[];
}

export interface UsageScenario {
  id: string;
  name: string;
  evaluation_mode: 'compare_to_target_style' | 'free_practice' | 'challenge';
}

export const MEDIA_MODULES: Record<string, MediaModule> = {
  watercolor: {
    id: "watercolor",
    name: "水彩",
    core_techniques: [
      "濕畫法控制",
      "邊緣柔化",
      "色層透明度",
      "水分比例"
    ],
    common_mistakes: [
      "顏色混濁",
      "邊緣過硬",
      "水痕失控"
    ]
  },
  digital_painting: {
    id: "digital_painting",
    name: "厚塗 (Digital)",
    core_techniques: [
      "筆觸堆疊",
      "色塊塑造",
      "邊緣虛實",
      "光影統一"
    ],
    common_mistakes: [
      "過度暈染",
      "結構鬆散",
      "髒色"
    ]
  },
  digital: {
    id: "digital",
    name: "數位板繪",
    core_techniques: [
      "筆觸堆疊",
      "色塊塑造",
      "邊緣虛實",
      "光影統一"
    ],
    common_mistakes: [
      "過度暈染",
      "結構鬆散",
      "髒色"
    ]
  },
  sketch: {
    id: "sketch",
    name: "素描/線稿",
    core_techniques: [
      "線條輕重",
      "透視準確",
      "明暗交界",
      "結構塊面"
    ],
    common_mistakes: [
      "線條毛躁",
      "比例失準",
      "灰階不明確"
    ]
  },
  pencil: {
    id: "pencil",
    name: "鉛筆素描",
    core_techniques: [
      "排線層次",
      "明暗交界",
      "虛實變化",
      "結構準確"
    ],
    common_mistakes: [
      "線條毛躁",
      "灰階不足",
      "塗抹過度"
    ]
  },
  colored_pencil: {
    id: "colored_pencil",
    name: "色鉛筆",
    core_techniques: [
      "疊色層次",
      "筆觸細膩",
      "色彩飽和",
      "留白控制"
    ],
    common_mistakes: [
      "筆觸凌亂",
      "色彩單薄",
      "過度用力"
    ]
  },
  marker: {
    id: "marker",
    name: "麥克筆",
    core_techniques: [
      "筆觸平塗",
      "色彩過渡",
      "疊色混色",
      "筆法果斷"
    ],
    common_mistakes: [
      "筆觸不均",
      "色彩滲透",
      "猶豫修改"
    ]
  },
  acrylic: {
    id: "acrylic",
    name: "壓克力",
    core_techniques: [
      "色塊平塗",
      "邊緣處理",
      "層次覆蓋",
      "色彩鮮明"
    ],
    common_mistakes: [
      "混色不勻",
      "邊緣粗糙",
      "乾燥過快"
    ]
  },
  oil: {
    id: "oil",
    name: "油畫",
    core_techniques: [
      "厚塗質感",
      "色彩銜接",
      "筆觸方向",
      "光影層次"
    ],
    common_mistakes: [
      "色彩混濁",
      "層次不清",
      "油量失控"
    ]
  },
  ink: {
    id: "ink",
    name: "鋼筆/墨水",
    core_techniques: [
      "線條流暢",
      "黑白對比",
      "排線疏密",
      "輪廓準確"
    ],
    common_mistakes: [
      "線條抖動",
      "墨色不均",
      "結構變形"
    ]
  }
};

export const STYLE_MODULES: Record<string, StyleModule> = {
  general: {
    id: "general",
    name: "通用基礎",
    reference_type: "general_standards",
    core_features: [
      "基礎結構",
      "光影邏輯",
      "畫面平衡"
    ],
    focus_priority: [
      "比例準確",
      "透視合理",
      "完成度"
    ]
  },
  loish_style: {
    id: "loish_style",
    name: "Loish 風格",
    reference_type: "style_based",
    core_features: [
      "柔和色彩過渡",
      "中彩度主色",
      "流暢人物主軸"
    ],
    focus_priority: [
      "色彩層次",
      "人物動態",
      "光影柔化"
    ]
  },
  ghibli_style: {
    id: "ghibli_style",
    name: "吉卜力背景風",
    reference_type: "style_based",
    core_features: [
      "手繪質感",
      "高明度自然光",
      "豐富環境細節"
    ],
    focus_priority: [
      "雲朵層次",
      "植被質感",
      "光影氛圍"
    ]
  }
};

export const SCENARIO_MODULES: Record<string, UsageScenario> = {
  free_practice: {
    id: "free_practice",
    name: "自由練習",
    evaluation_mode: "free_practice"
  },
  style_practice: {
    id: "style_practice",
    name: "風格練習",
    evaluation_mode: "compare_to_target_style"
  },
  challenge: {
    id: "challenge",
    name: "大師挑戰",
    evaluation_mode: "challenge"
  }
};
