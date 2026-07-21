/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, ComponentType } from 'react';
import { Heart, Flower, Leaf, Star, Smile, Gift, Sparkles, Cake, Users, Flower2, RotateCcw, Music, Type, Settings, PenTool, Check, Palette, Plus, Minus, VolumeX, Coffee, TreePine, Video, Loader2, Play, Download, AlertCircle, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';

import coupleImg from './assets/images/couple_romantic_icon_1783908155583.jpg';
import bouquetImg from './assets/images/romantic_bouquet_icon_1783908168429.jpg';
import balloonImg from './assets/images/romantic_heart_balloon_1783908331745.jpg';
import letterImg from './assets/images/love_letter_envelope_1783908344094.jpg';
import birdsImg from './assets/images/love_birds_1783908354466.jpg';

function oklabToRgb(l: number, a_val: number, b_val: number, a: number = 1): string {
  // OKLAB to LMS
  const l_ = l + 0.3963377774 * a_val + 0.2158037573 * b_val;
  const m_ = l - 0.1055613458 * a_val - 0.0638541728 * b_val;
  const s_ = l - 0.0894841775 * a_val - 1.2914855480 * b_val;

  // LMS linear
  const l_linear = Math.pow(Math.max(0, l_), 3);
  const m_linear = Math.pow(Math.max(0, m_), 3);
  const s_linear = Math.pow(Math.max(0, s_), 3);

  // LMS linear to Linear sRGB
  const r_linear = +4.0767416621 * l_linear - 3.3077115913 * m_linear + 0.2309699292 * s_linear;
  const g_linear = -1.2684380046 * l_linear + 2.6097574011 * m_linear - 0.3413193965 * s_linear;
  const b_linear = -0.0041960863 * l_linear - 0.7034186147 * m_linear + 1.7076147010 * s_linear;

  // Linear sRGB to standard sRGB (with gamma correction)
  const gamma = (x: number) => {
    return x > 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;
  };

  const r = Math.min(255, Math.max(0, Math.round(gamma(r_linear) * 255)));
  const g = Math.min(255, Math.max(0, Math.round(gamma(g_linear) * 255)));
  const b = Math.min(255, Math.max(0, Math.round(gamma(b_linear) * 255)));

  if (a === 1) {
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

function oklchToRgb(l: number, c: number, h: number, a: number = 1): string {
  // Convert hue to radians
  const hRad = (h * Math.PI) / 180;
  const a_val = c * Math.cos(hRad);
  const b_val = c * Math.sin(hRad);

  return oklabToRgb(l, a_val, b_val, a);
}

function replaceOklchInString(val: string): string {
  if (!val || typeof val !== 'string') return val;
  
  // Replace OKLCH
  const oklchRegex = /oklch\(\s*([\d.%\-]+)[\s,]+([\d.%\-]+)[\s,]+([\d.%\-]+(?:deg)?)(?:\s*[\/\s,]\s*([\d.%\-]+))?\s*\)/gi;
  let result = val.replace(oklchRegex, (match, lStr, cStr, hStr, aStr) => {
    let l = parseFloat(lStr);
    if (lStr.includes('%')) l = l / 100;
    let c = parseFloat(cStr);
    if (cStr.includes('%')) c = c / 100;
    let h = parseFloat(hStr);
    let a = 1;
    if (aStr) {
      a = parseFloat(aStr);
      if (aStr.includes('%')) a = a / 100;
    }
    return oklchToRgb(l, c, h, a);
  });

  // Replace OKLAB
  const oklabRegex = /oklab\(\s*([\d.%\-]+)[\s,]+([\d.%\-]+)[\s,]+([\d.%\-]+)(?:\s*[\/\s,]\s*([\d.%\-]+))?\s*\)/gi;
  result = result.replace(oklabRegex, (match, lStr, aStrVal, bStrVal, alphaStr) => {
    let l = parseFloat(lStr);
    if (lStr.includes('%')) l = l / 100;
    let aVal = parseFloat(aStrVal);
    if (aStrVal.includes('%')) aVal = aVal / 100;
    let bVal = parseFloat(bStrVal);
    if (bStrVal.includes('%')) bVal = bVal / 100;
    let alpha = 1;
    if (alphaStr) {
      alpha = parseFloat(alphaStr);
      if (alphaStr.includes('%')) alpha = alpha / 100;
    }
    return oklabToRgb(l, aVal, bVal, alpha);
  });

  return result;
}

type SceneType = 'rose' | 'garden' | 'forest' | 'sunset' | 'ocean' | 'sakura' | 'sky' | 'plain';
type BgStyleType = 'solid' | 'floating' | 'hearts' | 'grid' | 'blobs';
type FontStyleType = 'playfair' | 'dancing' | 'pacifico' | 'caveat' | 'lora' | 'nunito';
type DecorType = 'Heart' | 'Star' | 'Smile' | 'Gift' | 'Sparkles' | 'Cake' | 'Users' | 'Flower2' | 'Couple' | 'Bouquet' | 'Balloon' | 'Letter' | 'Birds';

const fontRegistry: Record<FontStyleType, { label: string; class: string }> = {
  playfair: { label: 'Sang trọng', class: 'font-playfair' },
  dancing: { label: 'Lãng mạn', class: 'font-dancing' },
  pacifico: { label: 'Dễ thương', class: 'font-pacifico' },
  caveat: { label: 'Viết tay', class: 'font-caveat' },
  lora: { label: 'Cổ điển', class: 'font-lora' },
  nunito: { label: 'Hiện đại', class: 'font-nunito' },
};

const musicTracks = [
  { id: 'none', label: 'Tắt nhạc', icon: VolumeX, url: '' },
  { id: 'romantic', label: 'Tình yêu', icon: Heart, url: 'https://archive.org/download/LaCordaDoro-CanonInDMajor/05Pachelbel-CanonInDMajor.mp3' },
  { id: 'birthday', label: 'Sinh nhật', icon: Gift, url: 'https://archive.org/download/HappyBirthdayInstrumentalPianoViaInstrumentals.com.ng/Happy%20Birthday%20Instrumental%20Piano%20via%20instrumentals.com.ng.mp3' },
  { id: 'lofi', label: 'Nhẹ nhàng', icon: Coffee, url: 'https://archive.org/download/lofi-study/lofi-study.mp3' },
  { id: 'acoustic', label: 'Mộc mạc', icon: TreePine, url: 'https://archive.org/download/acoustic-vlog-music-chasing-the-breeze/Acoustic%20Vlog%20Music%20-%20Chasing%20the%20Breeze%20-%20by%20BMNC.mp3' },
  { id: 'ai-magic', label: 'Giai điệu diệu kỳ', icon: Sparkles, url: 'https://archive.org/download/cosmic_dharma_magic_forest_zen_garden/magic_forest.mp3' },
  { id: 'ai-piano', label: 'Piano lãng mạn', icon: Music, url: 'https://archive.org/download/elfen-lied-op-lilium-piano-solo/Elfen%20Lied%20OP%20-%20Lilium%20%28Piano%20Solo%29.mp3' }
];

const decorRegistry: Record<DecorType, { type: 'icon' | 'image', content: ComponentType<any> | string }> = {
  Heart: { type: 'icon', content: Heart },
  Star: { type: 'icon', content: Star },
  Smile: { type: 'icon', content: Smile },
  Gift: { type: 'icon', content: Gift },
  Sparkles: { type: 'icon', content: Sparkles },
  Cake: { type: 'icon', content: Cake },
  Users: { type: 'icon', content: Users },
  Flower2: { type: 'icon', content: Flower2 },
  Couple: { type: 'image', content: coupleImg },
  Bouquet: { type: 'image', content: bouquetImg },
  Balloon: { type: 'image', content: balloonImg },
  Letter: { type: 'image', content: letterImg },
  Birds: { type: 'image', content: birdsImg }
};

const sceneConfig: Record<SceneType, { bg: string; text: string; secondary: string; accent: string; button: string; icon: React.ReactNode }> = {
  rose: { bg: 'bg-rose-100', text: 'text-rose-950', secondary: 'text-rose-900', accent: 'text-rose-500', button: 'bg-rose-600', icon: <Flower className="text-rose-400" /> },
  garden: { bg: 'bg-emerald-100', text: 'text-emerald-950', secondary: 'text-emerald-900', accent: 'text-emerald-500', button: 'bg-emerald-700', icon: <Leaf className="text-emerald-400" /> },
  forest: { bg: 'bg-emerald-900', text: 'text-emerald-50', secondary: 'text-emerald-200', accent: 'text-emerald-400', button: 'bg-emerald-700', icon: <Flower className="text-emerald-300" /> },
  sunset: { bg: 'bg-orange-200', text: 'text-orange-950', secondary: 'text-orange-900', accent: 'text-orange-500', button: 'bg-orange-700', icon: <Sparkles className="text-orange-400" /> },
  ocean: { bg: 'bg-blue-200', text: 'text-blue-950', secondary: 'text-blue-900', accent: 'text-blue-500', button: 'bg-blue-700', icon: <Star className="text-blue-400" /> },
  sakura: { bg: 'bg-pink-200', text: 'text-pink-950', secondary: 'text-pink-900', accent: 'text-pink-500', button: 'bg-pink-700', icon: <Flower2 className="text-pink-400" /> },
  sky: { bg: 'bg-sky-200', text: 'text-sky-950', secondary: 'text-sky-900', accent: 'text-sky-500', button: 'bg-sky-700', icon: <Smile className="text-sky-400" /> },
  plain: { bg: 'bg-white', text: 'text-slate-900', secondary: 'text-slate-700', accent: 'text-slate-400', button: 'bg-slate-800', icon: <Heart className="text-slate-400" /> },
};

const textColors = [
  { id: 'default', label: 'Mặc định', textClass: '', secondaryClass: '' },
  { id: 'red', label: 'Đỏ', textClass: 'text-red-600', secondaryClass: 'text-red-500' },
  { id: 'pink', label: 'Hồng', textClass: 'text-pink-600', secondaryClass: 'text-pink-500' },
  { id: 'purple', label: 'Tím', textClass: 'text-purple-600', secondaryClass: 'text-purple-500' },
  { id: 'blue', label: 'Xanh dương', textClass: 'text-blue-600', secondaryClass: 'text-blue-500' },
  { id: 'emerald', label: 'Xanh ngọc', textClass: 'text-emerald-700', secondaryClass: 'text-emerald-600' },
  { id: 'slate', label: 'Đen', textClass: 'text-slate-800', secondaryClass: 'text-slate-700' },
  { id: 'white', label: 'Trắng', textClass: 'text-white', secondaryClass: 'text-white/90' },
];

export default function App() {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [totalHeartsCount, setTotalHeartsCount] = useState(0);
  const [showDate, setShowDate] = useState(false);
  const [placedItems, setPlacedItems] = useState<{ id: number; type: DecorType; x: number; y: number; scale: number; rotation: number; color?: string; animation?: "none" | "float" | "pulse" | "spin" }[]>([]);
  const [scene, setScene] = useState<SceneType>('plain');
  const [bgStyle, setBgStyle] = useState<BgStyleType>('solid');
  const [fontStyle, setFontStyle] = useState<FontStyleType>('playfair');
  const [currentMusic, setCurrentMusic] = useState(musicTracks[0]);
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [textColor, setTextColor] = useState<string>('default');
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [textSize, setTextSize] = useState(1);
  const [showTextSizeMenu, setShowTextSizeMenu] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  const [decorColor, setDecorColor] = useState<string>('#f43f5e');
  const [selectedDecorId, setSelectedDecorId] = useState<number | null>(null);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoGenerationStep, setVideoGenerationStep] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoGenResult, setVideoGenResult] = useState<any>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);

  const getWordSpacingWidth = (font: FontStyleType) => {
    switch (font) {
      case 'dancing':
        return '0.44em';
      case 'pacifico':
        return '0.40em';
      case 'caveat':
        return '0.38em';
      case 'playfair':
      case 'lora':
        return '0.34em';
      case 'nunito':
      default:
        return '0.32em';
    }
  };

  const renderSpannedText = (text: string) => {
    if (!text) return null;
    const wordSpacing = getWordSpacingWidth(fontStyle);
    return text.split('\n').map((line, lineIdx) => {
      const words = line.split(' ');
      return (
        <span key={lineIdx} className="block">
          {words.map((word, wordIdx) => {
            const isLastWord = wordIdx === words.length - 1;
            return (
              <span 
                key={wordIdx} 
                className="inline-block" 
                style={{ 
                  whiteSpace: 'pre',
                  marginRight: isLastWord ? '0px' : wordSpacing
                }}
              >
                {word}
              </span>
            );
          })}
        </span>
      );
    });
  };

  const downloadCompleteCardImage = async () => {
    const container = document.getElementById('generated-card-container');
    if (!container) return;
    
    setIsExportingImage(true);
    try {
      // Use html2canvas with scale:2 for super sharp, crisp texts & decorations
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        onclone: (clonedDoc) => {
          // 1. Clean and convert oklch values inside all <style> blocks of the cloned doc
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const styleTag = styleTags[i];
            if (styleTag.innerHTML) {
              styleTag.innerHTML = replaceOklchInString(styleTag.innerHTML);
            }
          }

          // 2. Map original computed styles to cloned elements as inline converted standard color styles
          const clonedContainer = clonedDoc.getElementById('generated-card-container');
          const originalContainer = document.getElementById('generated-card-container');
          
          if (clonedContainer && originalContainer) {
            const clonedEls = Array.from(clonedContainer.getElementsByTagName('*'));
            const originalEls = Array.from(originalContainer.getElementsByTagName('*'));
            
            // Handle container itself
            const compContainer = window.getComputedStyle(originalContainer);
            clonedContainer.style.color = replaceOklchInString(compContainer.color);
            clonedContainer.style.backgroundColor = replaceOklchInString(compContainer.backgroundColor);
            clonedContainer.style.borderColor = replaceOklchInString(compContainer.borderColor);
            if (compContainer.backgroundImage && compContainer.backgroundImage !== 'none') {
              clonedContainer.style.backgroundImage = replaceOklchInString(compContainer.backgroundImage);
            }
            if (compContainer.boxShadow && compContainer.boxShadow !== 'none') {
              clonedContainer.style.boxShadow = replaceOklchInString(compContainer.boxShadow);
            }

            // Handle children
            for (let i = 0; i < clonedEls.length; i++) {
              const clonedEl = clonedEls[i] as HTMLElement;
              const originalEl = originalEls[i] as HTMLElement;
              if (originalEl && clonedEl) {
                const comp = window.getComputedStyle(originalEl);
                
                clonedEl.style.color = replaceOklchInString(comp.color);
                clonedEl.style.backgroundColor = replaceOklchInString(comp.backgroundColor);
                clonedEl.style.borderColor = replaceOklchInString(comp.borderColor);
                clonedEl.style.fill = replaceOklchInString(comp.fill);
                clonedEl.style.stroke = replaceOklchInString(comp.stroke);
                
                if (comp.backgroundImage && comp.backgroundImage !== 'none') {
                  clonedEl.style.backgroundImage = replaceOklchInString(comp.backgroundImage);
                }
                if (comp.boxShadow && comp.boxShadow !== 'none') {
                  clonedEl.style.boxShadow = replaceOklchInString(comp.boxShadow);
                }
                
                // Also parse any existing inline styles on the cloned element
                const inlineStyle = clonedEl.getAttribute('style');
                if (inlineStyle) {
                  clonedEl.setAttribute('style', replaceOklchInString(inlineStyle));
                }
              }
            }

            // No extra spacing replacement needed since words are individually spanned with proper white-space
          }
        }
      });
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.download = `thiep-hoan-chinh-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Lỗi khi xuất ảnh thiệp hoàn chỉnh:", error);
      alert("Đang tải ảnh/video gốc... (Một số nhà cung cấp ảnh nền có thể giới hạn CORS, bạn có thể tải file gốc và lưu trực tiếp)");
      if (generatedVideoUrl) {
        const link = document.createElement('a');
        link.href = generatedVideoUrl;
        link.target = '_blank';
        link.download = 'greeting-card-raw';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setIsExportingImage(false);
    }
  };

  const generateVideo = async () => {
    setIsVideoGenerating(true);
    setGeneratedVideoUrl(null);
    setVideoGenResult(null);
    setVideoGenerationStep(0);
    setIsVideoModalOpen(true);

    const stepIntervals = [1500, 2000, 1500, 2000];
    for (let i = 0; i < 4; i++) {
      setVideoGenerationStep(i);
      await new Promise(resolve => setTimeout(resolve, stepIntervals[i]));
    }

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          message,
          scene,
          bgStyle,
          musicTrack: currentMusic,
          placedItems
        })
      });

      const result = await response.json();
      if (result.success) {
        setGeneratedVideoUrl(result.videoUrl);
        setVideoGenResult(result);
      } else {
        throw new Error(result.error || "Không thể tạo video.");
      }
    } catch (err: any) {
      console.error(err);
      setVideoGenResult({
        success: false,
        error: err.message || "Lỗi kết nối đến máy chủ."
      });
    } finally {
      setIsVideoGenerating(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        (settingsMenuRef.current && settingsMenuRef.current.contains(target)) ||
        (target instanceof Element && target.closest('.keep-open'))
      ) {
        return;
      }
      setShowSettingsMenu(false);
      setShowPalette(false);
      setShowMusicMenu(false);
      setShowTextColorMenu(false);
      setShowTextSizeMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const today = new Date();
  const [title, setTitle] = useState("Nhập chủ đề");
  const [message, setMessage] = useState("Vào Tùy chỉnh để thiết lập nhé!");
  const baseConfig = sceneConfig[scene];
  const chosenColor = textColors.find(c => c.id === textColor);
  const config = (chosenColor && chosenColor.id !== 'default') 
    ? { ...baseConfig, text: chosenColor.textClass, secondary: chosenColor.secondaryClass }
    : baseConfig;

  const addHeart = () => {
    setTotalHeartsCount(prev => prev + 12);
    setShowDate(true);
    let i = 0;
    const count = 12;
    const interval = setInterval(() => {
      const t = (2 * Math.PI / count) * i;
      
      // Responsive scale
      const isMobile = window.innerWidth < 640;
      const scale = isMobile ? 8 : 15; 
      
      const x = 16 * Math.sin(t) ** 3;
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      
      const id = Date.now() + i;
      setHearts(prev => [...prev, { id, x: x * scale, y: y * scale }]);
      
      i++;
      if (i >= count) clearInterval(interval);
    }, 150); // Faster interval for appearance
  };

  const resetHearts = () => {
    setTotalHeartsCount(0);
    setHearts([]);
    setShowDate(false);
  };

  const addDecor = (type: DecorType) => {
    let defaultAnim: "none" | "float" | "pulse" | "spin" = "none";
    if (['Heart', 'Balloon', 'Birds'].includes(type)) defaultAnim = "float";
    else if (['Star', 'Sparkles', 'Smile'].includes(type)) defaultAnim = "pulse";
    else if (['Flower2', 'Cake'].includes(type)) defaultAnim = "spin";
    setPlacedItems(prev => [...prev, { id: Date.now(), type, x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth / 2 : 200), y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight / 2 : 200), scale: 1, rotation: 0, color: decorColor, animation: defaultAnim }]);
  };

  const removeDecor = (id: number) => {
    setPlacedItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAllDecor = () => {
    setPlacedItems([]);
  };

  const scaleDecor = (id: number, delta: number) => {
    setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, scale: Math.max(0.5, Math.min(3, item.scale + delta)) } : item));
  };

  const rotateDecor = (id: number, delta: number) => {
    setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, rotation: item.rotation + delta } : item));
  };

  const cycleAnimation = (id: number) => {
    setPlacedItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const animations: ("none" | "float" | "pulse" | "spin")[] = ["none", "float", "pulse", "spin"];
      const currentIndex = animations.indexOf(item.animation || "none");
      const nextAnimation = animations[(currentIndex + 1) % animations.length];
      return { ...item, animation: nextAnimation };
    }));
  };

  const cycleScene = () => {
    const scenes: SceneType[] = ['rose', 'garden', 'forest', 'sunset', 'ocean', 'sakura', 'sky', 'plain'];
    const currentIndex = scenes.indexOf(scene);
    setScene(scenes[(currentIndex + 1) % scenes.length]);
  };

  const cycleBgStyle = () => {
    const styles: BgStyleType[] = ['solid', 'floating', 'hearts', 'grid', 'blobs'];
    const currentIndex = styles.indexOf(bgStyle);
    setBgStyle(styles[(currentIndex + 1) % styles.length]);
  };

  const cycleFont = () => {
    const fonts: FontStyleType[] = ['playfair', 'dancing', 'pacifico', 'caveat', 'lora', 'nunito'];
    const currentIndex = fonts.indexOf(fontStyle);
    setFontStyle(fonts[(currentIndex + 1) % fonts.length]);
  };

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center ${config.bg} p-6 relative overflow-hidden transition-colors duration-500`}
      onClick={() => setSelectedDecorId(null)}
    >
      {currentMusic.url && (
        <audio 
          src={currentMusic.url} 
          autoPlay 
          loop 
          className="hidden" 
        />
      )}
      {/* Decorative background elements */}
      {bgStyle === 'floating' && (
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div 
              key={i} 
              className="absolute"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ 
                y: [0, -40, 0],
                x: [0, 30, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              {config.icon}
            </motion.div>
          ))}
        </div>
      )}

      {bgStyle === 'hearts' && (
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div 
              key={i} 
              className="absolute text-rose-500"
              style={{ left: `${Math.random() * 100}%`, bottom: '-10%' }}
              animate={{ 
                y: ['0vh', '-110vh'],
                x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50]
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 10,
                ease: 'linear'
              }}
            >
              <Heart size={20 + Math.random() * 40} fill="currentColor" />
            </motion.div>
          ))}
        </div>
      )}

      {bgStyle === 'grid' && (
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
      )}

      {bgStyle === 'blobs' && (
        <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden blur-3xl">
          <motion.div 
            className="absolute top-10 left-10 w-64 h-64 sm:w-96 sm:h-96 bg-rose-300 rounded-full mix-blend-multiply" 
            animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }} 
            transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} 
          />
          <motion.div 
            className="absolute top-1/4 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-purple-300 rounded-full mix-blend-multiply" 
            animate={{ x: [0, -100, 0], y: [0, 100, 0], scale: [1, 1.1, 1] }} 
            transition={{ duration: 12, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} 
          />
          <motion.div 
            className="absolute bottom-10 left-1/3 w-64 h-64 sm:w-96 sm:h-96 bg-pink-300 rounded-full mix-blend-multiply" 
            animate={{ x: [0, 50, 0], y: [0, -100, 0], scale: [1, 1.3, 1] }} 
            transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} 
          />
        </div>
      )}

      {/* Text Content */}
      <div className="text-center z-10" style={{ transform: `scale(${textSize})`, transformOrigin: 'center' }}>
        {isEditing ? (
          <>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              onFocus={(e) => e.target.select()}
              className={`text-4xl md:text-6xl ${fontRegistry[fontStyle].class} ${config.text} mb-4 bg-white/20 border-2 border-dashed border-rose-300/30 rounded-lg p-2 w-full text-center focus:outline-none focus:border-rose-500/50 transition-all`} 
              placeholder="Nhập tiêu đề..."
            />
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              onFocus={(e) => e.target.select()}
              className={`text-2xl md:text-3xl ${fontRegistry[fontStyle].class} ${config.secondary} mb-8 bg-white/20 border-2 border-dashed border-rose-300/30 rounded-lg p-2 w-full text-center focus:outline-none focus:border-rose-500/50 transition-all resize-y`} 
              placeholder="Nhập lời nhắn..."
            />
          </>
        ) : (
          <>
            <h1 className={`text-5xl md:text-7xl ${fontRegistry[fontStyle].class} ${config.text} mb-4 transition-all leading-tight ${title === "Nhập chủ đề" ? "opacity-60" : ""}`}>
              {renderSpannedText(title)}
            </h1>
            <p className={`text-3xl md:text-4xl ${fontRegistry[fontStyle].class} ${config.secondary} mb-8 transition-all leading-relaxed ${message === "Hãy vào Tùy chỉnh để cài đặt." ? "opacity-60" : ""}`}>
              {renderSpannedText(message)}
            </p>
          </>
        )}
      </div>

      {/* Placed decor items */}
      {placedItems.map(item => {
        const decor = decorRegistry[item.type];
        
        const currentAnimate = item.animation === 'float' ? { y: [0, -20, 0], x: [0, 10, -10, 0] } :
                              item.animation === 'pulse' ? { scale: [1, 1.25, 1], opacity: [1, 0.6, 1] } :
                              item.animation === 'spin' ? { rotate: [0, 360] } :
                              {};
        const currentTransition = item.animation === 'float' ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } :
                                 item.animation === 'pulse' ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } :
                                 item.animation === 'spin' ? { duration: 4, repeat: Infinity, ease: 'linear' } :
                                 {};

        return (
          <motion.div
            key={item.id}
            drag
            dragMomentum={false}
            onPointerDown={(e) => {
              e.stopPropagation();
              setSelectedDecorId(item.id);
            }}
            onClick={(e) => e.stopPropagation()}
            onDragEnd={(_, info) => {
              setPlacedItems(prev => prev.map(p => p.id === item.id ? { ...p, x: p.x + info.offset.x, y: p.y + info.offset.y } : p));
            }}
            initial={{ x: item.x, y: item.y, scale: item.scale, rotate: item.rotation }}
            animate={{ x: item.x, y: item.y, scale: item.scale, rotate: item.rotation }}
            className={`absolute cursor-move group z-50`}
          >
            {decor.type === 'icon' ? (
              <motion.div 
                className={item.color ? "" : config.accent} 
                style={item.color ? { color: item.color } : {}}
                animate={currentAnimate}
                transition={currentTransition}
              >
                <decor.content size={48} />
              </motion.div>
            ) : (
              <motion.div 
                animate={currentAnimate}
                transition={currentTransition}
                className="bg-white/95 p-2 rounded-2xl shadow-lg border-2 border-white ring-1 ring-rose-100/20 flex items-center justify-center"
              >
                <img 
                  src={decor.content as string} 
                  alt={item.type} 
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain" 
                  draggable={false} 
                />
              </motion.div>
            )}
            <div className={`absolute -top-10 -right-6 flex flex-col gap-1 transition-opacity bg-white/50 p-1 rounded-lg z-60 ${selectedDecorId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <button onClick={() => scaleDecor(item.id, 0.2)} className="text-xs bg-white rounded-full w-5 h-5">+</button>
              <button onClick={() => scaleDecor(item.id, -0.2)} className="text-xs bg-white rounded-full w-5 h-5">-</button>
              <button onClick={() => rotateDecor(item.id, 15)} className="text-xs bg-white rounded-full w-5 h-5">↻</button>
              <button onClick={() => cycleAnimation(item.id)} className="text-xs bg-emerald-100 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center relative group/anim">
                ✨
                <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-emerald-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover/anim:opacity-100 whitespace-nowrap pointer-events-none">
                  {item.animation === 'float' ? 'Bay lượn' : item.animation === 'pulse' ? 'Nhịp đập' : item.animation === 'spin' ? 'Xoay vòng' : 'Tĩnh'}
                </span>
              </button>
              <button onClick={() => removeDecor(item.id)} className="text-xs bg-red-500 text-white rounded-full w-5 h-5">x</button>
            </div>
          </motion.div>
        );
      })}

      {/* Background/Decor Menu */}
      <div ref={settingsMenuRef} className="fixed bottom-4 left-2 sm:left-4 z-20 flex flex-col items-start gap-2">
        <AnimatePresence>
          {showSettingsMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="flex flex-wrap max-w-[calc(100vw-16px)] sm:max-w-none bg-white/90 p-2 rounded-2xl shadow-lg gap-1 sm:gap-2"
            >
              <button onClick={cycleBgStyle} className="p-1.5 sm:p-2 rounded-xl text-emerald-800 hover:bg-emerald-50 transition-all text-xs flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
                <Sparkles size={18} className="mb-0.5 sm:mb-1" />
                <span>BG: {bgStyle}</span>
              </button>
              <button onClick={cycleFont} className="p-1.5 sm:p-2 rounded-xl text-emerald-800 hover:bg-emerald-50 transition-all text-xs flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
                <Type size={18} className="mb-0.5 sm:mb-1" />
                <span>Font</span>
              </button>
              <div className="relative">
                <button onClick={() => {
                  setShowMusicMenu(!showMusicMenu);
                  setShowTextColorMenu(false);
                  setShowTextSizeMenu(false);
                  setShowPalette(false);
                }} className={`p-1.5 sm:p-2 rounded-xl ${currentMusic.id !== 'none' ? 'text-rose-600' : 'text-emerald-800'} hover:bg-emerald-50 transition-all text-xs flex flex-col items-center min-w-[50px] sm:min-w-[60px]`}>
                  <Music size={18} className="mb-0.5 sm:mb-1" />
                  <span>Nhạc</span>
                </button>
                <AnimatePresence>
                  {showMusicMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-white rounded-xl shadow-xl p-2 flex flex-col gap-1 z-30 border border-emerald-100"
                    >
                      {musicTracks.map(track => (
                        <button
                          key={track.id}
                          onClick={() => { setCurrentMusic(track); setShowMusicMenu(false); }}
                          className={`text-left px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-2 ${currentMusic.id === track.id ? 'bg-rose-100 text-rose-800 font-bold' : 'hover:bg-rose-50 text-gray-700'}`}
                        >
                          <track.icon size={14} />
                          {track.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative">
                <button onClick={() => {
                  setShowTextColorMenu(!showTextColorMenu);
                  setShowMusicMenu(false);
                  setShowTextSizeMenu(false);
                  setShowPalette(false);
                }} className={`p-1.5 sm:p-2 rounded-xl ${textColor !== 'default' ? 'text-rose-600' : 'text-emerald-800'} hover:bg-emerald-50 transition-all text-xs flex flex-col items-center min-w-[50px] sm:min-w-[60px]`}>
                  <Palette size={18} className="mb-0.5 sm:mb-1" />
                  <span>Màu chữ</span>
                </button>
                <AnimatePresence>
                  {showTextColorMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-28 bg-white rounded-xl shadow-xl p-2 flex flex-col gap-1 z-30 border border-emerald-100 max-h-48 overflow-y-auto"
                    >
                      {textColors.map(color => (
                        <button
                          key={color.id}
                          onClick={() => { setTextColor(color.id); setShowTextColorMenu(false); }}
                          className={`text-left px-2 py-1.5 text-xs rounded-lg transition-colors ${textColor === color.id ? 'bg-rose-100 text-rose-800 font-bold' : 'hover:bg-rose-50 text-gray-700'}`}
                        >
                          {color.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative">
                <button onClick={() => {
                  setShowTextSizeMenu(!showTextSizeMenu);
                  setShowMusicMenu(false);
                  setShowTextColorMenu(false);
                  setShowPalette(false);
                }} className={`p-1.5 sm:p-2 rounded-xl ${textSize !== 1 ? 'text-rose-600' : 'text-emerald-800'} hover:bg-emerald-50 transition-all text-xs flex flex-col items-center min-w-[50px] sm:min-w-[60px]`}>
                  <div className="flex items-center justify-center mb-0.5 sm:mb-1 h-[18px]">
                    <span className="font-bold text-lg leading-none">A</span>
                    <span className="font-bold text-xs leading-none">A</span>
                  </div>
                  <span>Cỡ chữ</span>
                </button>
                <AnimatePresence>
                  {showTextSizeMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-xl p-2 flex items-center gap-1 z-30 border border-emerald-100"
                    >
                      <button
                        onClick={() => setTextSize(Math.max(0.5, +(textSize - 0.1).toFixed(1)))}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="flex items-center justify-center w-10 text-sm font-medium">{Math.round(textSize * 100)}%</span>
                      <button
                        onClick={() => setTextSize(Math.min(2.5, +(textSize + 0.1).toFixed(1)))}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button onClick={() => {
                setShowPalette(!showPalette);
                setShowMusicMenu(false);
                setShowTextColorMenu(false);
                setShowTextSizeMenu(false);
              }} className={`p-1.5 sm:p-2 rounded-xl ${showPalette ? 'bg-emerald-100 text-emerald-900' : 'text-emerald-800 hover:bg-emerald-50'} transition-all text-xs flex flex-col items-center min-w-[50px] sm:min-w-[60px]`}>
                <Flower size={18} className="mb-0.5 sm:mb-1" />
                <span>Decor</span>
              </button>
              <button onClick={() => setIsEditing(!isEditing)} className={`p-1.5 sm:p-2 rounded-xl transition-all text-xs flex flex-col items-center min-w-[50px] sm:min-w-[60px] ${isEditing ? "bg-rose-100 text-rose-700" : "text-emerald-800 hover:bg-emerald-50"}`}>
                {isEditing ? <Check size={18} className="mb-0.5 sm:mb-1" /> : <PenTool size={18} className="mb-0.5 sm:mb-1" />}
                <span>{isEditing ? "Lưu lại" : "Chỉnh sửa"}</span>
              </button>
              <button onClick={generateVideo} className="p-1.5 sm:p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-all text-xs flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
                <Video size={18} className="mb-0.5 sm:mb-1" />
                <span>Tạo Video</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => {
            setShowSettingsMenu(!showSettingsMenu);
            if (showSettingsMenu) {
              setShowPalette(false);
              setShowMusicMenu(false);
              setShowTextColorMenu(false);
              setShowTextSizeMenu(false);
            }
          }} 
          className="bg-white/95 p-2 sm:p-3 rounded-full shadow-lg text-rose-600 hover:bg-white transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Settings size={20} className={showSettingsMenu ? "rotate-90 transition-transform duration-300" : "transition-transform duration-300"} />
          <span className="text-xs sm:text-sm pr-1">Tùy chỉnh</span>
        </button>
      </div>

      {/* Decor Palette */}
      <AnimatePresence>
        {showPalette && showSettingsMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="keep-open fixed bottom-32 left-2 sm:left-4 z-20 bg-white/95 p-2 sm:p-3 rounded-2xl shadow-xl flex flex-col gap-1 sm:gap-2 border border-emerald-100"
          >
            <div className="flex items-center gap-2 mb-1 p-1 border-b border-gray-100">
              <span className="text-xs text-gray-600 font-medium">Màu sắc:</span>
              <input type="color" value={decorColor} onChange={e => setDecorColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 p-0" />
            </div>
            <div className="flex flex-wrap max-w-[200px] sm:max-w-xs gap-1 sm:gap-2">
              {(Object.keys(decorRegistry) as DecorType[]).map(type => {
                const decor = decorRegistry[type];
                return (
                  <button key={type} onClick={() => addDecor(type)} className="hover:scale-110 transition-transform p-1">
                    {decor.type === 'icon' ? (
                      <div style={{ color: decorColor, animation: 'none' }}><decor.content size={20} /></div>
                    ) : (
                      <img src={decor.content as string} alt={type} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={clearAllDecor} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded-lg w-full font-medium transition-colors mt-1">Clear All</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Right Control Panel */}
      <div className="fixed bottom-4 right-2 sm:right-4 z-20 flex items-center gap-1 sm:gap-2">
        <button onClick={addHeart} className="bg-white/90 text-rose-800 p-1.5 sm:p-2 px-2 sm:px-3 rounded-full shadow-md transition-all hover:bg-white flex items-center gap-1">
          <Heart size={18} />
          <span className="font-bold text-xs">{totalHeartsCount}</span>
        </button>
        <button onClick={resetHearts} className="bg-white/90 text-rose-800 p-1.5 sm:p-2 rounded-full shadow-md transition-all hover:bg-white">
          <RotateCcw size={18} />
        </button>
        <button onClick={cycleScene} className="bg-white/90 text-emerald-800 p-1.5 sm:p-2 px-2 sm:px-3 rounded-full shadow-md hover:bg-white transition-all flex items-center gap-1">
          <Leaf size={18} />
          <span className="font-medium text-xs sm:text-sm">Change</span>
        </button>
      </div>

      <AnimatePresence>
        {hearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute text-rose-500`}
            style={{ 
              left: `calc(50% + ${heart.x}px)`, 
              top: `calc(50% + ${heart.y}px)` 
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
            >
              <Heart size={32} fill="currentColor" />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Video Generation Modal */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden border border-rose-100 flex flex-col items-center text-center"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Film className="text-rose-500 animate-pulse" size={24} />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Trình tạo Video AI</h3>
              </div>

              {isVideoGenerating ? (
                <div className="py-8 flex flex-col items-center justify-center w-full">
                  <div className="relative w-20 h-20 mb-6">
                    <Loader2 className="w-20 h-20 text-rose-500 animate-spin absolute" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="w-8 h-8 text-rose-400 animate-bounce" />
                    </div>
                  </div>

                  {/* Step status */}
                  <div className="space-y-3 w-full max-w-xs text-left">
                    {[
                      "Phân tích bố cục & vật trang trí",
                      "Sáng tác nhạc nền AI (10s - 20s)",
                      "Biên dịch hiệu ứng chuyển động",
                      "Kết xuất video HD Agnes AI"
                    ].map((stepText, idx) => {
                      const isDone = idx < videoGenerationStep;
                      const isCurrent = idx === videoGenerationStep;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone ? 'bg-emerald-500 text-white' :
                            isCurrent ? 'bg-rose-500 text-white animate-pulse' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <span className={`text-sm font-medium ${
                            isDone ? 'text-emerald-600 line-through' :
                            isCurrent ? 'text-gray-900 font-semibold' :
                            'text-gray-400'
                          }`}>
                            {stepText}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-8 text-xs text-gray-400 animate-pulse">
                    Vui lòng đợi trong giây lát, quá trình tạo video có thể mất từ 10 - 20 giây...
                  </p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  {videoGenResult && videoGenResult.success ? (
                    <div className="w-full flex flex-col items-center">
                      <div id="generated-card-container" className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner border border-gray-100 mb-4 relative flex items-center justify-center">
                        {generatedVideoUrl && (
                          generatedVideoUrl.endsWith('.png') ||
                          generatedVideoUrl.endsWith('.jpg') ||
                          generatedVideoUrl.endsWith('.jpeg') ||
                          generatedVideoUrl.endsWith('.webp') ||
                          generatedVideoUrl.endsWith('.gif') ||
                          generatedVideoUrl.includes('image')
                        ) ? (
                          <div className="w-full h-full overflow-hidden absolute inset-0">
                            <img
                              src={generatedVideoUrl}
                              crossOrigin="anonymous"
                              alt="AI generated greeting card"
                              className="w-full h-full object-contain animate-kenburns"
                            />
                          </div>
                        ) : (
                          <video
                            src={generatedVideoUrl || ""}
                            crossOrigin="anonymous"
                            controls
                            autoPlay
                            loop
                            className="w-full h-full object-contain absolute inset-0"
                          />
                        )}

                        {/* HIGH QUALITY OVERLAY FOR TEXT AND DECOR */}
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 z-10 overflow-hidden select-none">
                          <div className="text-center w-full max-w-full scale-75 sm:scale-90 transition-transform origin-center">
                            <h1 className={`text-2xl sm:text-3xl font-bold ${fontRegistry[fontStyle].class} ${config.text} mb-2 drop-shadow-[0_2px_4px_rgba(255,255,255,0.85)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] leading-tight`}>
                              {renderSpannedText(title)}
                            </h1>
                            <p className={`text-base sm:text-lg font-medium ${fontRegistry[fontStyle].class} ${config.secondary} drop-shadow-[0_1.5px_3px_rgba(255,255,255,0.85)] dark:drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.85)] leading-relaxed`}>
                              {renderSpannedText(message)}
                            </p>
                          </div>
                        </div>

                        {/* Overlay Placed Items */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
                          {placedItems.map(item => {
                            const decor = decorRegistry[item.type];
                            if (!decor) return null;

                            const currentAnimate = item.animation === 'float' ? { y: [0, -10, 0], x: [0, 5, -5, 0] } :
                                                  item.animation === 'pulse' ? { scale: [1, 1.2, 1], opacity: [1, 0.6, 1] } :
                                                  item.animation === 'spin' ? { rotate: [0, 360] } :
                                                  {};
                            const currentTransition = item.animation === 'float' ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } :
                                                     item.animation === 'pulse' ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } :
                                                     item.animation === 'spin' ? { duration: 4, repeat: Infinity, ease: 'linear' } :
                                                     {};

                            // Scale down coordinate mapping for the preview box (relative coordinates starting from the center)
                            const scaleFactor = 0.35; 
                            const displayX = item.x * scaleFactor;
                            const displayY = item.y * scaleFactor;

                            return (
                              <motion.div
                                key={`preview-${item.id}`}
                                initial={{ x: displayX, y: displayY, scale: item.scale * 0.45, rotate: item.rotation }}
                                animate={{ x: displayX, y: displayY, scale: item.scale * 0.45, rotate: item.rotation }}
                                className="absolute"
                                style={{
                                  left: '50%',
                                  top: '50%',
                                }}
                              >
                                {decor.type === 'icon' ? (
                                  <motion.div 
                                    className={item.color ? "" : config.accent} 
                                    style={item.color ? { color: item.color } : {}}
                                    animate={currentAnimate}
                                    transition={currentTransition}
                                  >
                                    <decor.content size={24} />
                                  </motion.div>
                                ) : (
                                  <motion.div 
                                    animate={currentAnimate}
                                    transition={currentTransition}
                                    className="bg-white/95 p-1 rounded-lg shadow-md border border-white flex items-center justify-center"
                                  >
                                    <img 
                                      src={decor.content as string} 
                                      alt={item.type} 
                                      className="w-10 h-10 object-contain" 
                                      draggable={false} 
                                    />
                                  </motion.div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mode details */}
                      {videoGenResult.simulation ? (
                        <div className="w-full mb-6">
                          {videoGenResult.apiKeyConfigured ? (
                            <div className="bg-rose-50 border border-rose-200 text-rose-950 rounded-2xl p-4 text-xs text-left flex items-start gap-3">
                              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                              <div className="flex-1">
                                <p className="font-bold text-rose-800 mb-1">Đã nhận mã API nhưng kết nối đến Agnes AI thất bại</p>
                                <p className="text-rose-700 leading-relaxed mb-2">
                                  Hệ thống đã nhận diện được mã API <b>AGNES_API_KEY</b> của bạn trong phần Cài đặt (Secrets), nhưng các cuộc gọi thử tới server của Agnes AI đã gặp sự cố.
                                </p>
                                {videoGenResult.warning && (
                                  <div className="bg-white/80 p-2.5 rounded-lg border border-rose-100 font-mono text-[11px] text-rose-900 break-words leading-normal max-h-32 overflow-y-auto mb-2">
                                    <strong className="text-rose-950 font-semibold">Chi tiết lỗi: </strong>
                                    {videoGenResult.warning}
                                  </div>
                                )}
                                <p className="text-[11px] text-rose-600 font-medium">
                                  👉 <b>Hướng xử lý:</b> Hãy kiểm tra lại tính chính xác của mã khóa API của bạn trong menu Cài đặt (Secrets) ở góc trên bên phải. Đồng thời, đảm bảo tài khoản Agnes AI của bạn đang hoạt động bình thường và còn đủ lượt gọi.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl p-4 text-xs text-left flex items-start gap-3">
                              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-semibold mb-1">Chế độ Xem trước (Chưa có API Key)</p>
                                <p className="text-amber-800 leading-relaxed mb-2">
                                  Tính năng xuất video đã sẵn sàng! Để kết xuất video thật, hãy điền mã API của bạn với tên <b>AGNES_API_KEY</b> (và cấu hình thêm <b>AGNES_API_BASE</b> nếu cần) trong menu Cài đặt (Secrets) ở góc trên bên phải.
                                </p>
                                <div className="bg-white/60 p-2 rounded-lg font-mono text-[10px] text-amber-900 space-y-1">
                                  <div>• Tiêu đề: {videoGenResult.details?.title}</div>
                                  <div>• Lời chúc: {videoGenResult.details?.message}</div>
                                  <div>• Nhạc nền: {videoGenResult.details?.music}</div>
                                  <div>• Decor: {videoGenResult.details?.decorCount} vật dụng</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl p-4 text-xs text-left mb-6 flex items-start gap-3">
                          <Check size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-emerald-800 mb-1">Đã kết xuất thành công qua Agnes AI!</p>
                            <p className="text-emerald-700">Video của bạn đã được lưu và sẵn sàng tải về.</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                          onClick={() => setIsVideoModalOpen(false)}
                          className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm"
                        >
                          Đóng
                        </button>

                        {generatedVideoUrl && (
                          <button
                            onClick={downloadCompleteCardImage}
                            disabled={isExportingImage}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl font-medium transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 disabled:opacity-75"
                          >
                            {isExportingImage ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Đang chuẩn bị...
                              </>
                            ) : (
                              <>
                                <Sparkles size={16} />
                                Tải Thiệp Có Chữ
                              </>
                            )}
                          </button>
                        )}

                        {generatedVideoUrl && (
                          <a
                            href={generatedVideoUrl}
                            download={
                              (generatedVideoUrl.endsWith('.png') ||
                              generatedVideoUrl.endsWith('.jpg') ||
                              generatedVideoUrl.endsWith('.jpeg') ||
                              generatedVideoUrl.endsWith('.webp') ||
                              generatedVideoUrl.endsWith('.gif') ||
                              generatedVideoUrl.includes('image'))
                                ? "greeting-card-raw.png"
                                : "greeting-card-raw.mp4"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-slate-800/10"
                          >
                            <Download size={16} />
                            Tải File Gốc AI
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                        <AlertCircle size={24} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">Không thể kết nối dịch vụ tạo video</p>
                      <p className="text-xs text-gray-500 max-w-xs mb-6">
                        {videoGenResult?.error || "Đã xảy ra lỗi không xác định khi yêu cầu kết xuất video."}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsVideoModalOpen(false)}
                          className="py-2.5 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={generateVideo}
                          className="py-2.5 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium text-sm transition-colors"
                        >
                          Thử lại
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
