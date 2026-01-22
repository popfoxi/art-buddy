"use client";

import { useState, useEffect } from "react";
import { 
    Camera, 
    Upload, 
    Palette, 
    Star,
    Award,
    Zap,
    Home as HomeIcon,
    User,
    Lock,
    Brush,
    Sparkles,
    History,
    Scan,
    Compass,
    X,
    Maximize2,
    Trophy,
    Settings,
    LogOut,
    CreditCard,
    Info,
    ChevronRight,
    Clock,
    AlertCircle,
    Paintbrush,
    CheckCircle2,
    Mail,
    Heart,
    MessageSquare,
    Target,
    BookOpen,
    ChevronDown
  } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import { createTicket, getUserTickets, getUserCredits, decrementUserCredits } from "@/app/actions";
import { MEDIA_MODULES, STYLE_MODULES } from "@/lib/modules";
import { SUPPORT_CATEGORIES } from "@/lib/constants";
import { sendGAEvent } from "@/lib/gtag";

export default function Home() {
  const { data: session, status } = useSession();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedMedium, setSelectedMedium] = useState<string | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [exploreFilterType, setExploreFilterType] = useState<"medium" | "master">("medium");
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "history" | "challenge" | "profile">("home");
  const [isAddingMaster, setIsAddingMaster] = useState(false);
  const [newMasterName, setNewMasterName] = useState("");
  const [isSearchingMaster, setIsSearchingMaster] = useState(false);

  const [selectedArtwork, setSelectedArtwork] = useState<any>(null);
  const [referenceArtwork, setReferenceArtwork] = useState<any>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [activeFeedbackIndex, setActiveFeedbackIndex] = useState<number | null>(null);

  // History State
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  // Challenge State
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [currentChallengeId, setCurrentChallengeId] = useState<string | null>(null);
  const [showChallengeIntro, setShowChallengeIntro] = useState(false);

  // Favorites State
  const [favoriteArtworkIds, setFavoriteArtworkIds] = useState<number[]>([]);

  // Usage Limit State
  const [analysisCount, setAnalysisCount] = useState(0);
  const [lastAnalysisReset, setLastAnalysisReset] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<{
    total: number;
    subscriptionCredits: number;
    credits: number;
    plan: string;
    isTrialExpired: boolean;
    trialStartedAt: Date | null;
    subscriptionExpiresAt: Date | null;
  }>({ 
    total: 0, 
    subscriptionCredits: 0, 
    credits: 0, 
    plan: 'free', 
    isTrialExpired: false, 
    trialStartedAt: null,
    subscriptionExpiresAt: null
  });

  // Fetch credits from server
  useEffect(() => {
    if (session?.user?.id) {
        getUserCredits().then((data: any) => {
             if (typeof data === 'number') {
                 // Backward compatibility
                 setUsageStats(prev => ({ ...prev, total: data, credits: data }));
             } else {
                 setUsageStats(data);
             }
        }).catch(console.error);
    }
  }, [session, activeTab]); // Refresh when tab changes (e.g. after profile update)

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Persistence State
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    if (status === "loading") return;

    const key = session?.user?.email ? `art-buddy-${session.user.email}` : 'art-buddy-guest';
    const saved = localStorage.getItem(key);

    if (saved) {
        try {
            const data = JSON.parse(saved);
            setHistoryItems(data.history || []);
            setUserChallenges(data.challenges || []);
            setFavoriteArtworkIds(data.favorites || []);

            // Usage Limit Logic
            // Guest: Monthly Reset
            // Free User: Weekly Reset
            const savedReset = data.lastAnalysisReset || new Date().toISOString();
            const lastResetDate = new Date(savedReset);
            const now = new Date();
            const isGuest = !session?.user?.email;
            
            let shouldReset = false;

            if (isGuest) {
                // Monthly check
                if (lastResetDate.getMonth() !== now.getMonth() || lastResetDate.getFullYear() !== now.getFullYear()) {
                    shouldReset = true;
                }
            } else {
                // Free User (or Pro, but Pro doesn't matter as limit is high) -> Weekly check
                // Reset if it's a new week (Monday start)
                const getWeekNumber = (d: Date) => {
                    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                    return [d.getUTCFullYear(), weekNo];
                };
                
                const [lastYear, lastWeek] = getWeekNumber(lastResetDate);
                const [currYear, currWeek] = getWeekNumber(now);
                
                if (lastYear !== currYear || lastWeek !== currWeek) {
                    shouldReset = true;
                }
            }

            if (shouldReset) {
                setAnalysisCount(0);
                setLastAnalysisReset(now.toISOString());
            } else {
                setAnalysisCount(data.analysisCount || 0);
                setLastAnalysisReset(savedReset);
            }
        } catch (e) {
            console.error("Failed to parse local storage", e);
        }
    } else {
        // Clear data if switching to a new user/guest with no history
        setHistoryItems([]);
        setUserChallenges([]);
        setFavoriteArtworkIds([]);
        setAnalysisCount(0);
        setLastAnalysisReset(new Date().toISOString());
    }
    setIsLoaded(true);
  }, [session?.user?.email, status]);

  // Save data to localStorage
  useEffect(() => {
    if (!isLoaded) return;

    const key = session?.user?.email ? `art-buddy-${session.user.email}` : 'art-buddy-guest';
    const data = {
        history: historyItems,
        challenges: userChallenges,
        favorites: favoriteArtworkIds,
        analysisCount,
        lastAnalysisReset
    };
    localStorage.setItem(key, JSON.stringify(data));
  }, [historyItems, userChallenges, favoriteArtworkIds, analysisCount, lastAnalysisReset, session?.user?.email, isLoaded]);

  const [favoriteFilterType, setFavoriteFilterType] = useState<"all" | "medium" | "master">("all");
  const [favoriteFilterValue, setFavoriteFilterValue] = useState<string | null>(null);

  // Profile Modal States
  const [showProModal, setShowProModal] = useState(false);
  const [proPlanType, setProPlanType] = useState<"pro" | "pro_plus">("pro");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);

  // Support Modal States
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketContent, setTicketContent] = useState("");
  const [ticketCategory, setTicketCategory] = useState<string>(SUPPORT_CATEGORIES[0].id);

  useEffect(() => {
    if (showSupportModal && session?.user) {
        getUserTickets().then(setSupportTickets);
    }
  }, [showSupportModal, session]);

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketContent.trim()) return;
    setIsCreatingTicket(true);
    try {
        await createTicket(ticketSubject, ticketContent, ticketCategory);
        sendGAEvent('submit_ticket', 'support', ticketCategory);
        setTicketSubject("");
        setTicketContent("");
        setTicketCategory(SUPPORT_CATEGORIES[0].id);
        setIsCreatingTicket(false);
        // Refresh tickets
        const updatedTickets = await getUserTickets();
        setSupportTickets(updatedTickets);
    } catch (error) {
        console.error("Failed to create ticket", error);
        alert("發送失敗，請稍後再試");
        setIsCreatingTicket(false);
    }
  };

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavoriteArtworkIds(prev => {
        if (prev.includes(id)) {
            return prev.filter(favId => favId !== id);
        } else {
            return [...prev, id];
        }
    });
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension limit to ensure reasonable payload size
          const MAX_WIDTH = 1500;
          const MAX_HEIGHT = 1500;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          
          // Draw image on white background to handle transparency if any (though converting to JPEG)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          // This ensures consistent format and smaller size
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const analyzeWithAI = async (base64Image: string) => {
    try {
      // Determine scenario based on context
      let scenarioId = 'free_practice';
      if (currentChallengeId) {
        scenarioId = 'challenge';
      } else if (selectedStyle) {
        scenarioId = 'style_practice';
      }

      sendGAEvent('analyze_start', 'analysis', scenarioId);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          image: base64Image,
          styleId: selectedStyle || 'general',
          mediaId: selectedMedium || 'watercolor',
          scenarioId: scenarioId
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
            sendGAEvent('show_pro_modal', 'conversion', 'limit_reached_api');
            setShowProModal(true);
            return null;
        }
        throw new Error("API Request Failed");
      }

      sendGAEvent('analyze_success', 'analysis', scenarioId);
      return await response.json();
    } catch (error) {
      console.error("AI Analysis Error:", error);
      sendGAEvent('analyze_error', 'analysis', error instanceof Error ? error.message : 'Unknown Error');
      alert("AI 分析出了點小問題，請稍後再試。");
      return null;
    }
  };

  const handleTryStyle = (artwork: any) => {
    // Create new challenge entry
    const newChallengeId = Date.now().toString();
    const newChallenge = {
        id: newChallengeId,
        galleryId: artwork.id,
        title: artwork.title,
        master: artwork.master,
        medium: artwork.medium,
        imageUrl: artwork.imageUrl,
        prompt: artwork.prompt,
        startTime: new Date().toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'in_progress', // in_progress, completed, abandoned
        styleId: artwork.styleId || 'general',
        mediaId: artwork.mediaId || artwork.medium || 'watercolor',
        result: null
    };

    setUserChallenges(prev => [newChallenge, ...prev]);
    setCurrentChallengeId(newChallengeId);

    setSelectedStyle(artwork.styleId || artwork.master);
    // Explicitly set the medium for the analysis API
    setSelectedMedium(artwork.mediaId || artwork.medium || 'watercolor');
    setReferenceArtwork(artwork);
    setSelectedArtwork(null);
    
    // Show Challenge Intro Overlay
    setShowChallengeIntro(true);
  };

  const handleAbandonChallenge = (challengeId: string) => {
    if (confirm("確定要放棄這個挑戰嗎？紀錄將會被移除。")) {
        setUserChallenges(prev => prev.filter(c => c.id !== challengeId));
        if (currentChallengeId === challengeId) {
            setCurrentChallengeId(null);
            setSelectedStyle(null);
            setReferenceArtwork(null);
        }
    }
  };

  const handleExploreMaster = (masterName: string) => {
    setSelectedMaster(masterName);
    // Switch to the medium associated with this master if possible, or keep current
    // We'll keep the current selectedMedium as it's likely already set correctly from the Home tab context
    setActiveTab("explore");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mock Gallery Data for Explore Tab (AI Generated based on Masterpiece Prompts)
  const exploreGallery = [
    // ✏️ Pencil / 素描
    {
      id: 1,
      title: "手的研究",
      master: "達文西",
      medium: "pencil",
      imageUrl: "/images/explore/1.jpg",
      prompt: "Leonardo da Vinci style sketch, study of hands, anatomical structure, soft lines, sfumato, sepia paper, renaissance art masterpiece, high detail",
      description: "【技巧】結構素描、明暗塑形。 【注意】先畫結構比例，再上明暗；陰影用漸層，不要塗黑塊。",
      height: 400,
      likes: 890
    },
    {
      id: 2,
      title: "老人肖像素描",
      master: "林布蘭",
      medium: "pencil",
      imageUrl: "/images/explore/2.jpg",
      prompt: "Rembrandt style sketch, portrait of an old man, strong chiaroscuro, dramatic lighting, single light source, emotional expression, rough strokes, vintage style",
      description: "【技巧】單一光源、強烈明暗對比。 【注意】先確定光源方向；暗部可以整塊處理，亮部保留紙白。",
      height: 450,
      likes: 720
    },
    {
      id: 3,
      title: "人體藝術素描",
      master: "艾格·席勒",
      medium: "pencil",
      imageUrl: "/images/explore/3.jpg",
      prompt: "Egon Schiele style sketch, sitting figure drawing, expressive twisted lines, raw emotion, elongated proportions, nervous line quality, minimal color",
      description: "【技巧】表現性線條、非寫實比例。 【注意】不追求正確比例，線條要果斷，留白很重要。",
      height: 500,
      likes: 560
    },

    // 🖍 Colored Pencil / 色鉛筆
    {
      id: 4,
      title: "植物靜物",
      master: "Marco Mazzoni",
      medium: "colored_pencil",
      imageUrl: "/images/explore/4.jpg",
      prompt: "Marco Mazzoni style colored pencil drawing, floral botanical art, intricate details, dark background, soft shading, surreal touch, high quality",
      description: "【技巧】疊色、細線堆疊。 【注意】輕筆多次上色，不要一次壓太重；同色系分明暗層。",
      height: 400,
      likes: 430
    },
    {
      id: 5,
      title: "室內靜物",
      master: "大衛·霍克尼",
      medium: "colored_pencil",
      imageUrl: "/images/explore/5.jpg",
      prompt: "David Hockney style colored pencil drawing, interior room, flat colors, vibrant, pop art style, clean lines, bright atmosphere, minimalism",
      description: "【技巧】平面化構圖、色塊處理。 【注意】少用漸層，色塊要乾淨，忽略細節比例。",
      height: 350,
      likes: 380
    },
    {
      id: 6,
      title: "眼睛習作",
      master: "CJ Hendry",
      medium: "colored_pencil",
      imageUrl: "/images/explore/6.jpg",
      prompt: "CJ Hendry style colored pencil drawing, hyperrealistic eye, glossy texture, detailed iris, white background, photorealistic art",
      description: "【技巧】超寫實描繪、高耐心細節。 【注意】分區域慢慢完成，先畫輪廓再補細節，不要急著畫高光。",
      height: 380,
      likes: 950
    },

    // 💧 Watercolor / 水彩
    {
      id: 7,
      title: "暴風雪",
      master: "威廉·透納",
      medium: "watercolor",
      imageUrl: "/images/explore/7.jpg",
      prompt: "J.M.W. Turner style watercolor, snow storm at sea, atmospheric, swirling mist, dramatic light, loose wet wash, romanticism masterpiece",
      description: "【技巧】濕畫法、流動感。 【注意】顏料要夠水，不要反覆來回刷，接受不可控效果。",
      height: 400,
      likes: 670
    },
    {
      id: 8,
      title: "海邊風景",
      master: "溫斯洛·荷馬",
      medium: "watercolor",
      imageUrl: "/images/explore/8.jpg",
      prompt: "Winslow Homer style watercolor, seascape, breaking waves, rocky shore, naturalistic colors, clear lighting, realistic style",
      description: "【技巧】寫實水彩、分層上色。 【注意】從淺色畫起，留白先想好，顏色不要混濁。",
      height: 360,
      likes: 540
    },
    {
      id: 9,
      title: "城市街景",
      master: "阿爾瓦羅",
      medium: "watercolor",
      imageUrl: "/images/explore/9.jpg",
      prompt: "Alvaro Castagnet style watercolor, city street scene, dramatic shadows, warm and cool contrast, expressive brushstrokes, dynamic composition",
      description: "【技巧】大筆觸、濕中帶乾。 【注意】不修邊，一筆完成區塊，畫錯就放著。",
      height: 420,
      likes: 480
    },

    // 🧠 Digital / 數位板繪
    {
      id: 10,
      title: "角色插畫",
      master: "Loish",
      styleId: "loish_style",
      medium: "digital",
      mediaId: "digital_painting",
      imageUrl: "/images/explore/10.jpg",
      prompt: "Loish style digital painting, female portrait, flowing hair, soft glowing colors, digital art, stylized proportions, dreamy atmosphere",
      description: "【技巧】柔和上色、簡化線稿。 【注意】線稿不要太重，先鋪大色塊，陰影柔化。",
      height: 450,
      likes: 820
    },
    {
      id: 11,
      title: "商業角色",
      master: "Artgerm",
      medium: "digital",
      imageUrl: "/images/explore/11.jpg",
      prompt: "Artgerm style digital art, superheroine portrait, highly detailed, realistic skin texture, dynamic lighting, comic book cover style, vibrant colors",
      description: "【技巧】精細刻畫、光影塑形。 【注意】先構圖再細修，光源要固定，不要一次畫太滿。",
      height: 500,
      likes: 910
    },
    {
      id: 12,
      title: "數位場景",
      master: "Beeple",
      medium: "digital",
      imageUrl: "/images/explore/12.jpg",
      prompt: "Beeple style digital art, sci-fi landscape, futuristic city, neon lights, dystopian atmosphere, 3d render style, high contrast, cinematic",
      description: "【技巧】強烈氣氛、影像感構圖。 【注意】先決定主視覺，簡化背景，留空間給主體。",
      height: 380,
      likes: 760
    },

    // ✒️ Pen & Ink / 鋼筆速寫
    {
      id: 13,
      title: "解剖速寫",
      master: "達文西",
      medium: "ink",
      imageUrl: "/images/explore/13.jpg",
      prompt: "Leonardo da Vinci style pen and ink sketch, anatomy study, cross hatching, sepia ink, handwriting notes, vintage paper, scientific illustration",
      description: "【技巧】結構線、快速紀錄。 【注意】不修線，一筆畫完，接受不完美。",
      height: 420,
      likes: 650
    },
    {
      id: 14,
      title: "黑白漫畫",
      master: "Frank Miller",
      medium: "ink",
      imageUrl: "/images/explore/14.jpg",
      prompt: "Frank Miller style comic art, sin city style, high contrast black and white, noir atmosphere, silhouette, dramatic rain, graphic novel style",
      description: "【技巧】黑白分割、強對比。 【注意】想清楚黑白比例，少用漸層，果斷下筆。",
      height: 480,
      likes: 590
    },
    {
      id: 15,
      title: "即興城市",
      master: "金政基",
      medium: "ink",
      imageUrl: "/images/explore/15.jpg",
      prompt: "Kim Jung Gi style ink drawing, complex crowd scene, fish eye perspective, intricate details, brush pen, black and white, dynamic composition",
      description: "【技巧】無草稿速寫、空間感。 【注意】先畫大結構，不回頭修線，練觀察不是完美。",
      height: 400,
      likes: 880
    },

    // 🖊 Marker / 麥克筆 (Adding typical example)
    {
      id: 16,
      title: "未來感超跑",
      master: "Scott Robertson",
      medium: "marker",
      imageUrl: "/images/explore/16.jpg",
      prompt: "Scott Robertson style marker sketch, futuristic supercar, industrial design, perspective drawing, reflective surfaces, clean lines, concept art",
      description: "【技巧】筆觸平塗、色彩過渡。 【注意】下筆需果斷不可猶豫，建議搭配代針筆進行邊框勾勒。",
      height: 350,
      likes: 420
    },

    // 🎨 Acrylic / 壓克力 (Adding typical example)
    {
      id: 17,
      title: "現代波普藝術",
      master: "大衛·霍克尼",
      medium: "acrylic",
      imageUrl: "/images/explore/17.jpg",
      prompt: "David Hockney acrylic painting, swimming pool with splash, bright blue, flat colors, pop art style, clear edges, california sunlight",
      description: "【技巧】平塗法、塊面構圖。 【注意】壓克力乾燥極快，混色需在濕潤時迅速完成。",
      height: 400,
      likes: 530
    },

    // 🖼 Oil / 油畫 (Adding typical example)
    {
      id: 18,
      title: "厚塗星空",
      master: "梵谷",
      medium: "oil",
      imageUrl: "/images/explore/18.jpg",
      prompt: "Vincent van Gogh style oil painting, starry night sky, swirling clouds, thick impasto texture, vibrant blue and yellow, cypress trees, masterpiece",
      description: "【技巧】厚塗法、短促的點彩筆觸。 【注意】遵循「肥過瘦」原則，需考量乾燥時間較長的問題。",
      height: 400,
      likes: 980
    }
  ];

  // Reorganized based on market popularity for beginners
  const artMediums = [
    { id: "pencil", name: "鉛筆/素描", icon: "✏️", color: "bg-slate-100 text-slate-700" },
    { id: "colored_pencil", name: "色鉛筆", icon: "🖍️", color: "bg-orange-50 text-orange-600" },
    { id: "watercolor", name: "水彩", icon: "💧", color: "bg-blue-50 text-blue-600" },
    { id: "digital", name: "數位板繪", icon: "📱", color: "bg-purple-50 text-purple-600" },
    { id: "marker", name: "麥克筆", icon: "🖊️", color: "bg-pink-50 text-pink-600" },
    { id: "acrylic", name: "壓克力", icon: "🎨", color: "bg-red-50 text-red-600" },
    { id: "oil", name: "油畫", icon: "🖼️", color: "bg-amber-50 text-amber-700" },
    { id: "ink", name: "鋼筆速寫", icon: "✒️", color: "bg-gray-100 text-gray-800" },
  ];

  const [mastersByMedium, setMastersByMedium] = useState<Record<string, any[]>>({
    pencil: [
        { name: "達文西", desc: "科學家式的精密觀察，擅長解剖、機械與光影的極致寫實。", tag: "解剖寫實" },
        { name: "艾格·席勒", desc: "極其扭曲且富有張力的線條，畫風骨感、神經質且充滿情緒壓力。", tag: "表現主義" },
        { name: "米開朗基羅", desc: "雕塑感極強的素描，強調肌肉紋理與人體結構的力量感。", tag: "肌肉結構" },
        { name: "杜勒", desc: "極度精細的寫實版畫風格，線條嚴謹。", tag: "精細寫實" },
        { name: "安格爾", desc: "新古典主義學院派，追求極致細膩的線條質感。", tag: "古典學院" }
    ],
    colored_pencil: [
        { name: "安迪·沃荷", desc: "早期作品多用輕盈的色鉛筆線條，風格時尚、簡約且具商業插畫感。", tag: "時尚插畫" },
        { name: "摩根·韋斯特林", desc: "擅長用色鉛筆畫出極其細膩的孩童或鄉村光影，畫風溫暖。", tag: "溫暖光影" },
        { name: "庫普卡", desc: "將色鉛筆用於抽象幾何探索，色彩層次豐富且具節奏感。", tag: "抽象幾何" },
        { name: "大衛·霍克尼", desc: "現代色鉛筆平面感，色彩鮮豔。", tag: "平面構成" },
        { name: "CJ Hendry", desc: "超寫實色鉛筆，質感逼真。", tag: "超寫實" },
        { name: "Marco Mazzoni", desc: "高密度植物系色鉛筆，細膩唯美。", tag: "細膩植物" }
    ],
    watercolor: [
        { name: "威廉·透納", desc: "被譽為「光之畫家」，畫風大氣、朦朧，擅長描繪暴風雨與光影交織。", tag: "光影氛圍" },
        { name: "薩金特", desc: "用色大膽、直接，畫面充滿新鮮的陽光感，筆觸灑脫。", tag: "灑脫筆觸" },
        { name: "安德魯·懷斯", desc: "寫實中帶有濃厚的懷舊感與憂鬱氣息，畫風靜謐、細節驚人。", tag: "懷舊寫實" },
        { name: "溫斯洛·荷馬", desc: "寫實自然水彩，捕捉大自然的壯麗。", tag: "自然寫實" },
        { name: "阿爾瓦羅", desc: "強烈筆觸、濕畫法，色彩奔放。", tag: "奔放濕畫" }
    ],
    digital: [
        { name: "Loish", desc: "畫風流暢流動，擅長豐富的色彩運用與女性角色設計。", tag: "流動線條" },
        { name: "Ross Draws", desc: "極致的「光暈」效果與電影感，色彩高度飽和，充滿活力。", tag: "光暈電影" },
        { name: "Craig Mullins", desc: "數位繪畫先驅，強調「塊面感」而非死板線條。", tag: "塊面厚塗" },
        { name: "Artgerm", desc: "商業級高完成度，美漫風格。", tag: "美漫風格" },
        { name: "Beeple", desc: "強烈數位視覺風格，科幻超現實。", tag: "科幻視覺" }
    ],
    marker: [
        { name: "Albert Kiefer", desc: "擅長用麥克筆表現建築的體積感與強烈的陰影對比。", tag: "建築速寫" },
        { name: "小畑健", desc: "麥克筆上色技術極其精準，風格銳利、寫實且華麗。", tag: "精準寫實" },
        { name: "Scott Robertson", desc: "畫風強調透視、結構與金屬質感，產品設計巔峰。", tag: "工業透視" },
        { name: "Syd Mead", desc: "工業設計、未來感，科幻電影概念。", tag: "未來科幻" },
        { name: "Feng Zhu", desc: "概念設計速寫，場景與機械。", tag: "概念設計" }
    ],
    acrylic: [
        { name: "大衛·霍克尼", desc: "色彩極其鮮豔且扁平，擅長游泳池、加州風景，具流行感。", tag: "鮮豔平面" },
        { name: "村上隆", desc: "融合動漫與高藝術的「超扁平」畫風，色彩強烈。", tag: "超扁平" },
        { name: "巴斯奇亞", desc: "塗鴉式風格，充滿原始衝動、雜亂的文字與符號。", tag: "街頭塗鴉" },
        { name: "Gerhard Richter", desc: "抽象壓克力，獨特的刮刀技法。", tag: "刮刀抽象" },
        { name: "Peter Doig", desc: "現代敘事型風景，夢幻氛圍。", tag: "夢幻敘事" }
    ],
    oil: [
        { name: "梵谷", desc: "強烈的旋渦狀筆觸（厚塗法），色彩純度極高且充滿生命力。", tag: "厚塗漩渦" },
        { name: "莫內", desc: "印象派巔峰，強調光線在不同時間下的色彩變化。", tag: "印象光影" },
        { name: "達利", desc: "超現實主義，畫風精確如攝影但內容荒誕。", tag: "超現實" },
        { name: "林布蘭", desc: "明暗對比（Chiaroscuro），寫實肖像大師。", tag: "戲劇光影" }
    ],
    ink: [
        { name: "達文西", desc: "結構型鋼筆速寫，科學與藝術的結合，線條果斷。", tag: "結構速寫" },
        { name: "Paul Heaston", desc: "極其細密的排線，擅長廣角透視與極度寫實的環境記錄。", tag: "廣角速寫" },
        { name: "Aubrey Beardsley", desc: "極致的黑白對比，線條流暢優美，具裝飾藝術氣息。", tag: "黑白裝飾" },
        { name: "金政基", desc: "不需草稿即可畫出極其複雜的人群與透視，結構嚴謹。", tag: "魚眼透視" },
        { name: "Frank Miller", desc: "強黑白對比，美漫硬派風格。", tag: "諾爾風格" }
    ]
  });

  const handleAddMaster = async () => {
    if (!newMasterName.trim() || !selectedMedium) return;
    
    setIsSearchingMaster(true);
    
    try {
      const response = await fetch("/api/validate-master", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: newMasterName,
          medium: selectedMedium
        }),
      });

      if (!response.ok) {
        throw new Error("Validation request failed");
      }

      const data = await response.json();

      if (data.isValid) {
        setMastersByMedium(prev => ({
            ...prev,
            [selectedMedium]: [
                ...prev[selectedMedium],
                { 
                    name: data.masterInfo.name, 
                    desc: data.masterInfo.desc, 
                    tag: data.masterInfo.tag 
                }
            ]
        }));
        setNewMasterName("");
        setIsAddingMaster(false);
      } else {
        alert(`無法新增此大師：${data.reason}\n\n我們只收錄國際級或國家級的知名大師，以及具備拍賣會紀錄的藝術家。`);
      }

    } catch (error) {
      console.error("Master Validation Error:", error);
      alert("AI 驗證服務暫時無法使用，請稍後再試。");
    } finally {
      setIsSearchingMaster(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isChallengeSource: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File uploaded:", file.name, "isChallenge:", isChallengeSource); // Debug: Check filename
      
      // Check Usage Limits
      // Force refresh usage stats before check to ensure sync
      if (session?.user && !isChallengeSource) {
         // We allow challenge uploads to bypass strict credit check if it's just a style practice? 
         // But logic says challenge consumes credit. 
         // Let's ensure we have latest credits.
         // (Credits are refreshed in useEffect, should be fine)
      }

      if (!session?.user) {
        // Guest (Not Logged In) -> Limit: 1 per month
        if (analysisCount >= 1) {
             console.log('Guest limit reached, showing Login Modal');
             sendGAEvent('show_login_modal', 'conversion', 'limit_reached_guest');
             e.target.value = ""; // Reset input
             setShowLoginModal(true);
             return;
        }
      } else {
        // Logged In User -> Check Server Stats
        // If total <= 0 AND user cannot start a trial, block.
        // If user CAN start a trial (canStartTrial is true), allow them to proceed (API will init trial).
        if (usageStats.total <= 0 && !usageStats.canStartTrial) {
            console.log('User usage limit reached, showing Pro Modal');
            sendGAEvent('show_pro_modal', 'conversion', 'limit_reached_user');
            e.target.value = ""; // Reset input
            setShowProModal(true);
            return;
        }
      }

      const imageUrl = URL.createObjectURL(file);
      
      let effectiveChallengeId = currentChallengeId;
      
      // If uploading from Challenge tab but ID is lost, try to recover it from active challenges
      if (isChallengeSource && !effectiveChallengeId && selectedStyle) {
          const activeChallenge = userChallenges.find(c => c.status === 'in_progress' && c.styleId === selectedStyle);
          if (activeChallenge) {
              effectiveChallengeId = activeChallenge.id;
              setCurrentChallengeId(effectiveChallengeId);
              // Ensure medium is consistent with the challenge
              if (!selectedMedium || selectedMedium !== (activeChallenge.mediaId || activeChallenge.medium)) {
                  setSelectedMedium(activeChallenge.mediaId || activeChallenge.medium || 'watercolor');
              }
          }
       }

      // If NOT in challenge mode, trigger global modal
      if (!effectiveChallengeId) {
        setSelectedImage(imageUrl);
        setResult(null); 
      } else {
        // In challenge mode, still update selectedImage so the preview works
        setSelectedImage(imageUrl);
      }
      
      setIsAnalyzing(true);
      
      try {
        const base64 = await compressImage(file);
        const aiResult = await analyzeWithAI(base64);
        if (aiResult) {
            setAnalysisCount(prev => prev + 1);

            // Refresh credits for logged-in users
            if (session?.user) {
                try {
                    const updatedStats: any = await getUserCredits();
                    setUsageStats(updatedStats);
                } catch (err) {
                    console.error("Failed to refresh credits", err);
                }
            }

            // If NOT in challenge mode, update global result
            if (!effectiveChallengeId) {
                setResult(aiResult);
            }
            
            // Save to History
            const newHistoryItem = {
              date: new Date().toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              score: aiResult.total_score || aiResult.score,
              title: selectedStyle ? `風格練習：${selectedStyle}` : "自由創作",
              tags: aiResult.step3_techniques || (aiResult.feedback ? aiResult.feedback.slice(0, 2).map((f: any) => f.title) : []),
              imageUrl: imageUrl,
              preview: aiResult.step1_declaration || aiResult.encouragement,
              analysis: aiResult.step2_performance ? JSON.stringify(aiResult.step2_performance) : aiResult.analysis,
              feedback: aiResult.step4_advice || aiResult.feedback,
              detectedStyle: aiResult.step1_declaration || aiResult.detectedStyle
            };
            setHistoryItems(prev => [newHistoryItem, ...prev]);

            // Update Challenge if applicable
            if (effectiveChallengeId) {
                setUserChallenges(prev => prev.map(c => {
                    if (c.id === effectiveChallengeId) {
                        return {
                            ...c,
                            status: 'completed',
                            completedTime: new Date().toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                            result: {
                                score: aiResult.total_score || aiResult.score,
                                imageUrl: imageUrl, // User's uploaded image
                                analysis: aiResult.step2_performance ? JSON.stringify(aiResult.step2_performance) : aiResult.analysis
                            }
                        };
                    }
                    return c;
                }));
                // Auto-open detailed feedback for challenge
                setSelectedHistoryItem(newHistoryItem);
                setCurrentChallengeId(null); // Reset current challenge
            }

        } else {
             // Handle error
             if (!effectiveChallengeId) {
                setResult({
                    step1_declaration: "分析失敗",
                    step2_performance: { representation: "-", driver: "-", atmosphere: "-" },
                    step3_techniques: [],
                    step4_advice: [],
                    step5_scoring: { 
                        media_mastery: { score: 0, reason: "請檢查網路" },
                        structure_proportion: { score: 0, reason: "" },
                        style_consistency: { score: 0, reason: "" },
                        visual_completeness: { score: 0, reason: "" }
                    },
                    total_score: 0
                });
             } else {
                 alert("分析失敗，請稍後再試");
             }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <main className="min-h-screen pb-24 bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img src="/logo.svg" alt="ArtTutor123 Logo" className="w-11 h-11 rounded-xl shadow-md shadow-rose-200" />
            <div className="flex flex-col justify-center">
                <span className="font-black text-2xl text-slate-900 leading-none mb-1">畫重點</span>
                <span className="text-[10px] font-bold text-rose-500 tracking-[0.2em] leading-none uppercase">ArtTutor123</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-8">
        
        {/* === HOME TAB === */}
        {activeTab === "home" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Section */}
            <section className="text-center space-y-3">
              <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
                你的 24 小時<br/>
                <span className="text-rose-600">貼身繪畫家教</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm px-4">
                隨拍隨問，AI 老師立刻給你一對一修改建議
              </p>
            </section>



            {/* Analysis Action Card - Softened Design */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div>
                    <div className="font-black text-xl text-slate-900 mb-1">
                      幫我看看這張畫
                    </div>
                    <div className="text-slate-500 text-sm font-medium">
                      上傳作品，老師馬上告訴你怎麼改會更好
                    </div>
                  </div>
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-sm">
                    <Scan size={24} />
                  </div>
                </div>
                
                <label className="block w-full relative z-10">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                  <div className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-bold text-center cursor-pointer hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200">
                    <Upload size={18} />
                    上傳作品求點評
                  </div>
                </label>
            </div>

            {/* Result Preview - MOVED TO GLOBAL */}
            {false && selectedImage && (
              <motion.div 
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto"
                id="result-section"
              >
                {/* Header */}
                <div className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between shadow-sm safe-top">
                     <div className="flex items-center gap-2">
                         <div className="bg-rose-600 text-white p-1.5 rounded-lg">
                             <Sparkles size={16} />
                         </div>
                         <span className="font-bold text-slate-900">分析結果</span>
                     </div>
                     <button 
                         onClick={() => {
                             setSelectedImage(null);
                             setResult(null);
                         }}
                         className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                     >
                         <X size={20} />
                     </button>
                </div>

                <div className="p-5 pb-32">
                    <div className="aspect-video bg-slate-100 rounded-xl mb-6 overflow-hidden relative shadow-inner group">
                      <img src={selectedImage || ""} alt="Preview" className="w-full h-full object-cover" />
                      
                      {/* Feedback Overlays */}
                      {result && !isAnalyzing && result.feedback.map((item: any, idx: number) => (
                          <div 
                            key={idx}
                            className={`absolute border-2 rounded-lg transition-all duration-300 pointer-events-none
                                ${activeFeedbackIndex === idx 
                                    ? "border-rose-500 bg-rose-500/10 opacity-100 scale-100 shadow-[0_0_15px_rgba(244,63,94,0.5)]" 
                                    : "border-transparent opacity-0 scale-95"
                                }
                            `}
                            style={{
                                left: `${item.coordinate?.x}%`,
                                top: `${item.coordinate?.y}%`,
                                width: `${item.coordinate?.w}%`,
                                height: `${item.coordinate?.h}%`,
                            }}
                          >
                              <div className={`
                                absolute -top-3 left-0 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm
                                ${activeFeedbackIndex === idx ? "opacity-100" : "opacity-0"}
                              `}>
                                  修改建議 {idx + 1}
                              </div>
                          </div>
                      ))}

                      {isAnalyzing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                          <div className="bg-white px-6 py-4 rounded-2xl flex flex-col items-center gap-3 text-sm font-bold shadow-2xl animate-pulse">
                            <Scan size={32} className="text-rose-600 animate-spin-slow" />
                            <span className="text-slate-800">老師正在仔細看你的畫...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {result && !isAnalyzing && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Score and Style Card */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Star size={120} className="text-rose-500 transform rotate-12 translate-x-10 -translate-y-10" fill="currentColor" />
                            </div>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">風格判定</div>
                                    <div className="text-2xl font-black text-slate-900">{result.detectedStyle}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-rose-500 font-bold uppercase tracking-wider mb-1">AI 評分</div>
                                    <div className="text-5xl font-black text-rose-600 tracking-tighter flex items-start justify-center gap-1">
                                        <span className="text-2xl mt-1 opacity-0">0</span>
                                        {result.score}
                                        <span className="text-lg text-rose-400 font-bold mt-4">/100</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Style Match Card (Only if style is provided) */}
                        {result.styleMatch && (
                            <div className="bg-gradient-to-r from-rose-50 to-orange-50 p-4 rounded-xl border border-rose-100 flex items-start gap-4">
                                <div className="bg-white p-2 rounded-lg shadow-sm text-center min-w-[70px]">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">符合度</div>
                                    <div className="text-xl font-black text-rose-600">{result.styleMatch.score}%</div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                                        與「{selectedStyle || '目標風格'}」的相似度分析
                                    </h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {result.styleMatch.comment}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Main Analysis */}
                        <div className="space-y-2">
                          <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles size={18} className="text-yellow-500" />
                            整體點評
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                            {result.analysis}
                          </p>
                        </div>

                        {/* Technique Breakdown */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Brush size={16} />
                            修改重點
                          </h4>
                          {result.feedback.map((item: any, idx: number) => (
                            <div 
                                key={idx} 
                                onMouseEnter={() => setActiveFeedbackIndex(idx)}
                                onMouseLeave={() => setActiveFeedbackIndex(null)}
                                className={`
                                    group relative pl-4 border-l-2 transition-all cursor-pointer p-2 rounded-r-lg
                                    ${activeFeedbackIndex === idx 
                                        ? "border-rose-500 bg-rose-50" 
                                        : "border-slate-200 hover:border-rose-300 hover:bg-slate-50"}
                                `}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                  <span className={`
                                    text-[10px] font-bold px-1.5 py-0.5 rounded text-white
                                    ${activeFeedbackIndex === idx ? "bg-rose-500" : "bg-slate-300"}
                                  `}>
                                      {idx + 1}
                                  </span>
                                  <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {item.content}
                              </p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t border-slate-100 pt-4 mt-4">
                            <p className="text-center text-xs text-slate-400 mb-4">
                                還想問問其他媒材怎麼畫嗎？
                            </p>
                            <button 
                              onClick={() => {
                                setSelectedImage(null);
                                setResult(null);
                              }}
                              className="w-full py-3 text-slate-500 font-bold text-sm bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                              再問一張
                            </button>
                        </div>
                      </motion.div>
                    )}
                </div>
              </motion.div>
            )}

            {/* Recommendation - Always visible now */}
            <section className="animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Award size={20} className="text-amber-500" />
                  選擇創作媒材
                </h2>
                <span className="text-xs text-slate-400">點擊選擇</span>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                  {artMediums.map((medium) => (
                    <div 
                      key={medium.id}
                      onClick={() => setSelectedMedium(medium.id === selectedMedium ? null : medium.id)}
                      className={`
                        flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer aspect-square border
                        ${selectedMedium === medium.id 
                          ? "bg-rose-50 text-rose-600 border-rose-200 shadow-sm ring-1 ring-rose-200 scale-105" 
                          : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50 hover:border-slate-200"}
                      `}
                    >
                      <div className="text-2xl mb-1 grayscale-[0.2]">{medium.icon}</div>
                      <div className="font-bold text-[11px] text-center leading-tight">
                          {medium.name}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Recommended Masters Section */}
                {selectedMedium && mastersByMedium[selectedMedium] && (
                  <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm overflow-hidden"
                  >
                      <div className="flex items-center gap-2 mb-4">
                          <Star className="text-yellow-400" size={20} fill="currentColor" />
                          <h3 className="font-bold text-slate-900">推薦學習的大師</h3>
                      </div>
                      <div className="space-y-3">
                          {mastersByMedium[selectedMedium].map((master, idx) => (
                              <div 
                                key={idx} 
                                onClick={() => handleExploreMaster(master.name)}
                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer group"
                              >
                                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 font-black text-sm border-2 border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                                      {master.name[0]}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                          <div className="font-bold text-sm text-slate-900">{master.name}</div>
                                          <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                                              {master.tag}
                                          </span>
                                      </div>
                                      <div className="text-xs text-slate-500 mt-0.5">{master.desc}</div>
                                  </div>
                                  <div className="text-slate-300 group-hover:text-rose-400">
                                      <Zap size={16} />
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                          {isAddingMaster ? (
                            <div className="animate-fadeIn">
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        value={newMasterName}
                                        onChange={(e) => setNewMasterName(e.target.value)}
                                        placeholder="輸入你想學習的大師名字..."
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleAddMaster}
                                        disabled={isSearchingMaster || !newMasterName.trim()}
                                        className="bg-rose-600 text-white px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {isSearchingMaster ? (
                                            <Scan size={16} className="animate-spin" />
                                        ) : (
                                            <Sparkles size={16} />
                                        )}
                                        分析
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setIsAddingMaster(false)}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                >
                                    取消
                                </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-slate-400">點擊大師即可開始針對該風格的專項訓練</p>
                                <button 
                                    onClick={() => setIsAddingMaster(true)}
                                    className="text-xs text-rose-600 font-bold hover:text-rose-700 hover:underline flex items-center justify-center gap-1 w-full"
                                >
                                    <Sparkles size={12} />
                                    找不到想學的？讓 AI 幫你分析其他大師
                                </button>
                            </div>
                          )}
                      </div>
                  </motion.div>
                )}
              </section>
          </div>
        )}

        {/* === EXPLORE TAB === */}
        {activeTab === "explore" && (
          <div className="space-y-6 animate-fadeIn pb-20">
             {/* Filter Header - Wrapped Layout */}
             <header className="mb-4 py-2 sticky top-0 bg-slate-50 z-20 pb-4">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-black text-slate-900">靈感探索</h1>
                    <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-1 rounded-full font-bold">
                        AI 生成模擬畫作
                    </span>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-white border border-slate-200 rounded-xl mb-4 w-full max-w-[200px]">
                    <button
                        onClick={() => {
                            setExploreFilterType("medium");
                            setSelectedMaster(null);
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${exploreFilterType === "medium" ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        依媒材
                    </button>
                    <button
                        onClick={() => {
                            setExploreFilterType("master");
                            setSelectedMedium(null);
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${exploreFilterType === "master" ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        依大師
                    </button>
                </div>

                {/* Active Filters Display */}
                {(selectedMaster || selectedMedium) && (
                    <div className="flex items-center gap-2 mb-3 animate-fadeIn">
                        <span className="text-xs font-bold text-slate-500">篩選:</span>
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 text-rose-700 px-2 py-1 rounded-lg text-xs font-bold">
                            {selectedMaster || artMediums.find(m => m.id === selectedMedium)?.name}
                            <button 
                                onClick={() => {
                                    setSelectedMaster(null);
                                    setSelectedMedium(null);
                                }}
                                className="p-0.5 hover:bg-rose-100 rounded-full"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => {
                            setSelectedMedium(null);
                            setSelectedMaster(null);
                        }}
                        className={`
                            px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm
                            ${!selectedMedium && !selectedMaster
                                ? "bg-slate-800 text-white border-slate-800" 
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}
                        `}
                    >
                        全部
                    </button>

                    {exploreFilterType === "medium" ? (
                        /* Medium Filters */
                        artMediums.map((medium) => (
                            <button 
                                key={medium.id}
                                onClick={() => setSelectedMedium(medium.id === selectedMedium ? null : medium.id)}
                                className={`
                                    px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5
                                    ${selectedMedium === medium.id 
                                        ? "bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-200" 
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}
                                `}
                            >
                                <span className="text-sm grayscale-[0.2]">{medium.icon}</span>
                                {medium.name.split('/')[0]}
                            </button>
                        ))
                    ) : (
                        /* Master Filters */
                        Array.from(new Set(exploreGallery.map(i => i.master))).sort().map((master) => (
                            <button 
                                key={master}
                                onClick={() => setSelectedMaster(master === selectedMaster ? null : master)}
                                className={`
                                    px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5
                                    ${selectedMaster === master
                                        ? "bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-200" 
                                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}
                                `}
                            >
                                <User size={12} className={selectedMaster === master ? "text-rose-500" : "text-slate-400"} />
                                {master}
                            </button>
                        ))
                    )}
                </div>
             </header>

             {/* Masonry Layout for Artworks */}
             <div className="columns-2 gap-3 space-y-3">
                {exploreGallery
                    .filter(item => (!selectedMedium || item.medium === selectedMedium) && (!selectedMaster || item.master.includes(selectedMaster)))
                    .map((item) => (
                    <div key={item.id} onClick={() => setSelectedArtwork(item)} className="break-inside-avoid bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="relative bg-slate-200">
                            {/* AI Badge */}
                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded font-medium z-10 flex items-center gap-1">
                                <Sparkles size={10} />
                                AI
                            </div>
                            
                            <img 
                                src={item.imageUrl || `https://pollinations.ai/p/${encodeURIComponent(item.prompt)}?width=300&height=${item.height}&nologo=true&seed=${item.id}&model=flux`}
                                alt={item.title}
                                className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                style={{ height: item.height / 2 }} 
                                loading="lazy"
                            />
                            
                            {/* Zoom Icon Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                <div className="bg-white/90 p-2 rounded-full text-slate-900 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                    <Maximize2 size={20} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px]">
                                        {artMediums.find(m => m.id === item.medium)?.icon || "🖌️"}
                                    </div>
                                    <span className="text-xs text-slate-500">{item.master}</span>
                                </div>
                                <div 
                                    className="flex items-center gap-1 text-slate-400 cursor-pointer hover:text-yellow-400 transition-colors"
                                    onClick={(e) => toggleFavorite(e, item.id)}
                                >
                                    <div className="text-[10px] font-medium">{item.likes + (favoriteArtworkIds.includes(item.id) ? 1 : 0)}</div>
                                    <Star size={10} className={favoriteArtworkIds.includes(item.id) ? "fill-yellow-400 text-yellow-400" : ""} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
             
             {/* Empty State */}
             {selectedMedium && exploreGallery.filter(item => item.medium === selectedMedium).length === 0 && (
                 <div className="text-center py-12 text-slate-400">
                     <div className="flex justify-center mb-2">
                         <Palette size={32} className="opacity-20" />
                     </div>
                     <p className="text-sm">此分類尚無 AI 模擬作品</p>
                 </div>
             )}
          </div>
        )}

        {/* === HISTORY TAB === */}
        {activeTab === "history" && (
          <div className="space-y-6 animate-fadeIn">
            <header className="mb-6">
                <h1 className="text-2xl font-black text-slate-900">學習紀錄</h1>
                <p className="text-slate-500 text-sm mt-1">回顧老師給過的所有建議</p>
             </header>

             <div className="space-y-4">
                {historyItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="flex justify-center mb-2">
                        <History size={32} className="opacity-20" />
                    </div>
                    <p className="text-sm">還沒有學習紀錄喔，快去上傳第一張作品吧！</p>
                  </div>
                ) : (
                  historyItems.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedHistoryItem(item)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group hover:border-rose-200"
                  >
                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <div className="text-xs text-slate-400 font-bold mb-1">{item.date}</div>
                              <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{item.title}</h3>
                          </div>
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs
                            ${item.score >= 80 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}
                          `}>
                              {item.score}
                          </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                          {item.preview}
                      </p>
                      <div className="flex gap-2">
                          {item.tags.map((tag: string) => (
                              <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">
                                  #{tag}
                              </span>
                          ))}
                      </div>
                  </div>
                ))
                )}
             </div>
          </div>
        )}

        {/* === CHALLENGE TAB === */}
        {activeTab === "challenge" && (
          <div className="space-y-6 animate-fadeIn pb-24">
             <header className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">風格挑戰</h1>
                        <p className="text-slate-500 text-sm mt-1">完成挑戰，收集你的藝術徽章</p>
                    </div>
                </div>
             </header>

             {/* Active Style Banner - Moved from Home */}
             {selectedStyle && (
                 <div className="bg-white rounded-2xl border border-rose-100 p-4 shadow-sm animate-fadeIn space-y-4 relative overflow-hidden mb-6">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                     
                     <div className="flex items-start justify-between relative z-10">
                         <div>
                             <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                 <Sparkles size={12} />
                                 目前挑戰任務
                             </div>
                             <h2 className="text-lg font-black text-slate-900">
                                 練習 {selectedStyle}
                             </h2>
                         </div>
                         <button 
                             onClick={() => {
                                 setSelectedStyle(null);
                                 setReferenceArtwork(null);
                                 setCurrentChallengeId(null);
                             }}
                             className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                         >
                             <X size={18} />
                         </button>
                     </div>
 
                     {referenceArtwork && (
                         <div className="flex gap-4">
                             <div className="w-1/3 aspect-[3/4] rounded-lg overflow-hidden bg-slate-100 relative shadow-inner group cursor-pointer" onClick={() => {
                                 setSelectedArtwork(referenceArtwork);
                             }}>
                                 <img 
                                    src={referenceArtwork.imageUrl}
                                    alt="Reference" 
                                    className="w-full h-full object-cover"
                                />
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                     <Maximize2 size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100" />
                                 </div>
                                 <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded backdrop-blur-md">參考範本</div>
                             </div>
                             <div className="flex-1 space-y-2">
                                 <div className="bg-rose-50 rounded-lg p-3">
                                     <div className="text-[10px] font-bold text-rose-500 mb-1">重點提示</div>
                                     <p className="text-xs text-slate-700 leading-relaxed line-clamp-4">
                                         {referenceArtwork.description}
                                     </p>
                                 </div>
                                 <div className="text-xs text-slate-400 flex items-center gap-1">
                                     <Zap size={12} />
                                     上傳後 AI 將針對此風格進行評分
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* Upload Button inside Banner */}
                     <label className="block w-full relative z-10 pt-2">
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, true)}
                        />
                        <div className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold text-center cursor-pointer hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200">
                            <Upload size={18} />
                            上傳挑戰作品
                        </div>
                    </label>
                 </div>
             )}

             {/* Stats Overview */}
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-amber-100 to-orange-50 p-4 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-2 text-amber-700">
                        <Trophy size={18} />
                        <span className="text-xs font-bold">已完成挑戰</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {userChallenges.filter(c => c.status === 'completed').length}
                        <span className="text-sm font-medium text-slate-400 ml-1">/ {exploreGallery.length}</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <Star size={18} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold">平均評分</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {(() => {
                            const completed = userChallenges.filter(c => c.status === 'completed');
                            return completed.length > 0 
                                ? Math.round(completed.reduce((acc, c) => acc + (c.result?.score || 0), 0) / completed.length) 
                                : 0;
                        })()}
                    </div>
                </div>
             </div>

             {/* Challenge List */}
             <div className="space-y-4">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <Compass size={18} className="text-rose-500" />
                    進行中的挑戰 ({userChallenges.filter(c => c.status === 'in_progress').length})
                </h2>
                
                {userChallenges.length === 0 ? (
                     <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                         <div className="flex justify-center mb-4">
                             <Trophy size={48} className="opacity-20 text-slate-400" />
                         </div>
                         <h3 className="font-bold text-slate-900 mb-1">尚無挑戰紀錄</h3>
                         <p className="text-sm mb-4">前往「探索」頁面選擇一個風格開始挑戰吧！</p>
                         <button 
                            onClick={() => setActiveTab("explore")}
                            className="bg-rose-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-700 transition-colors"
                         >
                            去探索
                         </button>
                     </div>
                ) : (
                    userChallenges.map((challenge) => {
                        const isCompleted = challenge.status === 'completed';
                        
                        return (
                            <div key={challenge.id} className={`
                                relative bg-white rounded-2xl border overflow-hidden transition-all group
                                ${isCompleted ? "border-green-200 bg-green-50/10" : "border-slate-200 hover:border-rose-200 hover:shadow-md"}
                            `}>
                                <div className="flex flex-col sm:flex-row">
                                    {/* Image Section - More prominent */}
                                    <div className="w-full sm:w-1/3 aspect-video sm:aspect-square relative bg-slate-100">
                                        <img 
                                            src={challenge.imageUrl || `https://pollinations.ai/p/${encodeURIComponent(challenge.prompt)}?width=300&height=300&nologo=true&seed=${challenge.galleryId || challenge.id}&model=flux`}
                                            alt={challenge.title}
                                            className={`w-full h-full object-cover ${!isCompleted ? "grayscale opacity-80" : ""}`}
                                        />
                                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1">
                                            <Clock size={10} />
                                            {challenge.startTime}
                                        </div>
                                        {isCompleted && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-[1px]">
                                                <div className="bg-white/90 text-green-700 px-3 py-1 rounded-full text-xs font-black shadow-lg flex items-center gap-1">
                                                    <CheckCircle2 size={14} />
                                                    挑戰成功
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-900 text-base">{challenge.title}</h3>
                                                {isCompleted && (
                                                    <div className={`
                                                        w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs
                                                        ${challenge.result?.score >= 80 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}
                                                    `}>
                                                        {challenge.result?.score}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                                                <Palette size={12} />
                                                {challenge.master}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                            {!isCompleted ? (
                                                <div className="flex items-center gap-3 w-full justify-between">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAbandonChallenge(challenge.id);
                                                        }}
                                                        className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                                                    >
                                                        <LogOut size={12} />
                                                        放棄
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            // Resume challenge
                                                            setSelectedStyle(challenge.master);
                                                            // Restore medium for analysis
                                                            setSelectedMedium(challenge.mediaId || challenge.medium || 'watercolor');
                                                            setReferenceArtwork({
                                                                id: challenge.galleryId,
                                                                title: challenge.title,
                                                                master: challenge.master,
                                                                medium: challenge.medium,
                                                                imageUrl: challenge.imageUrl,
                                                                prompt: challenge.prompt,
                                                                description: exploreGallery.find(g => g.id === challenge.galleryId)?.description || ""
                                                            });
                                                            setCurrentChallengeId(challenge.id);
                                                            setShowChallengeIntro(true); // Show learning focus again
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="text-xs bg-rose-600 text-white px-4 py-1.5 rounded-full font-bold hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200"
                                                    >
                                                        繼續挑戰
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-full flex justify-end">
                                                    <button 
                                                        onClick={() => setSelectedHistoryItem(historyItems.find(h => h.imageUrl === challenge.result?.imageUrl))}
                                                        className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1"
                                                    >
                                                        查看詳細報告
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
             </div>
          </div>
        )}

        {/* === PROFILE TAB === */}
        {activeTab === "profile" && (
            <div className="space-y-6 animate-fadeIn pb-20">
                <header className="mb-6">
                    <h1 className="text-2xl font-black text-slate-900">個人中心</h1>
                    <p className="text-slate-500 text-sm mt-1">管理你的帳號與設定</p>
                </header>

                {/* User Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
                    <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl shadow-inner overflow-hidden">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />
                            ) : (
                                "👻"
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">{session?.user?.name || "訪客用戶"}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                    {!session ? "訪客" : 
                                      usageStats.plan === 'plus' ? "進階會員" : 
                                      usageStats.plan === 'pro' ? "PRO 會員" : "免費會員"}
                                </span>
                                {session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                                    <Link href="/admin">
                                        <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold cursor-pointer hover:bg-rose-200 transition-colors">
                                            管理員
                                        </span>
                                    </Link>
                                )}
                                <span className="text-[10px] text-rose-500 font-bold">
                                    {session 
                                        ? usageStats.total > 0 
                                            ? `剩餘 ${usageStats.total} 次${usageStats.isTrialExpired && usageStats.credits > 0 ? ' (加購)' : usageStats.plan === 'free' && !usageStats.isTrialExpired ? ' (試用)' : ''}`
                                            : usageStats.plan === 'free' && usageStats.isTrialExpired 
                                                ? "試用已結束"
                                                : `剩餘 ${usageStats.total} 次` 
                                        : `本月剩餘 ${Math.max(0, 1 - analysisCount)} 次`
                                    }
                                </span>
                            </div>
                            {session && usageStats.plan === 'free' && usageStats.trialStartedAt && !usageStats.isTrialExpired && (
                                <div className="text-[10px] text-slate-400 mt-1">
                                    試用期剩餘 {Math.max(0, Math.ceil((new Date(new Date(usageStats.trialStartedAt).getTime() + 7 * 86400000).getTime() - Date.now()) / 86400000))} 天
                                </div>
                            )}
                        </div>
                    </div>
                    {!session && (
                        <button 
                            onClick={() => setShowLoginModal(true)}
                            className="w-full mt-5 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                        >
                            <User size={16} />
                            登入 / 註冊會員
                        </button>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => {
                            setActiveTab('history');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white p-3 rounded-2xl border border-slate-100 text-center cursor-pointer hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                    >
                        <div className="text-2xl font-black text-slate-900">{historyItems.length}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1">分析次數</div>
                    </button>
                    <button 
                        onClick={() => {
                            setActiveTab('challenge');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white p-3 rounded-2xl border border-slate-100 text-center cursor-pointer hover:border-purple-200 hover:bg-purple-50/50 transition-all"
                    >
                        <div className="text-2xl font-black text-slate-900">{userChallenges.filter(c => c.status === 'completed').length}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1">完成挑戰</div>
                    </button>
                    <button 
                        onClick={() => setIsFavoritesExpanded(true)}
                        className="bg-white p-3 rounded-2xl border border-slate-100 text-center hover:border-rose-200 hover:bg-rose-50/50 transition-all cursor-pointer"
                    >
                        <div className="text-2xl font-black text-slate-900">{favoriteArtworkIds.length}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1">收藏作品</div>
                    </button>
                </div>







                {/* Menu List */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <button 
                        onClick={() => setShowProModal(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                                <CreditCard size={16} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">升級 Plus 方案</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button 
                        onClick={() => setShowSettingsModal(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                                <Settings size={16} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">系統設定</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button 
                        onClick={() => setShowSupportModal(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                                <MessageSquare size={16} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">線上客服</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button 
                        onClick={() => setShowAboutModal(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center">
                                <Info size={16} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">關於畫重點</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    {session && (
                        <button 
                            onClick={() => signOut()}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-t border-slate-50 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors flex items-center justify-center">
                                    <LogOut size={16} />
                                </div>
                                <span className="text-sm font-bold text-red-500">登出帳號</span>
                            </div>
                        </button>
                    )}
                </div>
                
                <div className="text-center text-[10px] text-slate-400 pt-2 pb-4">
                    v1.3.0 • Build 2026.01.22-5 (Support)
                </div>
            </div>
        )}

      </div>

      {/* Challenge Intro Overlay */}
      {showChallengeIntro && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slideUp relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-10 -mt-10 opacity-50 z-0"></div>
                
                <div className="p-6 relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shadow-inner">
                             <Target size={32} />
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-black text-slate-900 text-center mb-2">本次挑戰學習重點</h2>
                    <p className="text-sm text-slate-500 text-center mb-6">
                        AI 老師將重點觀察以下項目，請加油！
                    </p>

                    <div className="space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        {/* Media Techniques */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-rose-600 font-bold text-sm">
                                <Brush size={14} />
                                <span>媒介技法 ({MEDIA_MODULES[selectedMedium || 'watercolor']?.name || '水彩'})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(MEDIA_MODULES[selectedMedium || 'watercolor']?.core_techniques || []).slice(0, 3).map((t, i) => (
                                    <span key={i} className="text-xs bg-white border border-rose-100 text-slate-600 px-2 py-1 rounded-lg shadow-sm">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Style Techniques */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-rose-600 font-bold text-sm">
                                <Sparkles size={14} />
                                <span>風格技法 ({STYLE_MODULES[selectedStyle || 'general']?.name || selectedStyle || '通用'})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(STYLE_MODULES[selectedStyle || 'general']?.core_features || []).slice(0, 3).map((t, i) => (
                                    <span key={i} className="text-xs bg-white border border-rose-100 text-slate-600 px-2 py-1 rounded-lg shadow-sm">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Structure Focus */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-rose-600 font-bold text-sm">
                                <Scan size={14} />
                                <span>結構重點</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(STYLE_MODULES[selectedStyle || 'general']?.focus_priority || []).slice(0, 3).map((t, i) => (
                                    <span key={i} className="text-xs bg-white border border-rose-100 text-slate-600 px-2 py-1 rounded-lg shadow-sm">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button 
                        onClick={() => {
                            setShowChallengeIntro(false);
                        }}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                    >
                        稍後再說
                    </button>
                    <button 
                        onClick={() => {
                            setShowChallengeIntro(false);
                            setActiveTab("challenge");
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
                    >
                        <Zap size={16} />
                        開始挑戰
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Result Preview (Global) */}
      {selectedImage && (
        <motion.div 
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[49] bg-slate-50 overflow-y-auto"
          id="result-section"
        >
          {/* Header */}
          <div className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between shadow-sm safe-top">
               <div className="flex items-center gap-2">
                   <div className="bg-rose-600 text-white p-1.5 rounded-lg">
                       <Sparkles size={16} />
                   </div>
                   <span className="font-bold text-slate-900">分析結果</span>
               </div>
               <button 
                   onClick={() => {
                       setSelectedImage(null);
                       setResult(null);
                   }}
                   className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
               >
                   <X size={20} />
               </button>
          </div>

          <div className="p-5 pb-32">
              <div className="aspect-video bg-slate-100 rounded-xl mb-6 overflow-hidden relative shadow-inner group">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                
                {/* Feedback Overlays */}
                {result && !isAnalyzing && result.feedback.map((item: any, idx: number) => (
                    <div 
                      key={idx}
                      className={`absolute border-2 rounded-lg transition-all duration-300 pointer-events-none
                          ${activeFeedbackIndex === idx 
                              ? "border-rose-500 bg-rose-500/10 opacity-100 scale-100 shadow-[0_0_15px_rgba(244,63,94,0.5)]" 
                              : "border-transparent opacity-0 scale-95"
                          }
                      `}
                      style={{
                          left: `${item.coordinate?.x}%`,
                          top: `${item.coordinate?.y}%`,
                          width: `${item.coordinate?.w}%`,
                          height: `${item.coordinate?.h}%`,
                      }}
                    >
                        <div className={`
                          absolute -top-3 left-0 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm
                          ${activeFeedbackIndex === idx ? "opacity-100" : "opacity-0"}
                        `}>
                            修改建議 {idx + 1}
                        </div>
                    </div>
                ))}

                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white px-6 py-4 rounded-2xl flex flex-col items-center gap-3 text-sm font-bold shadow-2xl animate-pulse">
                      <Scan size={32} className="text-rose-600 animate-spin-slow" />
                      <span className="text-slate-800">老師正在仔細看你的畫...</span>
                    </div>
                  </div>
                )}
              </div>

              {result && !isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Score and Style Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Star size={120} className="text-rose-500 transform rotate-12 translate-x-10 -translate-y-10" fill="currentColor" />
                      </div>
                      
                      <div className="flex items-center justify-between relative z-10">
                          <div>
                              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">風格判定</div>
                              <div className="text-2xl font-black text-slate-900">{result.detectedStyle}</div>
                          </div>
                          <div className="text-center">
                              <div className="text-xs text-rose-500 font-bold uppercase tracking-wider mb-1">AI 評分</div>
                              <div className="text-5xl font-black text-rose-600 tracking-tighter flex items-start justify-center gap-1">
                                  <span className="text-2xl mt-1 opacity-0">0</span>
                                  {result.score}
                                  <span className="text-lg text-rose-400 font-bold mt-4">/100</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Style Match Card (Only if style is provided) */}
                  {result.styleMatch && (
                      <div className="bg-gradient-to-r from-rose-50 to-orange-50 p-4 rounded-xl border border-rose-100 flex items-start gap-4">
                          <div className="bg-white p-2 rounded-lg shadow-sm text-center min-w-[70px]">
                              <div className="text-[10px] text-slate-400 font-bold uppercase">符合度</div>
                              <div className="text-xl font-black text-rose-600">{result.styleMatch.score}%</div>
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-900 text-sm mb-1">
                                  與「{selectedStyle || '目標風格'}」的相似度分析
                              </h4>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                  {result.styleMatch.comment}
                              </p>
                          </div>
                      </div>
                  )}

                  {/* Main Analysis */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles size={18} className="text-yellow-500" />
                      整體點評
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                      {result.analysis}
                    </p>
                  </div>

                  {/* Technique Breakdown */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Brush size={16} />
                      修改重點
                    </h4>
                    {result.feedback.map((item: any, idx: number) => (
                      <div 
                          key={idx} 
                          onMouseEnter={() => setActiveFeedbackIndex(idx)}
                          onMouseLeave={() => setActiveFeedbackIndex(null)}
                          className={`
                              group relative pl-4 border-l-2 transition-all cursor-pointer p-2 rounded-r-lg
                              ${activeFeedbackIndex === idx 
                                  ? "border-rose-500 bg-rose-50" 
                                  : "border-slate-200 hover:border-rose-300 hover:bg-slate-50"}
                          `}
                      >
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`
                              text-[10px] font-bold px-1.5 py-0.5 rounded text-white
                              ${activeFeedbackIndex === idx ? "bg-rose-500" : "bg-slate-300"}
                            `}>
                                {idx + 1}
                            </span>
                            <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4 mt-4">
                      <p className="text-center text-xs text-slate-400 mb-4">
                          還想問問其他媒材怎麼畫嗎？
                      </p>
                      <button 
                        onClick={() => {
                          setSelectedImage(null);
                          setResult(null);
                        }}
                        className="w-full py-3 text-slate-500 font-bold text-sm bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        再問一張
                      </button>
                  </div>
                </motion.div>
              )}
          </div>
        </motion.div>
      )}

      {/* Lightbox Modal */}
      {selectedArtwork && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn">
            <button 
                onClick={() => setSelectedArtwork(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md transition-colors"
            >
                <X size={24} />
            </button>
            
            <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
                <div className="relative flex-1 bg-slate-100 overflow-hidden flex items-center justify-center min-h-[300px]">
                     <img 
                        src={selectedArtwork.imageUrl}
                        alt={selectedArtwork.title}
                        className="max-w-full max-h-full object-contain"
                    />
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-md flex items-center gap-1">
                        <Sparkles size={12} className="text-rose-400" />
                        AI 生成
                    </div>
                </div>
                
                <div className="p-5 bg-white">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 mb-1">{selectedArtwork.title}</h2>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Palette size={14} />
                                    {selectedArtwork.master}
                                </span>
                                <span>•</span>
                                <span 
                                    className="flex items-center gap-1 cursor-pointer hover:text-yellow-500 transition-colors"
                                    onClick={(e) => toggleFavorite(e, selectedArtwork.id)}
                                >
                                    <Star size={14} className={favoriteArtworkIds.includes(selectedArtwork.id) ? "fill-yellow-400 text-yellow-400" : "text-slate-400"} />
                                    {selectedArtwork.likes + (favoriteArtworkIds.includes(selectedArtwork.id) ? 1 : 0)}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleTryStyle(selectedArtwork)}
                            className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-colors"
                        >
                            試試這個風格
                        </button>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                        {selectedArtwork.description.includes("【技巧】") ? (
                            <>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1 bg-blue-100 text-blue-600 rounded-md">
                                            <Paintbrush size={12} />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-800">風格技巧</h4>
                                    </div>
                                    <ul className="list-disc list-outside pl-4 space-y-1 marker:text-blue-300">
                                        {selectedArtwork.description.split("【技巧】")[1].split("【注意】")[0].split(/[。]/).filter((s: string) => s.trim()).map((s: string, i: number) => (
                                            <li key={i} className="text-xs text-slate-600 leading-relaxed">
                                                {s.trim()}。
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {selectedArtwork.description.includes("【注意】") && (
                                    <div className="pt-3 border-t border-slate-200/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1 bg-amber-100 text-amber-600 rounded-md">
                                                <AlertCircle size={12} />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800">注意事項</h4>
                                        </div>
                                        <ul className="list-disc list-outside pl-4 space-y-1 marker:text-amber-300">
                                            {selectedArtwork.description.split("【注意】")[1].split(/[。]/).filter((s: string) => s.trim()).map((s: string, i: number) => (
                                                <li key={i} className="text-xs text-slate-600 leading-relaxed">
                                                    {s.trim()}。
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {selectedArtwork.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* History Detail Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl max-h-[85vh] overflow-hidden animate-slideUp">
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <div className="text-xs text-slate-400 font-bold mb-1">{selectedHistoryItem.date}</div>
                        <h2 className="text-xl font-black text-slate-900">{selectedHistoryItem.title}</h2>
                    </div>
                    <button 
                        onClick={() => setSelectedHistoryItem(null)}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-5 overflow-y-auto">
                    {/* Image Preview with Overlays */}
                    <div className="aspect-video bg-slate-100 rounded-xl mb-6 overflow-hidden relative shadow-inner group">
                        <img src={selectedHistoryItem.imageUrl} alt={selectedHistoryItem.title} className="w-full h-full object-cover" />
                        
                        {/* Feedback Overlays */}
                        {selectedHistoryItem.feedback.map((item: any, idx: number) => (
                            <div 
                                key={idx}
                                className={`absolute border-2 rounded-lg transition-all duration-300 pointer-events-none
                                    ${activeFeedbackIndex === idx 
                                        ? "border-rose-500 bg-rose-500/10 opacity-100 scale-100 shadow-[0_0_15px_rgba(244,63,94,0.5)]" 
                                        : "border-transparent opacity-0 scale-95"
                                    }
                                `}
                                style={{
                                    left: `${item.coordinate?.x}%`,
                                    top: `${item.coordinate?.y}%`,
                                    width: `${item.coordinate?.w}%`,
                                    height: `${item.coordinate?.h}%`,
                                }}
                            >
                                <div className={`
                                    absolute -top-3 left-0 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm
                                    ${activeFeedbackIndex === idx ? "opacity-100" : "opacity-0"}
                                `}>
                                    修改建議 {idx + 1}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Score Section */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm
                            ${selectedHistoryItem.score >= 80 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}
                        `}>
                            {selectedHistoryItem.score}
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">本次評分</div>
                            <div className="font-bold text-slate-900">
                                {selectedHistoryItem.score >= 80 ? "表現很棒！" : "再接再厲！"}
                            </div>
                        </div>
                    </div>

                    {/* Analysis Text */}
                    <div className="space-y-4 mb-6">
                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                            <h3 className="font-bold text-rose-800 text-sm mb-2 flex items-center gap-2">
                                <Sparkles size={16} />
                                老師的話
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {selectedHistoryItem.analysis}
                            </p>
                        </div>
                    </div>

                    {/* Feedback Items */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Brush size={16} className="text-slate-400" />
                            修改建議
                        </h3>
                        {selectedHistoryItem.feedback.map((item: any, idx: number) => (
                            <div 
                                key={idx} 
                                onMouseEnter={() => setActiveFeedbackIndex(idx)}
                                onMouseLeave={() => setActiveFeedbackIndex(null)}
                                className={`
                                    bg-slate-50 p-3 rounded-xl border transition-all cursor-pointer
                                    ${activeFeedbackIndex === idx 
                                        ? "border-rose-500 ring-1 ring-rose-500 shadow-md" 
                                        : "border-slate-100 hover:border-rose-300"}
                                `}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`
                                        text-[10px] font-bold px-1.5 py-0.5 rounded text-white
                                        ${activeFeedbackIndex === idx ? "bg-rose-600" : "bg-slate-400"}
                                    `}>
                                        {idx + 1}
                                    </span>
                                    <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {item.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button 
                        onClick={() => setSelectedHistoryItem(null)}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp">
                <div className="p-6">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                            👋
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-2">歡迎來到畫重點</h2>
                        <p className="text-sm text-slate-500">
                             感謝你喜歡我們的平台，<br/>
                             加入會員可享有一周一次(一個月四次)的免費使用機會
                        </p>
                    </div>

                    <div className="space-y-3">
                        {/* Google */}
                        <button 
                            onClick={() => signIn("google")}
                            className="w-full py-3.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 relative"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            使用 Google 繼續
                        </button>

                        {/* LINE */}
                        <button 
                            onClick={() => signIn("line")}
                            className="w-full py-3.5 px-4 bg-[#06C755] text-white rounded-xl font-bold text-sm hover:bg-[#05b34c] transition-colors flex items-center justify-center gap-3 shadow-md shadow-green-100"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2.5c-5.5 0-10 3.9-10 8.8 0 4.4 3.6 8 8.9 8.6.6.1 1.4.3 1.6 1 .2.6 0 1.9-.1 2.3 0 .1-.1.5.4.3 2.3-1.3 6.2-3.7 8.5-6.3 1.7-1.8 2.6-3.7 2.6-5.9 0-4.9-4.5-8.8-11.9-8.8zm-5.8 8h-1.3v-4h1.3v1.5h1.7v1h-1.7v1.5zm3.6 0h-1.3v-4h1.3v4zm3.7 0h-1.3v-2.7l-1.9 2.7h-1.2v-4h1.3v2.8l1.9-2.8h1.2v4zm4.1 0h-3v-4h3v1h-1.7v.5h1.7v1h-1.7v.5h1.7v1z" />
                            </svg>
                            使用 LINE 繼續
                        </button>

                        {/* Email */}
                        <button 
                            onClick={() => alert("Email 登入功能開發中...")}
                            className="w-full py-3.5 px-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 shadow-md shadow-slate-200"
                        >
                            <Mail size={18} />
                            使用 Email 繼續
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => setShowLoginModal(false)}
                            className="text-xs text-slate-400 font-bold hover:text-slate-600 px-4 py-2"
                        >
                            暫不登入，繼續體驗
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* === PRO MODAL === */}
      {/* Updated to use Plus/Pro+ naming convention */}
      {showProModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp relative">
                <button 
                    onClick={() => setShowProModal(false)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10"
                >
                    <X size={20} />
                </button>
                
                <div className="p-6 pt-12">
                    {/* Free Limit Warning */}
                    <div className="text-center mb-6">
                         <div className="inline-block bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold mb-3">
                             免費額度已用完
                         </div>
                         <h3 className="text-lg font-black text-slate-900 mb-2">本週免費額度已用完</h3>
                         <p className="text-sm text-slate-500">
                             升級 Plus 方案，每天都能獲得專業指導<br/>
                             讓進步不再受限！
                         </p>
                    </div>

                    {/* Plan Toggles */}
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-6 relative">
                        <button 
                            onClick={() => setProPlanType("pro")}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all relative z-10 flex flex-col items-center justify-center leading-none gap-1 ${proPlanType === "pro" ? "text-rose-600 bg-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <span className="text-sm">Plus</span>
                            <span className="text-[10px] text-rose-500 font-extrabold">推薦</span>
                        </button>
                        <button 
                            onClick={() => setProPlanType("pro_plus")}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all relative z-10 flex items-center justify-center ${proPlanType === "pro_plus" ? "text-rose-600 bg-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Pro+
                        </button>
                    </div>

                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-rose-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg shadow-rose-200 transform rotate-3">
                            <Star size={32} fill="currentColor" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-1">
                            {proPlanType === "pro" ? "每天一張，穩定進步" : "給真正認真學畫的人"}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {proPlanType === "pro" ? "適合建立繪畫習慣的你" : "適合追求極致細節的你"}
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
                        <div className="flex items-baseline justify-center gap-1 mb-4">
                            <span className="text-3xl font-black text-slate-900">
                                {proPlanType === "pro" ? "$150" : "$300"}
                            </span>
                            <span className="text-sm text-slate-500 font-bold">/ 月</span>
                        </div>
                        <ul className="space-y-3">
                            {(proPlanType === "pro" ? [
                                "每月 30 次作品分析 (一天 1 次)",
                                "解鎖所有畫風案例",
                                "完整「畫風技巧＋臨摹重點」",
                                "去除所有廣告",
                                "新功能優先體驗"
                            ] : [
                                "每月 100 次作品分析 (一天 > 3 次)",
                                "深度分析 (構圖 / 線條 / 明暗)",
                                "可查看歷史分析紀錄",
                                "無廣告＋完整內容",
                                "專屬大師風格評分報告"
                            ]).map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 size={12} />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 mb-3">
                        立即升級 {proPlanType === "pro" ? "Plus" : "Pro+"}
                    </button>
                    <p className="text-center text-[10px] text-slate-400">
                        隨時可取消訂閱，不綁約
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* === SETTINGS MODAL === */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp relative">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-900">系統設定</h2>
                    <button 
                        onClick={() => setShowSettingsModal(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-2">
                    <div className="p-4 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <AlertCircle size={18} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">接收推播通知</span>
                        </div>
                        <div className="w-10 h-6 bg-rose-600 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                <Zap size={18} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">深色模式</span>
                        </div>
                        <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                    <button 
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                        onClick={() => {
                            if(confirm("確定要清除快取嗎？這可能會登出您的帳號。")) {
                                localStorage.clear();
                                window.location.reload();
                            }
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                                <History size={18} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">清除應用程式快取</span>
                        </div>
                    </button>
                </div>

                <div className="p-4 bg-slate-50 text-center">
                    <div className="text-xs font-bold text-slate-500 mb-1">ArtTutor123 畫重點</div>
                    <div className="text-[10px] text-slate-400">Version 1.0.0 (Build 2026.01.21)</div>
                </div>
            </div>
        </div>
      )}

      {/* === ABOUT MODAL === */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp relative max-h-[80vh] overflow-y-auto">
                <button 
                    onClick={() => setShowAboutModal(false)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10"
                >
                    <X size={20} />
                </button>
                
                <div className="p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-xl shadow-rose-200 transform rotate-6 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                        <img src="/logo.svg" alt="ArtTutor123 Logo" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1">畫重點</h2>
                    <p className="text-xs font-bold text-rose-500 tracking-[0.2em] uppercase mb-6">ArtTutor123</p>
                    
                    <div className="space-y-6 text-left">
                        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                            <h3 className="font-bold text-rose-700 mb-2 flex items-center gap-2">
                                <Sparkles size={16} />
                                你的 24 小時貼身繪畫家教
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                我們相信每個人都能畫出心中的畫面。ArtTutor123 結合最新 AI 視覺分析技術，為您提供即時、專業的繪畫指導，就像身邊隨時有一位美術老師，隨拍隨問，讓學習繪畫不再有門檻。
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 mb-3">主要功能</h3>
                            <ul className="space-y-3">
                                <li className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                                        <Scan size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">AI 即時評點</div>
                                        <p className="text-xs text-slate-500">上傳作品，立即獲得構圖、色彩、光影的具體修改建議。</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                                        <Compass size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">風格探索挑戰</div>
                                        <p className="text-xs text-slate-500">跟隨大師的腳步，挑戰不同畫風，系統化累積你的創作經驗。</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-6 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400 mb-4">
                                有任何建議或問題？歡迎聯繫我們
                            </p>
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-colors">
                                <Mail size={14} />
                                聯絡開發團隊
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* === SUPPORT MODAL === */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slideUp relative max-h-[85vh] flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                            <MessageSquare size={16} fill="currentColor" />
                        </div>
                        <h2 className="text-lg font-black text-slate-900">線上客服</h2>
                    </div>
                    <button 
                        onClick={() => setShowSupportModal(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto bg-slate-50">
                    {!session ? (
                         <div className="text-center py-12 text-slate-400">
                             <MessageSquare size={48} className="mb-4 opacity-20 mx-auto" />
                             <p className="text-sm font-bold">請先登入會員</p>
                             <p className="text-xs mt-1">登入後即可使用線上客服功能</p>
                             <button 
                                 onClick={() => {
                                     setShowSupportModal(false);
                                     setShowLoginModal(true);
                                 }}
                                 className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold"
                             >
                                 前往登入
                             </button>
                         </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Create Ticket Form */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Sparkles size={16} className="text-green-500" />
                                    建立新提問
                                </h3>
                                <div className="space-y-3">
                                    {/* Category Select */}
                                    <div className="relative">
                                        <select
                                            value={ticketCategory}
                                            onChange={(e) => setTicketCategory(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all appearance-none font-bold text-slate-700"
                                        >
                                            {SUPPORT_CATEGORIES.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                    
                                    <input 
                                        type="text" 
                                        value={ticketSubject}
                                        onChange={(e) => setTicketSubject(e.target.value)}
                                        placeholder="主旨 (例如：AI 分析失敗)"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                    />
                                    <textarea 
                                        value={ticketContent}
                                        onChange={(e) => setTicketContent(e.target.value)}
                                        placeholder="請詳細描述您遇到的問題..."
                                        className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none"
                                    ></textarea>
                                    <button 
                                        onClick={handleCreateTicket}
                                        disabled={isCreatingTicket || !ticketSubject.trim() || !ticketContent.trim()}
                                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isCreatingTicket ? (
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <MessageSquare size={16} />
                                        )}
                                        發送提問
                                    </button>
                                </div>
                            </div>

                            {/* Ticket List */}
                            <div>
                                <h3 className="font-bold text-slate-900 mb-3 px-1">歷史提問紀錄</h3>
                                {supportTickets.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <p className="text-xs">尚無提問紀錄</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {supportTickets.map((ticket) => (
                                            <div 
                                                key={ticket.id} 
                                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                                            >
                                                <div 
                                                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                                                    onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`
                                                            w-2 h-2 rounded-full
                                                            ${ticket.status === 'open' ? 'bg-green-500' :
                                                              ticket.status === 'replied' ? 'bg-blue-500' :
                                                              'bg-slate-300'}
                                                        `} />
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-sm">{ticket.subject}</div>
                                                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                                {ticket.tags && ticket.tags[0] && (
                                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                                                        {SUPPORT_CATEGORIES.find(c => c.id === ticket.tags[0])?.label || ticket.tags[0]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                            ticket.status === 'open' ? 'bg-green-100 text-green-600' :
                                                            ticket.status === 'replied' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {ticket.status === 'open' ? '處理中' :
                                                             ticket.status === 'replied' ? '已回覆' : '已結案'}
                                                        </span>
                                                        <ChevronDown 
                                                            size={16} 
                                                            className={`text-slate-400 transition-transform duration-200 ${expandedTicketId === ticket.id ? 'rotate-180' : ''}`}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <AnimatePresence>
                                                    {expandedTicketId === ticket.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="border-t border-slate-100 bg-slate-50"
                                                        >
                                                            <div className="p-4 pt-2">
                                                                <div className="mb-2">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">您的問題</span>
                                                                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                                                        {ticket.content}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/50 pt-2 mt-3">
                                                                    <span>案件編號: #{ticket.id.slice(-6)}</span>
                                                                </div>
                                                                
                                                                {/* Reply Section */}
                                                                {ticket.reply && (
                                                                    <div className="mt-3 pt-3 border-t border-slate-200/50">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-[10px]">
                                                                                🤖
                                                                            </div>
                                                                            <span className="text-xs font-bold text-slate-900">客服回覆</span>
                                                                        </div>
                                                                        <div className="bg-white p-3 rounded-xl text-xs text-slate-700 leading-relaxed border border-rose-100 shadow-sm">
                                                                            {ticket.reply}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* === FAVORITES MODAL === */}
      {isFavoritesExpanded && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp relative h-[80vh] flex flex-col">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                            <Heart size={16} fill="currentColor" />
                        </div>
                        <h2 className="text-lg font-black text-slate-900">收藏作品</h2>
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{favoriteArtworkIds.length}</span>
                    </div>
                    <button 
                        onClick={() => setIsFavoritesExpanded(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                    {favoriteArtworkIds.length > 0 ? (
                        <>
                            <div className="flex flex-wrap gap-2 pb-4">
                                 <button 
                                     onClick={() => {
                                         setFavoriteFilterType("all");
                                         setFavoriteFilterValue(null);
                                     }}
                                     className={`
                                         px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                                         ${favoriteFilterType === "all" 
                                             ? "bg-slate-900 text-white border-slate-900" 
                                             : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}
                                     `}
                                 >
                                     全部顯示
                                 </button>
                                 <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                                 {Array.from(new Set(
                                     exploreGallery
                                         .filter(a => favoriteArtworkIds.includes(a.id))
                                         .map(a => a.medium)
                                 )).map(mediumId => {
                                     const mediumName = artMediums.find(m => m.id === mediumId)?.name || mediumId;
                                     return (
                                         <button 
                                             key={mediumId}
                                             onClick={() => {
                                                 setFavoriteFilterType("medium");
                                                 setFavoriteFilterValue(mediumId);
                                             }}
                                             className={`
                                                 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1
                                                 ${favoriteFilterType === "medium" && favoriteFilterValue === mediumId
                                                     ? "bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-200" 
                                                     : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}
                                             `}
                                         >
                                             <span className="grayscale-[0.5]">{artMediums.find(m => m.id === mediumId)?.icon}</span>
                                             {mediumName}
                                         </button>
                                     );
                                 })}
                                 <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                                 {Array.from(new Set(
                                     exploreGallery
                                         .filter(a => favoriteArtworkIds.includes(a.id))
                                         .map(a => a.master)
                                 )).map(master => (
                                     <button 
                                         key={master}
                                         onClick={() => {
                                             setFavoriteFilterType("master");
                                             setFavoriteFilterValue(master);
                                         }}
                                         className={`
                                             px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5
                                             ${favoriteFilterType === "master" && favoriteFilterValue === master
                                                 ? "bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-200" 
                                                 : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}
                                         `}
                                     >
                                         <User size={10} className={favoriteFilterType === "master" && favoriteFilterValue === master ? "text-rose-500" : "text-slate-400"} />
                                         {master}
                                     </button>
                                 ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pb-20">
                                {exploreGallery
                                    .filter(artwork => favoriteArtworkIds.includes(artwork.id))
                                    .filter(artwork => {
                                        if (favoriteFilterType === "all") return true;
                                        if (favoriteFilterType === "medium") return artwork.medium === favoriteFilterValue;
                                        if (favoriteFilterType === "master") return artwork.master === favoriteFilterValue;
                                        return true;
                                    })
                                    .map(artwork => (
                                        <div 
                                            key={artwork.id} 
                                            onClick={() => {
                                                setSelectedArtwork(artwork);
                                                setIsFavoritesExpanded(false); // Close modal to show detail
                                            }}
                                            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-slate-100"
                                        >
                                            <img 
                                                src={artwork.imageUrl} 
                                                alt={artwork.title} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                                <p className="text-white text-xs font-bold line-clamp-1">{artwork.title}</p>
                                                <p className="text-white/80 text-[10px]">{artwork.master}</p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-20">
                            <Heart size={48} className="mb-4 opacity-20" />
                            <p className="text-sm font-bold">還沒有收藏的作品</p>
                            <p className="text-xs mt-1">去探索頁面看看吧！</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50">
        <div className="max-w-md mx-auto h-20 grid grid-cols-5 items-center pb-4">
          <button 
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === "home" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <HomeIcon size={24} />
            <span className="text-[10px] font-bold">首頁</span>
          </button>
          <button 
            onClick={() => setActiveTab("explore")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === "explore" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Compass size={24} />
            <span className="text-[10px] font-bold">探索</span>
          </button>
          <button 
            onClick={() => setActiveTab("challenge")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === "challenge" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Trophy size={24} className={activeTab === "challenge" ? "fill-current" : ""} />
            <span className="text-[10px] font-bold">挑戰</span>
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === "history" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <History size={24} />
            <span className="text-[10px] font-bold">紀錄</span>
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === "profile" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <User size={24} />
            <span className="text-[10px] font-bold">我的</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
                                    .filter(artwork => favoriteArtworkIds.includes(artwork.id))
                                    .filter(artwork => {
                                        if (favoriteFilterType === "all") return true;
                                        if (favoriteFilterType === "medium") return artwork.medium === favoriteFilterValue;
                                        if (favoriteFilterType === "master") return artwork.master === favoriteFilterValue;
                                        return true;
                                    })
                                    .map(artwork => (
                                        <div 
                                            key={artwork.id} 
                                            onClick={() => {
                                                setSelectedArtwork(artwork);
                                                setIsFavoritesExpanded(false); // Close modal to show detail
                                            }}
                                            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-slate-100"
                                        >
                                            <img 
                                                src={artwork.imageUrl} 
                                                alt={artwork.title} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                                <p className="text-white text-xs font-bold line-clamp-1">{artwork.title}</p>
                                                <p className="text-white/80 text-[10px]">{artwork.master}</p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-20">
                            <Heart size={48} className="mb-4 opacity-20" />
                            <p className="text-sm font-bold">還沒有收藏的作品</p>
                            <p className="text-xs mt-1">去探索頁面看看吧！</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50">
        <div className="max-w-md mx-auto h-20 grid grid-cols-5 items-center pb-4">
          <button 
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === "home" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <HomeIcon size={24} />
            <span className="text-[10px] font-bold">首頁</span>
          </button>
          <button 
            onClick={() => setActiveTab("explore")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === "explore" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Compass size={24} />
            <span className="text-[10px] font-bold">探索</span>
          </button>
          <button 
            onClick={() => setActiveTab("challenge")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === "challenge" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Trophy size={24} className={activeTab === "challenge" ? "fill-current" : ""} />
            <span className="text-[10px] font-bold">挑戰</span>
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === "history" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <History size={24} />
            <span className="text-[10px] font-bold">紀錄</span>
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${activeTab === "profile" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <User size={24} />
            <span className="text-[10px] font-bold">我的</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
}
