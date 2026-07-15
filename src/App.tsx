import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Sparkles, 
  Music, 
  Volume2, 
  VolumeX, 
  Upload, 
  Lock, 
  Unlock, 
  Settings, 
  Mail, 
  BookOpen, 
  Search, 
  Shuffle, 
  ChevronLeft, 
  ChevronRight, 
  Moon, 
  Sun, 
  Play, 
  Pause, 
  Clock, 
  Compass, 
  Gift, 
  Star, 
  User, 
  Save, 
  RotateCcw, 
  Check, 
  Maximize2,
  Flower
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- IndexedDB utility for saving song data (bypasses localStorage size limits) ---
const DB_NAME = 'AnoushaMusicDB';
const STORE_NAME = 'musicStore';

function saveSongToDB(url: string, name: string, startTime: number, blob?: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put({ url, name, startTime, blob }, 'current_song');
      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => {
        reject(transaction.error || new Error('Failed to save to database.'));
      };
    };
    request.onerror = () => {
      reject(request.error || new Error('Failed to open database.'));
    };
  });
}

function getSongFromDB(): Promise<{ url: string; name: string; startTime: number; blob?: Blob } | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get('current_song');
      getReq.onsuccess = () => {
        resolve(getReq.result || null);
      };
      getReq.onerror = () => {
        resolve(null);
      };
    };
    request.onerror = () => {
      resolve(null);
    };
  });
}

// --- Particle Background Canvas ---
export function LoveCanvas({ mode }: { mode: 'light' | 'dark' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    class Particle {
      type: 'heart' | 'sparkle' | 'firefly' | 'petal' | 'butterfly';
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      angle: number;
      spin: number;
      color: string;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height + height;
        this.size = Math.random() * 5 + 3; // slightly larger for visibility
        this.speedY = -(Math.random() * 0.7 + 0.3);
        this.speedX = Math.random() * 0.6 - 0.3;
        this.opacity = Math.random() * 0.7 + 0.3;
        this.angle = Math.random() * 360;
        this.spin = Math.random() * 1.5 - 0.75;
        
        const rand = Math.random();
        if (rand < 0.20) {
          this.type = 'heart';
          // Baby Pink (#F8BBD9)
          this.color = `rgba(248, 187, 217, ${this.opacity})`;
        } else if (rand < 0.40) {
          this.type = 'sparkle';
          // Soft Gold Accent (#F7D774)
          this.color = `rgba(247, 215, 116, ${this.opacity})`;
          this.y = Math.random() * height;
        } else if (rand < 0.60) {
          this.type = 'firefly';
          // Lavender (#E6E6FA)
          this.color = `rgba(230, 230, 250, ${this.opacity})`;
          this.y = Math.random() * height;
          this.speedY = (Math.random() * 0.4 - 0.2);
        } else if (rand < 0.80) {
          this.type = 'petal';
          // Rose Pink (#FFB6C1)
          this.color = `rgba(255, 182, 193, ${this.opacity})`;
          this.y = Math.random() * -100;
          this.speedY = Math.random() * 0.8 + 0.5;
        } else {
          this.type = 'butterfly';
          // Blush Pink (#FADADD)
          this.color = `rgba(250, 218, 221, ${this.opacity})`;
          this.y = Math.random() * height;
          this.speedY = -(Math.random() * 0.5 + 0.2);
        }
      }
      
      update() {
        this.angle += this.spin;
        
        if (this.type === 'petal') {
          this.y += this.speedY;
          this.x += this.speedX + Math.sin(this.angle * Math.PI / 180) * 0.4;
          if (this.y > height) {
            this.y = -20;
            this.x = Math.random() * width;
          }
        } else {
          this.y += this.speedY;
          this.x += this.speedX + Math.sin(this.angle * Math.PI / 180) * 0.15;
          if (this.y < -50 || this.x < -50 || this.x > width + 50) {
            this.y = height + 20;
            this.x = Math.random() * width;
          }
        }
        
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const force = (130 - dist) / 130;
          this.x += (dx / dist) * force * 2.5;
          this.y += (dy / dist) * force * 2.5;
        }
      }
      
      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);
        
        if (this.type === 'heart') {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-this.size / 2, -this.size / 2, -this.size, 0, 0, this.size);
          ctx.bezierCurveTo(this.size, 0, this.size / 2, -this.size / 2, 0, 0);
          ctx.fill();
        } else if (this.type === 'sparkle') {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            ctx.lineTo(0, -this.size * 1.3);
            ctx.rotate(Math.PI / 2);
          }
          ctx.fill();
        } else if (this.type === 'firefly') {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(0, 0, this.size / 1.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.type === 'petal') {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size * 1.1, this.size * 0.5, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.type === 'butterfly') {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          // Upper left wing
          ctx.ellipse(-this.size * 0.5, -this.size * 0.4, this.size * 0.6, this.size * 0.8, Math.PI / 6, 0, Math.PI * 2);
          // Upper right wing
          ctx.ellipse(this.size * 0.5, -this.size * 0.4, this.size * 0.6, this.size * 0.8, -Math.PI / 6, 0, Math.PI * 2);
          // Lower left wing
          ctx.ellipse(-this.size * 0.4, this.size * 0.3, this.size * 0.4, this.size * 0.5, -Math.PI / 6, 0, Math.PI * 2);
          // Lower right wing
          ctx.ellipse(this.size * 0.4, this.size * 0.3, this.size * 0.4, this.size * 0.5, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          
          // Little body
          ctx.fillStyle = 'rgba(255, 182, 193, 0.9)'; // Rose Pink body
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size * 0.12, this.size * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }
    }
    
    const particles: Particle[] = Array.from({ length: 85 }, () => new Particle());
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode]);
  
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" id="romantic-particles" />;
}

// --- 100 Reasons Why I Love Anousha Dataset ---
interface Reason {
  id: number;
  text: string;
  category: 'soul' | 'magic' | 'romance' | 'devotion' | 'cherish';
}

const REASONS: Reason[] = [
  { id: 1, text: "Your sweet laugh is my absolute favorite sound in the world.", category: "magic" },
  { id: 2, text: "The way your eyes shine when you are happy.", category: "soul" },
  { id: 3, text: "How you make even the most normal, quiet moments feel like a fun adventure.", category: "magic" },
  { id: 4, text: "Your soft, gentle voice that always makes me feel so calm.", category: "soul" },
  { id: 5, text: "Your beautiful smile that instantly makes all my worries go away.", category: "romance" },
  { id: 6, text: "The way you hold my hand so softly and make me feel so safe.", category: "cherish" },
  { id: 7, text: "Your beautiful eyes that look like they are filled with tiny stars.", category: "romance" },
  { id: 8, text: "The cute little sweet messages you send me when I least expect them.", category: "romance" },
  { id: 9, text: "Your wonderful mind and the beautiful conversations we share.", category: "soul" },
  { id: 10, text: "How you make me want to be a better and kinder person every day.", category: "devotion" },
  { id: 11, text: "How much kindness and love you have in your heart.", category: "soul" },
  { id: 12, text: "How you understand my quiet times better than anyone else.", category: "soul" },
  { id: 13, text: "Your cute, adorable pout when you tease me.", category: "romance" },
  { id: 14, text: "The soft, graceful way you move and do everything.", category: "cherish" },
  { id: 15, text: "Your warm, cozy hugs that always feel like coming home.", category: "soul" },
  { id: 16, text: "The adorable way you talk about things you love with so much excitement.", category: "magic" },
  { id: 17, text: "Your playful, cute side that always makes me smile and feel happy.", category: "magic" },
  { id: 18, text: "The beautiful future you talk about and how you want me in it.", category: "devotion" },
  { id: 19, text: "Your sweet patience with me and how gently you guide my heart.", category: "devotion" },
  { id: 20, text: "How your sweet scent stays in my mind and makes me smile when we are apart.", category: "cherish" },
  { id: 21, text: "How you remember the tiny things I said weeks ago.", category: "cherish" },
  { id: 22, text: "How incredibly beautiful you look under the soft moonlight.", category: "romance" },
  { id: 23, text: "How your love has brought so much peace and healing to my heart.", category: "soul" },
  { id: 24, text: "Your cute, sleepy morning voice that sounds like a little angel.", category: "cherish" },
  { id: 25, text: "How perfectly your hand fits inside mine, like it was made just for me.", category: "cherish" },
  { id: 26, text: "The way you try to hide your blush when I tell you how pretty you are.", category: "romance" },
  { id: 27, text: "How you always find happiness in the simplest of days.", category: "magic" },
  { id: 28, text: "How loyal you are, and how much you care about our bond.", category: "devotion" },
  { id: 29, text: "How you listen to me with your whole heart, making me feel so understood.", category: "soul" },
  { id: 30, text: "Your cute, stubborn way of standing up for what you believe in.", category: "magic" },
  { id: 31, text: "How you can make my worst days feel peaceful with just a single word.", category: "magic" },
  { id: 32, text: "The elegant way you hold yourself and how beautiful you always look.", category: "romance" },
  { id: 33, text: "The cute way you play with your hair when you are thinking deeply.", category: "cherish" },
  { id: 34, text: "The sweet way you look at me when you think I am not watching.", category: "romance" },
  { id: 35, text: "Your love for cozy movie nights, sweet stories, and romantic times.", category: "romance" },
  { id: 36, text: "How our love makes any romantic movie look simple.", category: "romance" },
  { id: 37, text: "Your amazing style—you look absolutely beautiful in everything you wear.", category: "cherish" },
  { id: 38, text: "The sweet, loving way you check on me to make sure I am okay.", category: "devotion" },
  { id: 39, text: "How safe and free I feel to be my true self when I am with you.", category: "soul" },
  { id: 40, text: "The cute little gasp you make when you are happy or surprised.", category: "magic" },
  { id: 41, text: "How completely honest and pure your heart is.", category: "soul" },
  { id: 42, text: "The lovely and happy energy you bring to every place we go.", category: "magic" },
  { id: 43, text: "How your soft touch instantly makes my heart beat faster.", category: "romance" },
  { id: 44, text: "How perfectly our humor matches, making us laugh together forever.", category: "magic" },
  { id: 45, text: "How pretty your shadow looks against the warm sunset.", category: "romance" },
  { id: 46, text: "Your gentle advice that always helps me find the right path.", category: "devotion" },
  { id: 47, text: "How you make me look forward to every new day, knowing you will be in it.", category: "devotion" },
  { id: 48, text: "The cute way you eat your favorite food, looking so happy and satisfied.", category: "cherish" },
  { id: 49, text: "Your soft lips that I dream of kissing forever.", category: "romance" },
  { id: 50, text: "How you always encourage us to grow and reach for the stars together.", category: "devotion" },
  { id: 51, text: "The sweet and gentle way you say my name—it is my favorite music.", category: "cherish" },
  { id: 52, text: "How a single warm hug from you makes the whole cold world disappear.", category: "soul" },
  { id: 53, text: "How your voice saying 'I love you' can make time stand still.", category: "romance" },
  { id: 54, text: "Your cute, sweet jealousy when you want all of my attention.", category: "romance" },
  { id: 55, text: "How you are my biggest love and my best friend at the same time.", category: "soul" },
  { id: 56, text: "Your beautiful laugh lines that show all the joy you have inside.", category: "cherish" },
  { id: 57, text: "How strong and brave you are, even during hard times.", category: "devotion" },
  { id: 58, text: "The lovely warmth of your skin when we cuddle close.", category: "cherish" },
  { id: 59, text: "How you support my dreams and cheer for me louder than anyone else.", category: "devotion" },
  { id: 60, text: "The sweet way we often think of the exact same thing at the exact same time.", category: "soul" },
  { id: 61, text: "The elegant grace of your posture and how beautiful you always are.", category: "romance" },
  { id: 62, text: "The cozy way you cuddle and rest your head on my chest.", category: "cherish" },
  { id: 63, text: "How you make me feel like the luckiest person in the world.", category: "magic" },
  { id: 64, text: "The deep and beautiful thoughts you share about life.", category: "soul" },
  { id: 65, text: "Your cute, sweet giggles when I whisper silly things to you.", category: "magic" },
  { id: 66, text: "The way you look into my eyes, making my heart skip a beat.", category: "romance" },
  { id: 67, text: "The complete peace and safety I feel because you trust me.", category: "devotion" },
  { id: 68, text: "How you are always just yourself, and I love that so much.", category: "soul" },
  { id: 69, text: "Your cute handwriting and the sweet little drawings you make.", category: "cherish" },
  { id: 70, text: "Your love for starry night walks and quiet, cozy spots.", category: "magic" },
  { id: 71, text: "The gentle, loving look in your eyes when we have to say goodbye.", category: "romance" },
  { id: 72, text: "How perfectly you understand my feelings and care for them.", category: "soul" },
  { id: 73, text: "How you inspire me to write sweet letters and poems just for you.", category: "devotion" },
  { id: 74, text: "Your cute habit of humming little songs when you are relaxed.", category: "cherish" },
  { id: 75, text: "The bright, happy light you bring to everyone around you.", category: "magic" },
  { id: 76, text: "Your soft, pretty hands and how gently they touch my face.", category: "romance" },
  { id: 77, text: "The cute faces you make when you are concentrating on something.", category: "cherish" },
  { id: 78, text: "How you make all our memories feel like a beautiful fairy tale.", category: "magic" },
  { id: 79, text: "How you always think of other people first to make them feel comfortable.", category: "soul" },
  { id: 80, text: "The sweet way you look at me in a crowded room, like we are the only two.", category: "romance" },
  { id: 81, text: "How you always notice right away when I am feeling quiet or sad.", category: "devotion" },
  { id: 82, text: "Your sweet excitement to learn and explore new things with me.", category: "magic" },
  { id: 83, text: "The cute way you sneeze, sounding like a tiny, sweet kitten.", category: "cherish" },
  { id: 84, text: "How your love has taught me what peace and home really feel like.", category: "soul" },
  { id: 85, text: "How effortlessly elegant and pretty you look every single day.", category: "romance" },
  { id: 86, text: "The absolute comfort I feel when I lay down next to you.", category: "soul" },
  { id: 87, text: "How stunning you look when you dress up for our special dates.", category: "romance" },
  { id: 88, text: "How you remember my favorite things, from sweet treats to little details.", category: "cherish" },
  { id: 89, text: "Your loyal heart that always stands by me and brightens my life.", category: "devotion" },
  { id: 90, text: "How you love to stay cozy with me on warm, rainy afternoons.", category: "magic" },
  { id: 91, text: "The gorgeous way you smile when you are genuinely happy.", category: "romance" },
  { id: 92, text: "Your soft, warm breath against my shoulder when I hold you tight.", category: "romance" },
  { id: 93, text: "How you keep our love exciting with small, sweet surprises.", category: "magic" },
  { id: 94, text: "The way you celebrate my tiny wins as if they were giant achievements.", category: "devotion" },
  { id: 95, text: "Your cute habit of wearing big, cozy sweaters that look so adorable on you.", category: "cherish" },
  { id: 96, text: "Your sweet, beautiful taste that makes everything around you pretty.", category: "magic" },
  { id: 97, text: "How you look at me with so much warmth that makes me feel so loved.", category: "soul" },
  { id: 98, text: "Your soft, sweet laugh that sounds like the prettiest music to me.", category: "magic" },
  { id: 99, text: "The way you wrap your arms around my neck and hold me close.", category: "romance" },
  { id: 100, text: "Simply because you are you—my sweet, beautiful, and forever Anousha.", category: "soul" }
];

// --- Custom Full-Screen Particle Rain (Yes/Forever Ending Animation) ---
interface CelebrationParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  type: 'heart' | 'rose' | 'sparkle';
  color: string;
  rotation: number;
  rotationSpeed: number;
}

const MOON_MESSAGES = [
  "🌙\nI looked at the moon tonight and it made me think of you. You make my world so beautiful.",
  "🌙\nEven the brightest moon cannot match how sweet your smile is.",
  "🌙\nEvery night feels so much warmer knowing we are both looking at the same beautiful sky.",
  "🌙\nIf I could make one wish tonight, it would be to spend every single moment next to you.",
  "🌙\nYou have this soft, lovely way of pulling my heart closer to yours every day.",
  "🌙\nYou are my light on the quietest nights, and I am so grateful to have you.",
  "🌙\nNo matter how far apart we are, sharing this same moonlight makes me feel so close to you.",
  "🌙\nThe moon changes its shape, but my love for you will always stay full and warm."
];

const STAR_WISHES = [
  "You are my favorite part of every day.",
  "My heart always feels so happy when I think of you.",
  "You make normal, simple days feel so special.",
  "Home isn't a place for me anymore... it's you.",
  "You always bring so much peace and warmth to my life.",
  "Every wish I make is just to see you happy.",
  "My happiest place in the world is right by your side.",
  "You are the reason my sky feels so bright and beautiful.",
  "While stars shine in the night sky, you shine inside my heart.",
  "Every little memory with you is a treasure I keep forever."
];

const INTERACTIVE_STARS_DATA = [
  { id: 0, top: '15%', left: '15%', delay: 0.1 },
  { id: 1, top: '25%', left: '80%', delay: 0.4 },
  { id: 2, top: '42%', left: '12%', delay: 0.7 },
  { id: 3, top: '14%', left: '52%', delay: 0.2 },
  { id: 4, top: '70%', left: '18%', delay: 0.9 },
  { id: 5, top: '65%', left: '82%', delay: 0.5 },
  { id: 6, top: '38%', left: '88%', delay: 1.1 },
  { id: 7, top: '80%', left: '50%', delay: 0.3 },
  { id: 8, top: '52%', left: '76%', delay: 0.8 },
  { id: 9, top: '55%', left: '24%', delay: 0.6 },
];

export default function App() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [themeMode] = useState<'light' | 'dark'>('light');
  const [proposalAccepted, setProposalAccepted] = useState<boolean>(false);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState<boolean>(false);
  
  // --- Music Player State ---
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [musicUrl, setMusicUrl] = useState<string>(() => {
    return localStorage.getItem('anousha_saved_song') || 'https://www.mfiles.co.uk/mp3-downloads/chopin-nocturne-op9-no2.mp3';
  });
  const [songName, setSongName] = useState<string>(() => {
    return localStorage.getItem('anousha_saved_song_name') || 'Roohposh';
  });
  const [startTime, setStartTime] = useState<number>(() => {
    const saved = localStorage.getItem('anousha_saved_song_start_time');
    return saved ? parseFloat(saved) : 62; // Default to 62s (1 min 2s)
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isMusicSaved, setIsMusicSaved] = useState<boolean>(() => {
    return localStorage.getItem('anousha_music_locked') === 'true';
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasSetInitialTime = useRef<boolean>(false);

  // --- Reasons View State ---
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reasonsPage, setReasonsPage] = useState<number>(1);
  const [shuffleCardIndex, setShuffleCardIndex] = useState<number | null>(null);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  
  // --- Hero Count-up Timer state ---
  const [elapsed, setElapsed] = useState({
    years: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // --- Cursor glow spot ref ---
  const glowRef = useRef<HTMLDivElement>(null);

  // --- Interactive Moon & Star Wishes Section State ---
  const [starClicks, setStarClicks] = useState<Record<number, number>>({});
  const [activeStarId, setActiveStarId] = useState<number | null>(null);
  const [starMessage, setStarMessage] = useState<string | null>(null);

  const [moonClickCount, setMoonClickCount] = useState<number>(0);
  const [moonMessage, setMoonMessage] = useState<string | null>(null);
  const [showMoonMessage, setShowMoonMessage] = useState<boolean>(false);

  const [shootingStar, setShootingStar] = useState<{ top: string; left: string } | null>(null);

  useEffect(() => {
    const triggerShootingStar = () => {
      const randomTop = Math.floor(Math.random() * 25) + 5; // 5% to 30%
      const randomLeft = Math.floor(Math.random() * 40) + 10; // 10% to 50%
      setShootingStar({ top: `${randomTop}%`, left: `${randomLeft}%` });
      setTimeout(() => setShootingStar(null), 2500);
    };
    const interval = setInterval(triggerShootingStar, 18000);
    return () => clearInterval(interval);
  }, []);

  const backgroundStars = React.useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 90 + 5}%`,
      left: `${Math.random() * 94 + 3}%`,
      size: Math.random() * 1.8 + 1, // 1px to 2.8px
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 3 // 3s to 7s
    }));
  }, []);

  const fireflies = React.useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 80 + 10}%`,
      left: `${Math.random() * 80 + 10}%`,
      size: Math.random() * 3 + 2,
      duration: Math.random() * 10 + 12, // 12s to 22s
      animX: [0, Math.random() * 60 - 30, Math.random() * 60 - 30, 0],
      animY: [0, Math.random() * 60 - 30, Math.random() * 60 - 30, 0]
    }));
  }, []);

  const handleStarClick = (starId: number) => {
    const currentClickCount = starClicks[starId] || 0;
    const msgIndex = (starId + currentClickCount) % STAR_WISHES.length;
    const message = STAR_WISHES[msgIndex];
    
    setStarClicks(prev => ({
      ...prev,
      [starId]: currentClickCount + 1
    }));
    
    setActiveStarId(starId);
    setStarMessage(message);
  };

  const handleMoonClick = () => {
    const currentMsg = MOON_MESSAGES[moonClickCount % MOON_MESSAGES.length];
    setMoonMessage(currentMsg);
    setShowMoonMessage(true);
    setMoonClickCount(prev => prev + 1);
  };

  // Load saved song from IndexedDB on mount
  useEffect(() => {
    getSongFromDB().then((song) => {
      if (song) {
        if (song.blob) {
          try {
            const objUrl = URL.createObjectURL(song.blob);
            setMusicUrl(objUrl);
          } catch (err) {
            console.error("Failed to create object URL from saved blob:", err);
          }
        } else if (song.url) {
          setMusicUrl(song.url);
        }
        setSongName(song.name || 'Custom Song');
        setStartTime(song.startTime ?? 62);
      }
    }).catch(err => {
      console.error("IndexedDB load error", err);
    });
  }, []);

  // Automatically clean up/revoke old object URLs to prevent memory leaks
  useEffect(() => {
    const activeUrl = musicUrl;
    return () => {
      if (activeUrl && activeUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(activeUrl);
          console.log("Automatically revoked object URL:", activeUrl);
        } catch (e) {
          console.error("Failed to revoke object URL:", e);
        }
      }
    };
  }, [musicUrl]);

  const handleCancelSettings = () => {
    getSongFromDB().then((song) => {
      if (song) {
        if (song.blob) {
          try {
            const objUrl = URL.createObjectURL(song.blob);
            setMusicUrl(objUrl);
          } catch (err) {
            console.error("Failed to create object URL for cancel:", err);
          }
        } else if (song.url) {
          setMusicUrl(song.url);
        }
        setSongName(song.name || 'Custom Song');
        setStartTime(song.startTime ?? 62);
      } else {
        const savedUrl = localStorage.getItem('anousha_saved_song') || 'https://www.mfiles.co.uk/mp3-downloads/chopin-nocturne-op9-no2.mp3';
        const savedName = localStorage.getItem('anousha_saved_song_name') || 'Roohposh';
        const savedStart = parseFloat(localStorage.getItem('anousha_saved_song_start_time') || '62');
        if (savedUrl && savedUrl !== 'indexeddb_stored') {
          setMusicUrl(savedUrl);
          setSongName(savedName);
          setStartTime(savedStart);
        }
      }
    }).catch(() => {
      const savedUrl = localStorage.getItem('anousha_saved_song') || 'https://www.mfiles.co.uk/mp3-downloads/chopin-nocturne-op9-no2.mp3';
      const savedName = localStorage.getItem('anousha_saved_song_name') || 'Roohposh';
      const savedStart = parseFloat(localStorage.getItem('anousha_saved_song_start_time') || '62');
      if (savedUrl && savedUrl !== 'indexeddb_stored') {
        setMusicUrl(savedUrl);
        setSongName(savedName);
        setStartTime(savedStart);
      }
    }).finally(() => {
      setPendingFile(null);
      setSaveError(null);
      setShowSettings(false);
    });
  };

  // Track cursor position for subtle glow (direct DOM update to bypass React re-renders)
  useEffect(() => {
    const updateGlow = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${e.clientX - 250}px, ${e.clientY - 250}px, 0)`;
      }
    };
    window.addEventListener('mousemove', updateGlow);
    return () => window.removeEventListener('mousemove', updateGlow);
  }, []);

  // Count up timer from: July 12, 2021 10:59 PM (Sunday)
  useEffect(() => {
    const startDate = new Date('2021-07-12T22:59:00');
    
    const updateTimer = () => {
      const now = new Date();
      let diffMs = now.getTime() - startDate.getTime();
      
      const msInSec = 1000;
      const msInMin = msInSec * 60;
      const msInHr = msInMin * 60;
      const msInDay = msInHr * 24;
      const msInYear = msInDay * 365.25; // Accounting for leap years

      const years = 0;

      const days = 2;
      diffMs %= msInDay;

      const hours = Math.floor(diffMs / msInHr);
      diffMs %= msInHr;

      const minutes = Math.floor(diffMs / msInMin);
      diffMs %= msInMin;

      const seconds = Math.floor(diffMs / msInSec);

      setElapsed({ years, days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle entry and start audio
  const handleEnterSanctuary = () => {
    setHasEntered(true);
    setIsPlaying(true);
    if (audioRef.current) {
      if (!hasSetInitialTime.current) {
        audioRef.current.currentTime = startTime;
        hasSetInitialTime.current = true;
      }
      audioRef.current.play().catch(err => {
        console.log("Audio autoplay was restricted, user click will bypass:", err);
      });
    }
  };

  // Toggle Audio
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!hasSetInitialTime.current) {
        audioRef.current.currentTime = startTime;
        hasSetInitialTime.current = true;
      }
      audioRef.current.play().catch(err => console.log(err));
      setIsPlaying(true);
    }
  };



  // Reasons Filtering
  const filteredReasons = REASONS.filter(r => {
    const matchCat = activeCategory === 'all' || r.category === activeCategory;
    const matchSearch = r.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        r.id.toString() === searchQuery;
    return matchCat && matchSearch;
  });

  const reasonsPerPage = 12;
  const totalPages = Math.ceil(filteredReasons.length / reasonsPerPage);
  const paginatedReasons = filteredReasons.slice(
    (reasonsPage - 1) * reasonsPerPage,
    reasonsPage * reasonsPerPage
  );

  // Daily Reason Flip drawing
  const drawRandomReason = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    const randomIndex = Math.floor(Math.random() * REASONS.length);
    setTimeout(() => {
      setShuffleCardIndex(randomIndex);
      setIsFlipping(false);
    }, 450);
  };

  return (
    <div id="app-container" className="relative min-h-screen font-sans overflow-x-hidden transition-colors duration-700">
      
      {/* Invisible Audio Element */}
      <audio 
        ref={audioRef} 
        src={musicUrl} 
        loop 
        autoPlay={hasEntered && isPlaying}
        onPlay={() => {
          if (audioRef.current && !hasSetInitialTime.current) {
            audioRef.current.currentTime = startTime;
            hasSetInitialTime.current = true;
          }
        }}
      />

      {/* Background Cursor Glow */}
      <div 
        ref={glowRef}
        className="pointer-events-none fixed w-[500px] h-[500px] rounded-full blur-[140px] opacity-35 z-0 transition-transform duration-200 top-0 left-0"
        style={{
          transform: 'translate3d(-500px, -500px, 0)',
          background: themeMode === 'dark' 
            ? 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(139,92,246,0.1) 70%, transparent 100%)' 
            : 'radial-gradient(circle, rgba(251,207,232,0.4) 0%, rgba(254,243,199,0.15) 70%, transparent 100%)'
        }}
      />

      {/* --- AUTOPLAY ENTER OVERLAY --- */}
      <AnimatePresence>
        {!hasEntered && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ 
              background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #fff2f5 50%, #fadadd 100%)' 
            }}
          >
            {/* Ambient sparkles and flower petals behind entry gate */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(248,187,217,0.4),_transparent_50%)]" />
            <div className="absolute top-10 left-10 w-48 h-48 bg-pink-200/30 blur-3xl rounded-full animate-pulse" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-200/20 blur-3xl rounded-full animate-pulse" />
            
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="max-w-md w-full bg-white/70 border border-pink-200/80 rounded-3xl p-8 backdrop-blur-2xl text-center shadow-2xl relative overflow-hidden"
              style={{ boxShadow: '0 15px 40px rgba(248,187,217,0.4)' }}
            >
              {/* Floating gold and pink elements */}
              <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-pink-100/60 blur-xl animate-pulse" />
              <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-[#F7D774]/15 blur-xl animate-pulse" />

              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-100"
              >
                <Heart className="w-10 h-10 text-pink-500 fill-pink-300 animate-pulse" />
              </motion.div>

              <h1 className="font-display text-3xl md:text-4xl text-pink-850 font-semibold tracking-wide leading-tight mb-3">
                Sanctuary of <br/>
                <span className="text-pink-500 font-bold drop-shadow-[0_2px_4px_rgba(244,114,182,0.25)]">Anousha 💗</span>
              </h1>
              
              <p className="text-xs text-pink-600/80 font-body uppercase tracking-widest mb-6">
                A little world of love created just for you
              </p>

              <p className="text-sm text-pink-900/80 leading-relaxed mb-8">
                Welcome, my princess. I made this sweet little place just to show you how much you mean to me. Put on your headphones and enter our special world of love.
              </p>

              <button
                onClick={handleEnterSanctuary}
                id="btn-enter-sanctuary"
                className="w-full bg-gradient-to-r from-[#F8BBD9] via-[#FFB6C1] to-[#FADADD] hover:opacity-95 text-pink-900 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-pink-200/50 cursor-pointer text-sm tracking-wider uppercase flex items-center justify-center gap-2 border border-pink-200"
              >
                <Sparkles className="w-4.5 h-4.5 text-[#F7D774]" />
                Enter Our World
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN PAGE CONTENT --- */}
      {hasEntered && (
        <div 
          className="min-h-screen relative flex flex-col transition-colors duration-700"
          style={{
            background: themeMode === 'dark' 
              ? 'radial-gradient(circle at 50% 50%, #0c0209 0%, #150311 40%, #1a0415 80%, #080005 100%)' 
              : 'radial-gradient(circle at 50% 50%, #fff7f9 0%, #ffeef3 50%, #fde4ec 90%, #fae8eb 100%)'
          }}
        >
          {/* Particles element */}
          <LoveCanvas mode={themeMode} />

          {/* Sparkly Top Ambient Bloom Light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] bg-pink-500/10 blur-[120px] pointer-events-none z-0" />

          {/* --- STICKY NAVIGATION HEADER --- */}
          <header className="sticky top-0 z-40 bg-transparent backdrop-blur-md border-b transition-colors duration-500 px-6 py-4 flex items-center justify-between"
            style={{ 
              borderColor: themeMode === 'dark' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.15)' 
            }}
          >
            <div className="flex items-center gap-2.5">
              <span 
                className="font-display font-bold text-lg md:text-xl tracking-wide select-none transition-all hover:scale-105"
                style={{ 
                  color: themeMode === 'dark' ? '#fdf2f8' : '#881337',
                  textShadow: themeMode === 'dark' ? '0 0 10px rgba(244,114,182,0.3)' : 'none'
                }}
              >
                Anousha 💗
              </span>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                themeMode === 'dark' 
                  ? 'border-pink-500/20 text-pink-400 bg-pink-500/5' 
                  : 'border-pink-200 text-pink-700 bg-pink-50'
              }`}>
                Forever Yours
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Mini Audio Play Status */}
              <button
                onClick={togglePlay}
                id="btn-header-play-toggle"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                  isPlaying 
                    ? 'bg-pink-500/20 text-pink-500 border border-pink-500/40 animate-pulse' 
                    : 'bg-zinc-500/10 text-zinc-400 border border-transparent'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Now Playing: {songName}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Music Paused</span>
                  </>
                )}
              </button>

              {/* Music Settings Gear */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                id="btn-music-settings-toggle"
                className={`p-2 rounded-xl transition-all border cursor-pointer hover:scale-105 active:scale-95 ${
                  themeMode === 'dark'
                    ? 'bg-pink-950/30 border-pink-500/25 text-pink-300 hover:bg-pink-900/40'
                    : 'bg-white border-pink-200 text-pink-800 hover:bg-pink-50'
                }`}
                title="Configure Background Music"
              >
                <Settings className="w-4.5 h-4.5 animate-spin-slow text-pink-500" />
              </button>
            </div>
          </header>

          {/* --- MUSIC CONFIG MODAL/DRAWER (CapCut-style audio clip trimmer) --- */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex justify-center items-start md:items-center"
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className={`w-full max-w-xl my-4 md:my-auto p-6 rounded-3xl border shadow-2xl relative overflow-hidden transition-all ${
                    themeMode === 'dark' 
                      ? 'bg-[#1b0617]/95 border-pink-500/30 text-pink-100' 
                      : 'bg-white border-pink-200 text-pink-950'
                  }`}
                >
                  <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />
                  
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-bold text-xl flex items-center gap-2">
                      <Music className="w-5.5 h-5.5 text-pink-500" />
                      Background Music & Trimmer
                    </h3>
                    <button 
                      onClick={handleCancelSettings}
                      className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity p-1.5 cursor-pointer"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <p className="text-xs opacity-75 mb-5 leading-relaxed">
                    Set a custom soundtrack and specify exactly where the song starts. Perfect for skipping straight to the beat drop!
                  </p>

                  <div className="space-y-4">
                    {/* Song Name Input */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-80">
                        Song Title
                      </label>
                      <input 
                        type="text" 
                        value={songName}
                        onChange={(e) => {
                          setSongName(e.target.value);
                          setSaveError(null);
                        }}
                        placeholder="e.g. Roohposh"
                        className={`w-full py-2 px-3.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${
                          themeMode === 'dark' 
                            ? 'bg-pink-950/20 border-pink-500/30 text-white focus:border-pink-500 focus:ring-pink-500/30' 
                            : 'bg-pink-50/50 border-pink-200 text-pink-950 focus:border-pink-400 focus:ring-pink-300/30'
                        }`}
                      />
                    </div>

                    {/* URL Input */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-80">
                        Direct MP3 / Audio URL
                      </label>
                      <input 
                        type="text" 
                        value={musicUrl}
                        onChange={(e) => {
                          setMusicUrl(e.target.value);
                          setSaveError(null);
                        }}
                        placeholder="https://example.com/song.mp3"
                        className={`w-full py-2 px-3.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition-all ${
                          themeMode === 'dark' 
                            ? 'bg-pink-950/20 border-pink-500/30 text-white focus:border-pink-500 focus:ring-pink-500/30' 
                            : 'bg-pink-50/50 border-pink-200 text-pink-950 focus:border-pink-400 focus:ring-pink-300/30'
                        }`}
                      />
                    </div>

                    {/* Upload File */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-80">
                        Or Upload Audio File
                      </label>
                      <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all hover:bg-pink-500/5 ${
                        themeMode === 'dark' ? 'border-pink-500/20 hover:border-pink-500' : 'border-pink-200 hover:border-pink-400'
                      }`}>
                        <Upload className="w-4.5 h-4.5 text-pink-400 mb-1" />
                        <span className="text-xs opacity-80">Choose local audio file</span>
                        <input 
                          type="file" 
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Check file type ("audio/mpeg") and reject unsupported formats with a clear message
                              if (file.type !== 'audio/mpeg') {
                                setSaveError("Unsupported format. Please select an MP3 file with 'audio/mpeg' format.");
                                return;
                              }
                              setSongName(file.name.replace(/\.[^/.]+$/, ""));
                              setSaveError(null);
                              setPendingFile(file);
                              try {
                                const objUrl = URL.createObjectURL(file);
                                setMusicUrl(objUrl);
                              } catch (err) {
                                console.error("Error creating Object URL:", err);
                                setSaveError("Failed to process the selected MP3 file. Please try another file.");
                              }
                            }
                          }}
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {/* CapCut Timeline / Clip Trimmer */}
                    <div className={`p-4 rounded-2xl border ${
                      themeMode === 'dark' ? 'bg-pink-950/15 border-pink-500/10' : 'bg-pink-50/40 border-pink-100'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                          🎬 CapCut-Style Clip (Move slider to trim)
                        </span>
                        <span className="text-xs font-bold text-pink-500 px-2 py-0.5 rounded bg-pink-500/10">
                          {Math.floor(startTime / 60)}m {(startTime % 60).toString().padStart(2, '0')}s ({startTime}s)
                        </span>
                      </div>

                      {/* CapCut visual Waveform Track & Slider */}
                      <div className="relative mt-2 p-1.5 rounded-lg bg-zinc-950 border border-pink-500/25 h-16 flex flex-col justify-between">
                        
                        {/* Faux Waveform Track */}
                        <div className="h-8 flex items-end justify-between px-2 pb-1 select-none pointer-events-none opacity-55">
                          {Array.from({ length: 30 }).map((_, idx) => {
                            // Generate pseudo heights for waveform look
                            const heights = [20, 45, 60, 30, 80, 50, 40, 75, 90, 65, 30, 50, 70, 85, 40, 20, 55, 75, 60, 45, 90, 75, 30, 45, 60, 35, 70, 55, 40, 25];
                            const height = heights[idx % heights.length];
                            // Determine if this bar is selected (before or after starting position)
                            const isPast = (idx / 30) * 300 <= startTime;
                            return (
                              <div 
                                key={idx} 
                                className={`w-[2.5px] rounded-full transition-all duration-300`}
                                style={{ 
                                  height: `${height}%`,
                                  background: isPast 
                                    ? 'linear-gradient(to top, #ec4899, #f43f5e)' 
                                    : 'linear-gradient(to top, #3f3f46, #52525b)'
                                }}
                              />
                            );
                          })}
                        </div>

                        {/* Interactive Range Slider */}
                        <input 
                          type="range" 
                          min="0" 
                          max="300" 
                          value={startTime}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setStartTime(val);
                            if (audioRef.current) {
                              audioRef.current.currentTime = val;
                              hasSetInitialTime.current = true; // prevent reset
                              if (!isPlaying) {
                                audioRef.current.play().catch(e => console.log(e));
                                setIsPlaying(true);
                              }
                            }
                          }}
                          className="absolute inset-x-0 top-0 w-full h-12 opacity-0 cursor-pointer accent-pink-500 z-10"
                        />
                        
                        {/* Interactive sliding playhead overlay */}
                        <div 
                          className="absolute top-0 bottom-4 w-[2px] bg-yellow-400 pointer-events-none transition-all duration-200"
                          style={{ left: `${(startTime / 300) * 100}%` }}
                        >
                          <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 rounded-full bg-yellow-400 shadow-md shadow-yellow-500/40 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
                          </div>
                        </div>

                        {/* Timeline Markers */}
                        <div className="flex justify-between px-1.5 text-[8px] font-mono text-zinc-500 pt-1 pointer-events-none select-none border-t border-zinc-800/60">
                          <span>0:00</span>
                          <span>1:00</span>
                          <span>2:00</span>
                          <span>3:00</span>
                          <span>4:00</span>
                          <span>5:00</span>
                        </div>
                      </div>

                      {/* Control buttons & Preset start times */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (!audioRef.current) return;
                            if (isPlaying) {
                              audioRef.current.pause();
                              setIsPlaying(false);
                            } else {
                              audioRef.current.currentTime = startTime;
                              audioRef.current.play().catch(e => console.log(e));
                              setIsPlaying(true);
                            }
                          }}
                          className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isPlaying 
                              ? 'bg-pink-600 text-white' 
                              : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{isPlaying ? "Pause Preview" : "Play & Listen"}</span>
                        </button>

                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="opacity-60 mr-1">Presets:</span>
                          <button 
                            type="button"
                            onClick={() => {
                              setStartTime(0);
                              if (audioRef.current) {
                                audioRef.current.currentTime = 0;
                                if (!isPlaying) {
                                  audioRef.current.play().catch(e => console.log(e));
                                  setIsPlaying(true);
                                }
                              }
                            }}
                            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                              startTime === 0 ? 'bg-pink-500 text-white font-bold' : 'bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400'
                            }`}
                          >
                            0:00
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setStartTime(62);
                              if (audioRef.current) {
                                audioRef.current.currentTime = 62;
                                if (!isPlaying) {
                                  audioRef.current.play().catch(e => console.log(e));
                                  setIsPlaying(true);
                                }
                              }
                            }}
                            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                              startTime === 62 ? 'bg-pink-500 text-white font-bold' : 'bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400'
                            }`}
                          >
                            1:02
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setStartTime(120);
                              if (audioRef.current) {
                                audioRef.current.currentTime = 120;
                                if (!isPlaying) {
                                  audioRef.current.play().catch(e => console.log(e));
                                  setIsPlaying(true);
                                }
                              }
                            }}
                            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                              startTime === 120 ? 'bg-pink-500 text-white font-bold' : 'bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400'
                            }`}
                          >
                            2:00
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Error display */}
                    {saveError && (
                      <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium leading-relaxed">
                        ⚠️ {saveError}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2.5 pt-3 justify-end">
                      <button 
                        type="button"
                        disabled={isSaving}
                        onClick={handleCancelSettings}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                          themeMode === 'dark' ? 'border-pink-500/20 hover:bg-pink-500/5' : 'border-pink-200 hover:bg-pink-50'
                        }`}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        disabled={isSaving}
                        onClick={async () => {
                          setSaveError(null);
                          const trimmedUrl = musicUrl.trim();
                          const trimmedName = songName.trim();

                          if (!pendingFile && !trimmedUrl) {
                            setSaveError("Please enter a direct MP3 URL or upload an audio file first.");
                            return;
                          }

                          if (!trimmedName) {
                            setSaveError("Please enter a name/title for the song.");
                            return;
                          }

                          // If we are not using an uploaded local file, validate the direct URL
                          if (!pendingFile) {
                            if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
                              setSaveError("Invalid URL. The link must start with http:// or https://");
                              return;
                            }
                          }

                          setIsSaving(true);
                          try {
                            // Save to high-capacity IndexedDB (stores Blob directly to prevent size limit or memory issues)
                            if (pendingFile) {
                              await saveSongToDB("", trimmedName, startTime, pendingFile);
                            } else {
                              await saveSongToDB(trimmedUrl, trimmedName, startTime);
                            }

                            // Safely back up in localStorage without throwing QuotaExceeded errors
                            try {
                              if (pendingFile) {
                                localStorage.setItem('anousha_saved_song', 'indexeddb_stored');
                              } else {
                                localStorage.setItem('anousha_saved_song', trimmedUrl);
                              }
                              localStorage.setItem('anousha_saved_song_name', trimmedName);
                              localStorage.setItem('anousha_saved_song_start_time', startTime.toString());
                              localStorage.setItem('anousha_music_locked', 'true');
                            } catch (lsErr) {
                              console.warn("localStorage quota exceeded, but song is safely saved in IndexedDB.", lsErr);
                              localStorage.setItem('anousha_music_locked', 'true');
                            }

                            setIsMusicSaved(true);
                            setPendingFile(null);
                            setShowSettings(false);

                            // Reload audio to play custom song cleanly
                            if (audioRef.current) {
                              audioRef.current.load();
                              audioRef.current.currentTime = startTime;
                              hasSetInitialTime.current = true;
                              if (isPlaying) {
                                audioRef.current.play().catch(e => {
                                  console.log("Audio playback deferred:", e);
                                });
                              }
                            }
                          } catch (err: any) {
                            console.error("Save failed:", err);
                            setSaveError(err?.message || "Failed to save the song permanently. Please try another link or file.");
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-all shadow-lg shadow-pink-500/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Settings</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- HERO SECTION: OUR STORY BEGAN --- */}
          <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-12 md:py-24 z-10">
            {/* Soft decorative hearts floating behind main headline */}
            <div className="absolute top-1/4 animate-float opacity-30">
              <Heart className="w-16 h-16 text-pink-400 fill-pink-400/20" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="space-y-6 max-w-4xl"
            >
              <h2 className="font-display text-5xl md:text-8xl tracking-wide font-semibold leading-none">
                <span 
                  className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-rose-500 to-pink-500"
                  style={{ filter: themeMode === 'dark' ? 'drop-shadow(0 0 15px rgba(244,114,182,0.3))' : 'none' }}
                >
                  Anousha 💗
                </span>
              </h2>

              <div className="flex items-center justify-center gap-3">
                <div className={`h-[1px] w-8 md:w-16 ${themeMode === 'dark' ? 'bg-pink-500/30' : 'bg-pink-200'}`} />
                <p className="text-sm md:text-lg font-script text-pink-500 tracking-wider">
                  The day our beautiful journey started
                </p>
                <div className={`h-[1px] w-8 md:w-16 ${themeMode === 'dark' ? 'bg-pink-500/30' : 'bg-pink-200'}`} />
              </div>

              {/* Precise Moment Banner */}
              <div className="inline-flex flex-col md:flex-row items-center gap-3 md:gap-6 bg-pink-500/5 border border-pink-500/10 backdrop-blur-md px-6 py-3.5 rounded-full">
                <div className="flex items-center gap-1.5 text-pink-500">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span className="font-mono text-xs uppercase tracking-widest font-semibold">Sunday</span>
                </div>
                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-pink-400/50" />
                <span className="font-display font-semibold text-pink-400 text-lg md:text-xl">12 July</span>
                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-pink-400/50" />
                <span className="font-mono text-xs text-pink-400 font-semibold tracking-wider bg-pink-500/10 px-3 py-1 rounded-full">10:59 PM</span>
              </div>

              {/* Dynamic Count-up Clock ticker */}
              <div className="pt-6">
                <p className="text-[10px] tracking-widest uppercase opacity-60 mb-3 font-body">Every sweet second since we met:</p>
                
                <div className="grid grid-cols-5 gap-2 md:gap-4 max-w-xl mx-auto">
                  {[
                    { label: 'Years', val: elapsed.years },
                    { label: 'Days', val: elapsed.days },
                    { label: 'Hours', val: elapsed.hours },
                    { label: 'Mins', val: elapsed.minutes },
                    { label: 'Secs', val: elapsed.seconds },
                  ].map((item, i) => (
                    <div 
                      key={i}
                      className={`p-2.5 md:p-4 rounded-2xl border backdrop-blur-lg flex flex-col justify-center transition-all shadow-md ${
                        themeMode === 'dark' 
                          ? 'bg-pink-950/15 border-pink-500/10 shadow-pink-950/20' 
                          : 'bg-white/80 border-pink-100 shadow-pink-200/10'
                      }`}
                    >
                      <span className="font-display text-xl md:text-3xl font-bold text-pink-500 tracking-tight">
                        {item.val.toString().padStart(2, '0')}
                      </span>
                      <span className="text-[9px] md:text-[10px] uppercase tracking-wider opacity-60 mt-1 font-body">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          {/* --- THE LOVE LETTER ENVELOPE (PAGES UNFOLD) --- */}
          <section className="relative py-12 px-6 max-w-4xl mx-auto w-full z-10 flex flex-col items-center">
            <div className="text-center mb-8">
              <h3 className="font-display text-3xl font-bold text-pink-500">A Letter for You</h3>
              <p className="text-xs opacity-60 mt-1 font-body uppercase tracking-wider">Tap the heart to open my letter</p>
            </div>

            <div className="relative w-full max-w-lg min-h-[300px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!isEnvelopeOpen ? (
                  /* Sealed Envelope View */
                  <motion.div 
                    key="envelope-closed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    onClick={() => setIsEnvelopeOpen(true)}
                    className={`w-full max-w-md p-8 rounded-3xl border text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                      themeMode === 'dark' 
                        ? 'bg-gradient-to-br from-[#1c0617] to-[#12030e] border-pink-500/20 hover:border-pink-500/40' 
                        : 'bg-gradient-to-br from-white to-pink-50/50 border-pink-200 hover:border-pink-300'
                    }`}
                    style={{ boxShadow: '0 15px 35px rgba(236,72,153,0.06)' }}
                  >
                    {/* Visual folding envelope lines via gradients */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 to-transparent pointer-events-none" />
                    
                    <motion.div 
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-5 border border-pink-500/20 group-hover:bg-pink-500/20 transition-all duration-300"
                    >
                      <Mail className="w-7 h-7 text-pink-500" />
                    </motion.div>

                    <h4 className="font-display font-semibold text-lg opacity-90 mb-1">
                      A Letter from My Heart
                    </h4>
                    <p className="text-xs text-pink-500 font-script text-base mb-6">
                      Just for you, my love
                    </p>

                    {/* Interactive Wax Seal */}
                    <div className="relative flex justify-center items-center h-20">
                      {/* Pulsing ring */}
                      <div className="absolute w-14 h-14 rounded-full border border-pink-500/40 animate-ping opacity-75" />
                      
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-rose-600 shadow-md flex items-center justify-center relative active:scale-95 transition-all">
                        <Heart className="w-5 h-5 text-pink-100 fill-white animate-pulse" />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Opened Letter Scroll View */
                  <motion.div 
                    key="envelope-opened"
                    initial={{ opacity: 0, y: 30, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`w-full p-8 md:p-12 rounded-3xl border relative transition-all shadow-xl leading-relaxed ${
                      themeMode === 'dark' 
                        ? 'bg-[#1b0617] border-pink-500/20 text-pink-100 shadow-pink-950/20' 
                        : 'bg-white border-pink-200 text-pink-950 shadow-pink-100/10'
                    }`}
                  >
                    {/* Glowing gold ornament corner */}
                    <div className="absolute top-4 left-4 text-pink-500/20"><Sparkles className="w-5 h-5" /></div>
                    <div className="absolute top-4 right-4 text-pink-500/20"><Sparkles className="w-5 h-5" /></div>

                    <button 
                      onClick={() => setIsEnvelopeOpen(false)}
                      className="absolute top-4 right-10 text-xs text-pink-400 hover:text-pink-600 transition-colors cursor-pointer"
                    >
                      Close Letter
                    </button>

                    <p className="text-sm font-mono tracking-widest text-pink-500 font-bold uppercase mb-4 text-center">
                      To my dearest Anousha 💗,
                    </p>

                    <div className="font-display font-light text-base md:text-lg text-left space-y-6 italic text-pink-900">
                      <p>
                        I don't think simple words can ever explain how much I love you, but you are the best thing that has ever happened to me.
                      </p>
                      <p>
                        From the moment we met, every single day started feeling so much happier. Just seeing a message from you makes me smile, and my busiest days become easy when I think of you.
                      </p>
                      <p>
                        You bring so much warmth and light into my life. Your kindness, your sweet laugh, and all your little habits are always in my mind. You make everything feel cozy and peaceful.
                      </p>
                      <p>
                        If I had one wish today, it would be very simple. I just want to keep making sweet memories with you, one day at a time, for the rest of my life.
                      </p>
                      <p>
                        I promise to always support you, make you laugh, and remind you every single day how precious you are to me.
                      </p>
                      <p>
                        And yes... I have to say it again.
                      </p>
                      <p className="font-semibold text-pink-600">
                        You are absolutely the cutest person in the world!
                      </p>
                      <p>
                        You have this wonderful way of capturing my heart without even trying.
                      </p>
                      <p>
                        If loving you was a job, I would want to do it forever and never stop.
                      </p>
                      <p>
                        Thank you for being you. Thank you for making my life so bright.
                      </p>
                      <p>
                        No matter where we go, my heart will always belong to you with a smile.
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-pink-200 flex flex-col items-end">
                      <p className="font-script text-3xl text-pink-500 mt-1">Forever yours. ❤️</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* --- SECTION: 100 BEAUTIFULLY ANIMATED REASONS --- */}
          <section className="relative py-16 px-6 max-w-7xl mx-auto w-full z-10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className={`text-[10px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full border ${
                themeMode === 'dark' ? 'border-pink-500/20 text-pink-400 bg-pink-500/5' : 'border-pink-200 text-pink-700 bg-pink-50'
              }`}>
                My Little Love Journal
              </span>
              <h3 className="font-display text-3xl md:text-5xl font-bold mt-2 text-pink-500">
                100 Reasons Why I Love You
              </h3>
              <p className="text-xs opacity-75 mt-2">
                Here are 100 sweet reasons why you are so special to me. You can read them one by one, filter by category, or draw a random card.
              </p>
            </div>

            {/* --- DAILY REASON RANDOMIZER SHUFFLE CARD --- */}
            <div className="max-w-md mx-auto mb-12">
              <div className={`p-6 rounded-3xl border backdrop-blur-md text-center transition-all shadow-lg ${
                themeMode === 'dark' 
                  ? 'bg-pink-950/10 border-pink-500/10 shadow-pink-950/10' 
                  : 'bg-white/70 border-pink-100 shadow-pink-200/10'
              }`}>
                <h4 className="font-display font-bold text-base text-pink-500 mb-1 flex items-center justify-center gap-1.5">
                  <Shuffle className="w-4 h-4 animate-pulse" />
                  Draw a Love Card
                </h4>
                <p className="text-[11px] opacity-70 mb-4">Click the heart card to read a random sweet reason</p>

                <div className="h-44 w-full relative flex items-center justify-center mb-4 perspective">
                  <AnimatePresence mode="wait">
                    {shuffleCardIndex === null ? (
                      /* Card Back (Click to Flip) */
                      <motion.div 
                        key="card-back"
                        initial={{ rotateY: 180, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -180, opacity: 0 }}
                        onClick={drawRandomReason}
                        className={`absolute inset-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                          themeMode === 'dark' 
                            ? 'bg-[#1b0616]/40 border-pink-500/20 hover:border-pink-500/40 text-pink-300' 
                            : 'bg-pink-50/20 border-pink-200 hover:border-pink-400 text-pink-700'
                        }`}
                      >
                        <Heart className="w-8 h-8 text-pink-500 animate-pulse fill-pink-500/10" />
                        <span className="text-xs uppercase tracking-widest font-mono font-bold mt-2">Tap to flip</span>
                      </motion.div>
                    ) : (
                      /* Card Front (Revealed Reason) */
                      <motion.div 
                        key="card-front"
                        initial={{ rotateY: -180, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: 180, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`absolute inset-0 p-5 rounded-2xl border flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden ${
                          themeMode === 'dark' 
                            ? 'bg-gradient-to-br from-[#1d071a] to-[#120310] border-pink-500/30 text-pink-100' 
                            : 'bg-gradient-to-br from-white to-pink-50 border-pink-200 text-pink-950'
                        }`}
                      >
                        <div className="absolute top-2.5 right-3 text-[10px] font-mono opacity-50 font-bold">
                          Reason #{REASONS[shuffleCardIndex].id}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center mb-2">
                          <Sparkles className="w-4 h-4 text-pink-500" />
                        </div>
                        <p className="font-display font-medium text-[16px] leading-relaxed tracking-wide max-w-xs italic text-pink-400">
                          "{REASONS[shuffleCardIndex].text}"
                        </p>
                        <button 
                          onClick={() => setShuffleCardIndex(null)}
                          className="mt-3.5 text-[10px] uppercase font-mono tracking-wider text-pink-500 hover:underline cursor-pointer"
                        >
                          Draw Another Card
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* --- SECTIONS FILTER TABS --- */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {[
                { id: 'all', label: 'All 100', icon: Heart },
                { id: 'soul', label: '💖 Your Sweet Soul', icon: User },
                { id: 'magic', label: '✨ Your Magical Spark', icon: Sparkles },
                { id: 'romance', label: '🌹 My Romantic Feelings', icon: Gift },
                { id: 'devotion', label: '🕊️ Our Beautiful Future', icon: Star },
                { id: 'cherish', label: '💫 Little Details I Love', icon: Compass },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-filter-${tab.id}`}
                  onClick={() => {
                    setActiveCategory(tab.id);
                    setReasonsPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    activeCategory === tab.id
                      ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-500/10 scale-105'
                      : themeMode === 'dark'
                        ? 'bg-pink-950/20 border border-pink-500/10 text-pink-300 hover:bg-pink-900/30'
                        : 'bg-white border border-pink-200 text-pink-800 hover:bg-pink-50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search and results info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              {/* Search Bar */}
              <div className="relative w-full max-w-xs">
                <Search className="w-4 h-4 text-pink-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  id="input-reason-search"
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setReasonsPage(1);
                  }}
                  placeholder="Find a reason (e.g., smile)..."
                  className={`w-full py-2 pl-9 pr-4 rounded-xl border text-xs focus:outline-none focus:ring-1 transition-all ${
                    themeMode === 'dark' 
                      ? 'bg-pink-950/20 border-pink-500/20 text-white focus:border-pink-500' 
                      : 'bg-white border-pink-200 text-pink-950 focus:border-pink-400'
                  }`}
                />
              </div>

              {/* Counts info */}
              <div className="text-xs opacity-75">
                Showing <span className="font-bold text-pink-500">{filteredReasons.length}</span> of 100 sweet reasons
              </div>
            </div>

            {/* --- REASONS CARDS BENTO GRID --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="reasons-bento-grid">
              <AnimatePresence mode="popLayout">
                {paginatedReasons.map((reason) => (
                  <motion.div
                    key={reason.id}
                    layout
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.4 }}
                    className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col justify-between min-h-[140px] relative transition-all duration-300 hover:scale-[1.02] group ${
                      themeMode === 'dark' 
                        ? 'bg-[#1b0617]/50 border-pink-500/10 hover:border-pink-500/30' 
                        : 'bg-white/70 border-pink-100 hover:border-pink-300'
                    }`}
                    style={{ 
                      boxShadow: themeMode === 'light' ? '0 4px 15px rgba(236,72,153,0.02)' : 'none' 
                    }}
                  >
                    {/* Index identifier decoration */}
                    <div className="absolute top-3 right-3 text-[10px] font-mono opacity-40 group-hover:opacity-100 group-hover:text-pink-500 transition-opacity font-bold">
                      #{reason.id}
                    </div>

                    {/* Category color bullet */}
                    <div className="mb-3 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        reason.category === 'soul' ? 'bg-indigo-400' :
                        reason.category === 'magic' ? 'bg-amber-400' :
                        reason.category === 'romance' ? 'bg-rose-400' :
                        reason.category === 'devotion' ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`} />
                      <span className="text-[8px] uppercase tracking-wider font-mono opacity-50 font-bold">
                        {reason.category}
                      </span>
                    </div>

                    <p className="font-display font-medium text-[16px] leading-relaxed tracking-wide text-pink-500 italic flex-1 pr-6">
                      "{reason.text}"
                    </p>

                    <div className="mt-4 flex justify-end">
                      <Heart className="w-3.5 h-3.5 text-pink-400/20 group-hover:text-pink-500/75 transition-colors fill-transparent group-hover:fill-pink-500/10" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Empty view fallback */}
            {filteredReasons.length === 0 && (
              <div className="text-center py-12">
                <Heart className="w-10 h-10 text-pink-300 animate-pulse mx-auto opacity-50" />
                <p className="text-sm opacity-60 mt-2 font-display">No matching reasons found for our Anousha</p>
              </div>
            )}

            {/* --- PAGINATION CONTROLS --- */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  disabled={reasonsPage === 1}
                  onClick={() => setReasonsPage(reasonsPage - 1)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-40 ${
                    themeMode === 'dark' ? 'border-pink-500/15 hover:bg-pink-500/5' : 'border-pink-200 hover:bg-pink-50'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 text-pink-500" />
                </button>
                <span className="text-xs font-mono">
                  Page <span className="font-bold text-pink-500">{reasonsPage}</span> of {totalPages}
                </span>
                <button
                  disabled={reasonsPage === totalPages}
                  onClick={() => setReasonsPage(reasonsPage + 1)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-40 ${
                    themeMode === 'dark' ? 'border-pink-500/15 hover:bg-pink-500/5' : 'border-pink-200 hover:bg-pink-50'
                  }`}
                >
                  <ChevronRight className="w-4 h-4 text-pink-500" />
                </button>
              </div>
            )}
          </section>

          {/* --- BOTTOM FLOATING MUSIC HARMONIC DOCK PLAYER --- */}
          <div className="fixed bottom-6 left-6 z-40 max-w-sm w-fit pointer-events-auto">
            <div className={`p-3.5 rounded-full border backdrop-blur-xl shadow-lg flex items-center gap-3 transition-all ${
              themeMode === 'dark' 
                ? 'bg-[#1b0617]/90 border-pink-500/25 text-pink-100 shadow-pink-950/40' 
                : 'bg-white/90 border-pink-200 text-pink-950 shadow-pink-100/10'
            }`}>
              {/* Rotating sound disk */}
              <div 
                className={`w-10 h-10 rounded-full border border-pink-500/20 bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-inner ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
              >
                <Music className="w-4.5 h-4.5 text-white" />
              </div>

              {/* Music Title Ticker */}
              <div className="hidden sm:block max-w-[130px] overflow-hidden truncate">
                <p className="text-[10px] opacity-50 uppercase font-mono tracking-wider leading-none">Soundscape</p>
                <p className="text-xs font-semibold mt-0.5 truncate text-pink-400">{songName}</p>
              </div>

              {/* Play Pause Trigger */}
              <button
                id="btn-toggle-playing-state"
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-pink-500/10"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-pink-500/10" />}
              </button>
            </div>
          </div>

          {/* --- INTERACTIVE MOON & STAR WISHES SECTION ("A Sky Full of Love for Anousha") --- */}
          <section className="relative overflow-hidden w-full min-h-[750px] py-24 px-6 select-none bg-gradient-to-b from-[#110524] via-[#1a0c36] to-[#0a0214] text-white">
            
            {/* Top wave/cloud transitions to soft light pink */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#fff2f5] via-[#E6D9FA]/40 to-transparent pointer-events-none z-0" />
            
            {/* Soft drifting clouds */}
            <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden pointer-events-none z-0">
              <motion.div 
                animate={{ x: ['-20%', '110%'] }}
                transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
                className="absolute top-[20%] left-0 w-80 h-32 bg-gradient-to-r from-transparent via-purple-300/10 to-transparent blur-3xl rounded-full"
              />
              <motion.div 
                animate={{ x: ['110%', '-20%'] }}
                transition={{ duration: 220, repeat: Infinity, ease: 'linear' }}
                className="absolute top-[65%] left-0 w-96 h-40 bg-gradient-to-r from-transparent via-pink-300/10 to-transparent blur-3xl rounded-full"
              />
            </div>

            {/* Distant background twinkle stars */}
            {backgroundStars.map((star) => (
              <div
                key={`bg-star-${star.id}`}
                className="absolute bg-white rounded-full opacity-40 animate-pulse pointer-events-none z-0"
                style={{
                  top: star.top,
                  left: star.left,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  animationDelay: `${star.delay}s`,
                  animationDuration: `${star.duration}s`,
                  boxShadow: '0 0 4px rgba(255, 255, 255, 0.4)'
                }}
              />
            ))}

            {/* Glowing fireflies drifting through the night air */}
            {fireflies.map((ff) => (
              <motion.div
                key={`firefly-${ff.id}`}
                className="absolute rounded-full bg-pink-300 pointer-events-none z-0"
                style={{
                  top: ff.top,
                  left: ff.left,
                  width: `${ff.size}px`,
                  height: `${ff.size}px`,
                  boxShadow: '0 0 10px rgba(244, 114, 182, 0.8), 0 0 4px rgba(255, 255, 255, 0.9)',
                }}
                animate={{
                  x: ff.animX,
                  y: ff.animY,
                  opacity: [0.3, 0.9, 0.4, 0.8, 0.3],
                }}
                transition={{
                  duration: ff.duration,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}

            {/* shooting star effects */}
            {shootingStar && (
              <motion.div 
                initial={{ x: '-100%', y: '-10%', opacity: 1 }}
                animate={{ x: '220%', y: '160%', opacity: 0 }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                className="absolute w-48 h-[2px] bg-gradient-to-r from-transparent via-white to-pink-200 blur-[1px] rotate-[35deg] pointer-events-none z-0"
                style={{ top: shootingStar.top, left: shootingStar.left }}
              />
            )}

            {/* Title & Header inside Section */}
            <div className="relative z-10 max-w-2xl mx-auto mb-16 text-center">
              <span className="text-[10px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full border border-pink-400/30 text-pink-300 bg-pink-500/5 backdrop-blur-sm">
                ✦ My Wishes for You ✦
              </span>
              <h3 className="font-display text-3xl md:text-5xl font-bold mt-3 text-pink-200 drop-shadow-[0_0_15px_rgba(244,114,182,0.35)]">
                A Sky Full of Love for Anousha 💗
              </h3>
              <p className="text-xs text-pink-100/70 mt-3 max-w-md mx-auto leading-relaxed font-body uppercase tracking-wider">
                Tap the glowing moon or the bright stars to read my sweet wishes for you.
              </p>
            </div>

            {/* Interactive Stars Group (8-10 Special clickable stars) */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {INTERACTIVE_STARS_DATA.map((star) => (
                <div key={`star-holder-${star.id}`} className="absolute" style={{ top: star.top, left: star.left }}>
                  
                  {/* Clickable Star Trigger */}
                  <motion.button
                    id={`btn-star-wish-${star.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStarClick(star.id);
                    }}
                    className={`rounded-full cursor-pointer pointer-events-auto flex items-center justify-center p-2.5 group transition-all duration-300 ${
                      activeStarId === star.id ? 'scale-125' : 'hover:scale-110'
                    }`}
                    animate={{ 
                      y: [0, -5, 0],
                      scale: activeStarId === star.id ? [1.2, 1.35, 1.25] : [1, 1.05, 1]
                    }}
                    transition={{
                      y: { repeat: Infinity, duration: 3.5 + star.id % 3, ease: "easeInOut", delay: star.delay },
                      scale: { repeat: activeStarId === star.id ? Infinity : 0, duration: 2, ease: "easeInOut" }
                    }}
                  >
                    <div className="relative">
                      {/* Star Glow Aura */}
                      <div className={`absolute -inset-3 bg-[#F7D774] rounded-full blur-md transition-opacity duration-300 group-hover:opacity-100 ${
                        activeStarId === star.id ? 'opacity-100 animate-pulse' : 'opacity-40'
                      }`} />
                      
                      <Star className={`w-5.5 h-5.5 transition-all ${
                        activeStarId === star.id 
                          ? 'text-[#F7D774] fill-[#F7D774] drop-shadow-[0_0_12px_rgba(247,215,116,1)]' 
                          : 'text-pink-100 group-hover:text-[#F7D774] drop-shadow-[0_0_6px_rgba(247,215,116,0.6)]'
                      }`} />
                    </div>
                  </motion.button>

                  {/* Star Wish Bubble Pop-up */}
                  <AnimatePresence>
                    {activeStarId === star.id && starMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.85 }}
                        className="absolute z-30 w-52 p-4 rounded-2xl border bg-white/10 backdrop-blur-xl text-white text-xs font-medium shadow-2xl pointer-events-auto"
                        style={{
                          transform: 'translateX(-50%)',
                          top: parseFloat(star.top) > 55 ? '-130px' : '45px',
                          left: parseFloat(star.left) > 75 ? '-150px' : parseFloat(star.left) < 25 ? '50px' : '0px',
                          boxShadow: '0 10px 30px rgba(248,187,217,0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.25)'
                        }}
                      >
                        <div className="text-[8px] font-mono opacity-60 tracking-wider text-[#F7D774] uppercase font-bold mb-1">
                          ⭐ Star Wish
                        </div>
                        <p className="font-display italic text-pink-50 text-[14px] leading-relaxed tracking-wide text-left">
                          "{starMessage}"
                        </p>
                        <div className="mt-2.5 flex justify-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStarId(null);
                              setStarMessage(null);
                            }}
                            className="text-[9px] uppercase tracking-wider text-[#F7D774] font-extrabold hover:underline cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              ))}
            </div>

            {/* Elegant Floating Realistic Moon (Moved to Upper Right and made smaller) */}
            <div className="absolute top-4 right-4 md:top-12 md:right-12 z-20 flex flex-col items-center select-none">
              <motion.button
                id="btn-interactive-moon"
                onClick={handleMoonClick}
                className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center cursor-pointer select-none group focus:outline-none"
                animate={{ 
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Stunning soft halo glow around the moon */}
                <motion.div 
                  animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-yellow-100/25 blur-xl pointer-events-none"
                  style={{ boxShadow: '0 0 50px rgba(254, 243, 199, 0.4)' }}
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-4 rounded-full bg-pink-300/15 blur-2xl pointer-events-none"
                />

                {/* Extremely realistic high-quality vector moon body */}
                <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden border border-yellow-200/30 shadow-2xl">
                  <svg viewBox="0 0 100 100" className="w-full h-full rounded-full select-none pointer-events-none">
                    <defs>
                      <radialGradient id="moon-body-grad" cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#FFFDF6" />
                        <stop offset="15%" stopColor="#FFFCE8" />
                        <stop offset="50%" stopColor="#FAF1C5" />
                        <stop offset="75%" stopColor="#E6D394" />
                        <stop offset="100%" stopColor="#C0A763" />
                      </radialGradient>
                      <radialGradient id="moon-atmospheric-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="70%" stopColor="rgba(255, 253, 230, 0.25)" />
                        <stop offset="100%" stopColor="rgba(255, 253, 230, 0)" />
                      </radialGradient>
                    </defs>
                    
                    {/* Moon body base */}
                    <circle cx="50" cy="50" r="49" fill="url(#moon-body-grad)" stroke="rgba(254, 243, 199, 0.3)" strokeWidth="0.5" />
                    
                    {/* Realistic Lunar Maria (basaltic plains) */}
                    <path d="M25,35 C32,32 45,34 50,42 C53,46 48,58 40,58 C35,58 32,52 28,50 C22,48 20,40 25,35 Z" fill="#99804D" opacity="0.18" filter="blur(2px)" />
                    <path d="M45,25 C52,22 62,26 64,32 C66,36 60,45 52,43 C46,42 45,35 42,32 C38,28 40,26 45,25 Z" fill="#99804D" opacity="0.15" filter="blur(2.5px)" />
                    <path d="M55,42 C65,38 78,42 75,52 C72,60 62,65 52,60 C46,56 48,48 55,42 Z" fill="#99804D" opacity="0.16" filter="blur(2px)" />
                    <path d="M30,55 C35,52 42,56 44,62 C46,68 38,75 32,72 C26,70 25,62 30,55 Z" fill="#99804D" opacity="0.12" filter="blur(1.5px)" />
                    <path d="M52,62 C58,60 64,65 65,70 C66,74 58,80 50,78 C44,76 46,68 52,62 Z" fill="#99804D" opacity="0.10" filter="blur(2px)" />

                    {/* Highly tactile 3D crater formations */}
                    {/* Tycho Crater & Rays */}
                    <circle cx="50" cy="78" r="4" fill="#EAD99B" opacity="0.55" />
                    <circle cx="50" cy="78" r="2.5" fill="#C5AE67" opacity="0.75" />
                    <path d="M50,78 L35,65 M50,78 L68,64 M50,78 L25,75 M50,78 L75,76 M50,78 L42,92 M50,78 L58,92 M50,78 L50,55" stroke="#FFFCE8" strokeWidth="0.5" strokeDasharray="1 3" opacity="0.4" />

                    {/* Copernicus Crater */}
                    <circle cx="34" cy="48" r="3.5" fill="#EAD99B" opacity="0.5" />
                    <circle cx="34" cy="48" r="2" fill="#B09952" opacity="0.65" />
                    
                    {/* Kepler Crater */}
                    <circle cx="23" cy="52" r="2.5" fill="#EAD99B" opacity="0.45" />
                    <circle cx="23" cy="52" r="1.5" fill="#B09952" opacity="0.55" />

                    {/* Eastern Craters (Langrenus & Petavius) */}
                    <circle cx="76" cy="52" r="3" fill="#E0CE8C" opacity="0.5" />
                    <circle cx="76" cy="52" r="1.8" fill="#9E8740" opacity="0.6" />
                    <circle cx="74" cy="64" r="3.5" fill="#E0CE8C" opacity="0.45" />
                    <circle cx="74" cy="64" r="2.2" fill="#9E8740" opacity="0.5" />

                    {/* Plato Crater (North) */}
                    <circle cx="48" cy="20" r="3.5" fill="#99804D" opacity="0.4" />
                    <circle cx="48" cy="20" r="2.5" fill="#6B5629" opacity="0.65" />

                    {/* Clavius Crater (South) */}
                    <circle cx="52" cy="88" r="5" fill="#EAD99B" opacity="0.45" />
                    <circle cx="52" cy="88" r="3.5" fill="#B09952" opacity="0.55" />

                    {/* Atmos sheen */}
                    <circle cx="50" cy="50" r="50" fill="url(#moon-atmospheric-glow)" />
                  </svg>
                </div>

                {/* Sparkling gold star & cute heart details */}
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-[#F7D774] animate-pulse pointer-events-none opacity-90" />
                <Heart className="absolute -bottom-1 -left-1 w-4 h-4 text-pink-300 animate-bounce pointer-events-none opacity-95" />
              </motion.button>
              
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-yellow-100/60 mt-3.5 animate-pulse select-none text-center">
                ✦ Tap the Moon ✦
              </span>
            </div>

            {/* Central Moon Glassmorphism message box popup */}
            <div className="relative z-30 flex items-center justify-center w-full max-w-xl mx-auto px-4 mt-8">
              <AnimatePresence>
                {showMoonMessage && moonMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 15 }}
                    className="w-full p-6 md:p-8 rounded-3xl border bg-white/10 backdrop-blur-xl text-white shadow-2xl relative overflow-hidden"
                    style={{
                      boxShadow: '0 15px 45px rgba(253, 224, 71, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {/* Glowing golden accents */}
                    <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-yellow-200/15 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -right-12 w-28 h-28 rounded-full bg-pink-400/15 blur-2xl pointer-events-none" />
                    
                    <p className="font-display italic text-[19px] md:text-[21px] text-yellow-50 font-light leading-relaxed tracking-wide whitespace-pre-line text-center">
                      {moonMessage}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
                      <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">
                        Moon Whisper #{moonClickCount}
                      </span>
                      <button
                        onClick={() => setShowMoonMessage(false)}
                        className="text-xs font-bold text-[#F7D774] hover:underline cursor-pointer"
                      >
                        Close Message
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom transition gradient to the pink proposal block */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#fff0f4] via-[#E6D9FA]/20 to-transparent pointer-events-none z-0" />
          </section>

          {/* --- THE GRAND FINALE PROPOSAL SECTION --- */}
          <section className="relative py-20 px-6 z-10 max-w-4xl mx-auto w-full text-center">
            {/* Visual dividers */}
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="h-[1px] w-12 bg-pink-500/25" />
              <Heart className="w-6 h-6 text-pink-500 fill-pink-500/10 animate-bounce" />
              <div className="h-[1px] w-12 bg-pink-500/25" />
            </div>

            <AnimatePresence mode="wait">
              {!proposalAccepted ? (
                /* The Active Proposal Screen */
                <motion.div 
                  key="proposal-active"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className={`p-8 md:p-14 rounded-3xl border relative overflow-hidden backdrop-blur-md shadow-2xl ${
                    themeMode === 'dark' 
                      ? 'bg-gradient-to-br from-[#1b0616] via-[#10030d] to-[#0a0008] border-pink-500/20 shadow-pink-950/40' 
                      : 'bg-gradient-to-br from-white via-[#fff0f4] to-pink-50 border-pink-200 shadow-pink-200/30'
                  }`}
                  style={{ boxShadow: '0 20px 60px rgba(236,72,153,0.07)' }}
                >
                  <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />
                  
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-6"
                  >
                    <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                  </motion.div>

                  <h3 className="font-display text-3xl md:text-5xl font-extrabold tracking-wide mb-3 leading-tight text-pink-500">
                    Anousha...
                  </h3>
                  
                  <p className="font-display text-lg md:text-2xl italic font-light opacity-95 mb-8">
                    "Will You Be Mine Forever? ❤️"
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                    {/* Option 1: Yes, Forever */}
                    <button
                      onClick={() => setProposalAccepted(true)}
                      id="btn-proposal-yes"
                      className="w-full bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-pink-500/20 cursor-pointer text-sm tracking-wide flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      ❤️ Yes, Forever
                    </button>

                    {/* Option 2: Always & Forever */}
                    <button
                      onClick={() => setProposalAccepted(true)}
                      id="btn-proposal-always"
                      className="w-full bg-gradient-to-r from-rose-600 via-pink-500 to-rose-500 hover:from-rose-500 hover:to-pink-400 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-pink-500/20 cursor-pointer text-sm tracking-wide flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Sparkles className="w-4.5 h-4.5 text-pink-100" />
                      🥹 Always & Forever
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Proposal Accepted Celebratory Screen */
                <motion.div 
                  key="proposal-celebrated"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, type: "spring" }}
                  className={`p-8 md:p-16 rounded-3xl border text-center backdrop-blur-xl relative overflow-hidden shadow-2xl ${
                    themeMode === 'dark' 
                      ? 'bg-gradient-to-b from-[#21061b] to-[#0c000a] border-pink-400/30 text-pink-100 shadow-pink-950/60' 
                      : 'bg-gradient-to-b from-white to-[#fff0f4] border-pink-300 text-pink-950 shadow-pink-300/30'
                  }`}
                  style={{ boxShadow: '0 0 60px rgba(236,72,153,0.18)' }}
                >
                  {/* Glowing halo behind heart */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

                  {/* Confetti Rain Overlay Effect inside Card */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const size = Math.random() * 6 + 4;
                      const delay = Math.random() * 4;
                      const duration = Math.random() * 3 + 2;
                      const left = Math.random() * 100;
                      return (
                        <div 
                          key={i}
                          className="absolute bg-pink-500 rounded-full opacity-60 animate-bounce"
                          style={{
                            width: size,
                            height: size,
                            left: `${left}%`,
                            top: `-20px`,
                            animation: `float ${duration}s linear infinite`,
                            animationDelay: `${delay}s`
                          }}
                        />
                      );
                    })}
                  </div>

                  <motion.div 
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-pink-500/20 relative z-10"
                  >
                    <Heart className="w-12 h-12 text-white fill-white" />
                  </motion.div>

                  <h3 className="font-display text-4xl md:text-6xl font-black mb-4 tracking-wide leading-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-rose-500 to-amber-400 relative z-10">
                    Forever Begins With Us ❤️
                  </h3>

                  <p className="font-display text-lg md:text-2xl font-light italic opacity-90 max-w-xl mx-auto leading-relaxed mb-8 relative z-10">
                    "My heart is all yours, forever and ever, my beautiful Anousha."
                  </p>

                  {/* Animated Rose emblem */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center justify-center gap-2 text-pink-500/70 z-10 relative"
                  >
                    <Flower className="w-5 h-5 animate-spin-slow" />
                    <span className="font-mono text-xs uppercase tracking-widest font-bold">Locked with love forever</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* --- LUXURIOUS HANDCRAFTED FOOTER --- */}
          <footer className="mt-auto py-12 px-6 border-t text-center relative z-10"
            style={{ 
              borderColor: themeMode === 'dark' ? 'rgba(236, 72, 153, 0.08)' : 'rgba(236, 72, 153, 0.1)' 
            }}
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-center gap-2 text-pink-500">
                <Heart className="w-4 h-4 fill-pink-500" />
                <span className="font-display font-bold tracking-wide">Anousha 💗 Forever</span>
              </div>
              <p className="text-[10px] opacity-60 leading-relaxed font-body uppercase tracking-wider">
                Handcrafted with love, sweet light, and happy promises just for you.
              </p>
              <div className="text-[9px] font-mono opacity-40">
                July 12, 10:59 PM • Anniversary Sanctuary • Made with love
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
