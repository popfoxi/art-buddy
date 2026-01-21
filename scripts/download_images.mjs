
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const exploreGallery = [
  // ✏️ Pencil / 素描
  {
    id: 1,
    title: "手的研究",
    master: "達文西",
    medium: "pencil",
    imageUrl: "",
    prompt: "Leonardo da Vinci style sketch, study of hands, anatomical structure, soft lines, sfumato, sepia paper, renaissance art masterpiece, high detail",
    height: 400
  },
  {
    id: 2,
    title: "老人肖像素描",
    master: "林布蘭",
    medium: "pencil",
    imageUrl: "",
    prompt: "Rembrandt style sketch, portrait of an old man, strong chiaroscuro, dramatic lighting, single light source, emotional expression, rough strokes, vintage style",
    height: 450
  },
  {
    id: 3,
    title: "人體藝術素描",
    master: "艾格·席勒",
    medium: "pencil",
    imageUrl: "",
    prompt: "Egon Schiele style sketch, sitting figure drawing, expressive twisted lines, raw emotion, elongated proportions, nervous line quality, minimal color",
    height: 500
  },

  // 🖍 Colored Pencil / 色鉛筆
  {
    id: 4,
    title: "植物靜物",
    master: "Marco Mazzoni",
    medium: "colored_pencil",
    imageUrl: "",
    prompt: "Marco Mazzoni style colored pencil drawing, floral botanical art, intricate details, dark background, soft shading, surreal touch, high quality",
    height: 400
  },
  {
    id: 5,
    title: "室內靜物",
    master: "大衛·霍克尼",
    medium: "colored_pencil",
    imageUrl: "",
    prompt: "David Hockney style colored pencil drawing, interior room, flat colors, vibrant, pop art style, clean lines, bright atmosphere, minimalism",
    height: 350
  },
  {
    id: 6,
    title: "眼睛習作",
    master: "CJ Hendry",
    medium: "colored_pencil",
    imageUrl: "",
    prompt: "CJ Hendry style colored pencil drawing, hyperrealistic eye, glossy texture, detailed iris, white background, photorealistic art",
    height: 380
  },

  // 💧 Watercolor / 水彩
  {
    id: 7,
    title: "暴風雪",
    master: "威廉·透納",
    medium: "watercolor",
    imageUrl: "",
    prompt: "J.M.W. Turner style watercolor, snow storm at sea, atmospheric, swirling mist, dramatic light, loose wet wash, romanticism masterpiece",
    height: 400
  },
  {
    id: 8,
    title: "海邊風景",
    master: "溫斯洛·荷馬",
    medium: "watercolor",
    imageUrl: "",
    prompt: "Winslow Homer style watercolor, seascape, breaking waves, rocky shore, naturalistic colors, clear lighting, realistic style",
    height: 360
  },
  {
    id: 9,
    title: "城市街景",
    master: "阿爾瓦羅",
    medium: "watercolor",
    imageUrl: "",
    prompt: "Alvaro Castagnet style watercolor, city street scene, dramatic shadows, warm and cool contrast, expressive brushstrokes, dynamic composition",
    height: 420
  },

  // 🧠 Digital / 數位板繪
  {
    id: 10,
    title: "角色插畫",
    master: "Loish",
    medium: "digital",
    imageUrl: "",
    prompt: "Loish style digital painting, female portrait, flowing hair, soft glowing colors, digital art, stylized proportions, dreamy atmosphere",
    height: 450
  },
  {
    id: 11,
    title: "商業角色",
    master: "Artgerm",
    medium: "digital",
    imageUrl: "",
    prompt: "Artgerm style digital art, superheroine portrait, highly detailed, realistic skin texture, dynamic lighting, comic book cover style, vibrant colors",
    height: 500
  },
  {
    id: 12,
    title: "數位場景",
    master: "Beeple",
    medium: "digital",
    imageUrl: "",
    prompt: "Beeple style digital art, sci-fi landscape, futuristic city, neon lights, dystopian atmosphere, 3d render style, high contrast, cinematic",
    height: 380
  },

  // ✒️ Pen & Ink / 鋼筆速寫
  {
    id: 13,
    title: "解剖速寫",
    master: "達文西",
    medium: "ink",
    imageUrl: "",
    prompt: "Leonardo da Vinci style pen and ink sketch, anatomy study, cross hatching, sepia ink, handwriting notes, vintage paper, scientific illustration",
    height: 420
  },
  {
    id: 14,
    title: "黑白漫畫",
    master: "Frank Miller",
    medium: "ink",
    imageUrl: "",
    prompt: "Frank Miller style comic art, sin city style, high contrast black and white, noir atmosphere, silhouette, dramatic rain, graphic novel style",
    height: 480
  },
  {
    id: 15,
    title: "即興城市",
    master: "金政基",
    medium: "ink",
    imageUrl: "",
    prompt: "Kim Jung Gi style ink drawing, complex crowd scene, fish eye perspective, intricate details, brush pen, black and white, dynamic composition",
    height: 400
  },

  // 🖊 Marker / 麥克筆
  {
    id: 16,
    title: "未來感超跑",
    master: "Scott Robertson",
    medium: "marker",
    imageUrl: "",
    prompt: "Scott Robertson style marker sketch, futuristic supercar, industrial design, perspective drawing, reflective surfaces, clean lines, concept art",
    height: 350
  },

  // 🎨 Acrylic / 壓克力
  {
    id: 17,
    title: "現代波普藝術",
    master: "大衛·霍克尼",
    medium: "acrylic",
    imageUrl: "",
    prompt: "David Hockney acrylic painting, swimming pool with splash, bright blue, flat colors, pop art style, clear edges, california sunlight",
    height: 400
  },

  // 🖼 Oil / 油畫
  {
    id: 18,
    title: "厚塗星空",
    master: "梵谷",
    medium: "oil",
    imageUrl: "",
    prompt: "Vincent van Gogh style oil painting, starry night sky, swirling clouds, thick impasto texture, vibrant blue and yellow, cypress trees, masterpiece",
    height: 400
  }
];

const downloadImage = async (url, filepath) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        
        // Ensure the directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        const fileStream = fs.createWriteStream(filepath);
        await pipeline(response.body, fileStream);
        console.log(`✅ Downloaded: ${filepath}`);
        return true;
    } catch (error) {
        console.error(`❌ Error downloading ${filepath}:`, error.message);
        return false;
    }
};

const main = async () => {
    console.log("🚀 Starting image download...");
    
    for (const item of exploreGallery) {
        // Construct the URL using the image.pollinations.ai endpoint
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(item.prompt)}?width=300&height=${item.height}&nologo=true&seed=${item.id}&model=flux`;
        const filepath = path.join(process.cwd(), 'public', 'images', 'explore', `${item.id}.jpg`);
        
        console.log(`Downloading item ${item.id}: ${item.title}...`);
        
        // Check if file exists and is valid (size > 5KB)
        if (fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath);
            if (stats.size > 5000) {
                console.log(`⏭️  Skipping ${item.id} (already exists and valid)`);
                continue;
            }
        }

        await downloadImage(url, filepath);
        
        // Add a small delay to be polite to the API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("✨ All downloads completed!");
};

main();
