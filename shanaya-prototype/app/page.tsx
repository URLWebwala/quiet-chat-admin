'use client';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Home,
  MessageCircle,
  Images,
  Compass,
  UserRound,
  Bell,
  Heart,
  ArrowRight,
  ArrowUp,
  LockKeyhole,
  Play,
  Sparkles,
  CalendarDays,
  Search,
  Check,
  X,
  Trash2,
  ShieldCheck,
  Settings2,
  Crown,
  Info,
  LogOut,
  RotateCcw,
  Bookmark,
  CheckCircle2,
  Video,
  Image as ImageIcon,
  LogIn,
  UserPlus,
  Mail,
  KeyRound,
  User,
  Loader2,
  MapPin,
  Share2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Send,
} from 'lucide-react';
import { media, releases, tiers, type Page, type Plan, type Media } from '../lib/data';

// Production API Base (proxied through next.config.ts or direct fallback)
const API_BASE = 'https://admin.quietchat.in';
const HOST_SLUG = 'shanaya-prototype';
const SHANAYA_AVATAR = 'https://admin.quietchat.in/storage/1788543557169.jpg';

interface CommentItem {
  _id?: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  reply?: {
    text: string;
    repliedAt?: string;
    author?: string;
  };
}

interface LivePost {
  _id: string;
  hostSlug: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaUrls?: string[];
  isCarousel?: boolean;
  type: 'photo' | 'video';
  category?: 'discover' | 'exclusive';
  creditCost?: number;
  likesCount?: number;
  commentsCount?: number;
  comments?: CommentItem[];
  likedByUsers?: string[];
  createdAt: string;
}

type Msg = { id: string | number; who: 'user' | 'shanaya'; text: string; time?: string };
type UserProfile = {
  _id?: string;
  name: string;
  email: string;
  gender?: string;
  hostSlug?: string;
  avatar?: string;
  credits?: number;
  unlockedExclusiveMedia?: string[];
  receivedWelcomeBonus?: boolean;
  createdAt?: string;
};

interface CreditTransaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  category: string;
  description: string;
  createdAt: string;
}

interface RatesConfig {
  freeCreditsEnabled: boolean;
  welcomeFreeCredits: number;
  chatCreditRate: number;
  exclusivePhotoRate: number;
  exclusiveVideoRate: number;
  discoverFree: boolean;
}

type Saved = {
  plan: Plan;
  unlocked: string[];
  favorites: string[];
  reminders: string[];
  name: string;
  memory: boolean;
  notifications: boolean;
};

const initial: Saved = {
  plan: 'Free',
  unlocked: [],
  favorites: [],
  reminders: [],
  name: 'Guest',
  memory: true,
  notifications: true,
};

const nav: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'moments', label: 'Exclusive', icon: Images },
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

function formatDate(s: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  }).format(new Date(s));
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[#76566f] px-3 py-1 text-xs text-blush">{children}</span>;
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [saved, setSaved] = useState<Saved>(initial);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Media | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);
  const [tab, setTab] = useState<'all' | 'unlocked' | 'favorites'>('all');
  const [showNotice, setShowNotice] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Authentication State
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Form Fields
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authGender, setAuthGender] = useState('male');

  // Chat Messages State
  const [messages, setMessages] = useState<Msg[]>([
    { id: 1, who: 'shanaya', text: 'Hey, you. ✨ What kind of evening are we creating today?' },
  ]);

  // Instagram-style Discover Feed Posts State
  const [feedPosts, setFeedPosts] = useState<LivePost[]>([]);
  const [feedLoading, setFeedLoading] = useState<boolean>(true);
  const [postLikes, setPostLikes] = useState<Record<string, boolean>>({});
  const [feedFilter, setFeedFilter] = useState<'all' | 'photo' | 'video'>('all');

  // Exclusive Media State (Paid credit-gated content)
  const [exclusivePosts, setExclusivePosts] = useState<LivePost[]>([]);
  const [exclusiveLoading, setExclusiveLoading] = useState<boolean>(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  // Multi-item Carousel navigation index state
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});

  // Instagram-style Likes & Comments State
  const [activeCommentsPost, setActiveCommentsPost] = useState<LivePost | null>(null);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [likesState, setLikesState] = useState<Record<string, { count: number; isLiked: boolean }>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent, postId: string, count: number, activeIdx: number) => {
    if (touchStartX === null || count <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setCarouselIndices((prev) => ({
          ...prev,
          [postId]: (activeIdx + 1) % count,
        }));
      } else {
        setCarouselIndices((prev) => ({
          ...prev,
          [postId]: (activeIdx - 1 + count) % count,
        }));
      }
    }
    setTouchStartX(null);
  };

  const handleToggleLike = async (post: LivePost) => {
    const current = likesState[post._id] || {
      count: post.likesCount ?? 28,
      isLiked: post.likedByUsers?.includes(user?.email || 'user') || postLikes[post._id] || false,
    };
    const nextIsLiked = !current.isLiked;
    const nextCount = nextIsLiked ? current.count + 1 : Math.max(0, current.count - 1);

    setLikesState((prev) => ({
      ...prev,
      [post._id]: { count: nextCount, isLiked: nextIsLiked },
    }));
    setPostLikes((prev) => ({ ...prev, [post._id]: nextIsLiked }));
    setToast(nextIsLiked ? 'Liked! ❤️' : 'Unliked');

    try {
      await axios.post(`${API_BASE}/api/model-media/like`, {
        postId: post._id,
        userId: user?.email || user?._id || 'guest-user',
        userName: user?.name || 'Guest',
      });
    } catch (e) {
      console.warn('Like sync error:', e);
    }
  };

  const handleOpenComments = async (post: LivePost) => {
    setActiveCommentsPost(post);
    setCommentsList(
      post.comments && post.comments.length > 0
        ? post.comments
        : [
            { userName: 'Aarav Sharma', text: 'You look stunning as always! ✨', createdAt: new Date(Date.now() - 3600000).toISOString() },
            { userName: 'Pooja V.', text: 'Love the cozy vibe of this photo 💕', createdAt: new Date(Date.now() - 7200000).toISOString() },
            { userName: 'Kunal Malhotra', text: 'Such aesthetic frames! Indiranagar evenings are the best ☕', createdAt: new Date(Date.now() - 14400000).toISOString() },
          ]
    );
    try {
      const res = await axios.get(`${API_BASE}/api/model-media/comments?postId=${post._id}`);
      if (res.data?.status && Array.isArray(res.data.comments) && res.data.comments.length > 0) {
        setCommentsList(res.data.comments);
      }
    } catch (e) {
      console.warn('Fetch comments error:', e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentsPost || !commentInput.trim()) return;
    const text = commentInput.trim();
    setCommentInput('');
    setSubmittingComment(true);

    const newComment: CommentItem = {
      userName: user?.name || 'You',
      text,
      createdAt: new Date().toISOString(),
    };
    setCommentsList((prev) => [...prev, newComment]);

    setFeedPosts((prev) =>
      prev.map((p) =>
        p._id === activeCommentsPost._id
          ? { ...p, commentsCount: (p.commentsCount || 0) + 1, comments: [...(p.comments || []), newComment] }
          : p
      )
    );

    try {
      await axios.post(`${API_BASE}/api/model-media/comment`, {
        postId: activeCommentsPost._id,
        text,
        userName: user?.name || 'You',
        userAvatar: user?.avatar || '',
      });
      setToast('Comment posted! 💬');
    } catch (e) {
      console.warn('Add comment error:', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getPostMediaList = (post: LivePost): string[] => {
    if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
      return post.mediaUrls;
    }
    return post.mediaUrl ? [post.mediaUrl] : [];
  };

  // Credit Purchase Plans State
  const [creditPlans, setCreditPlans] = useState<any[]>([]);
  const [creditPlansLoading, setCreditPlansLoading] = useState<boolean>(false);

  // Wallet & Global Rates State
  const [rates, setRates] = useState<RatesConfig>({
    freeCreditsEnabled: true,
    welcomeFreeCredits: 100,
    chatCreditRate: 5,
    exclusivePhotoRate: 20,
    exclusiveVideoRate: 50,
    discoverFree: true,
  });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);

  const resolvePostMedia = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE}${clean}`;
  };

  const fetchLivePosts = async () => {
    setFeedLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/model-media/list`, {
        params: { hostSlug: HOST_SLUG, category: 'discover' },
      });
      if (res.data?.status && Array.isArray(res.data.posts)) {
        // Strict Discover filter: only posts that are not exclusive
        const discoverOnly = res.data.posts.filter((p: LivePost) => p.category !== 'exclusive');
        setFeedPosts(discoverOnly);
      }
    } catch (e) {
      console.warn('Failed to load feed posts:', e);
    } finally {
      setFeedLoading(false);
    }
  };

  const fetchExclusivePosts = async () => {
    setExclusiveLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/model-media/list`, {
        params: { hostSlug: HOST_SLUG, category: 'exclusive' },
      });
      if (res.data?.status && Array.isArray(res.data.posts)) {
        // Strict Exclusive filter: only posts that are explicitly marked as exclusive
        const exclusiveOnly = res.data.posts.filter((p: LivePost) => p.category === 'exclusive');
        setExclusivePosts(exclusiveOnly);
      }
    } catch (e) {
      console.warn('Failed to load exclusive posts:', e);
    } finally {
      setExclusiveLoading(false);
    }
  };

  const fetchCreditPlans = async () => {
    setCreditPlansLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/credit-plan/fetchCreditPlans`);
      if (res.data?.status && Array.isArray(res.data.creditPlan)) {
        setCreditPlans(res.data.creditPlan);
      }
    } catch (e) {
      console.warn('Failed to load credit plans:', e);
    } finally {
      setCreditPlansLoading(false);
    }
  };

  const handleUnlockMedia = async (post: LivePost) => {
    if (!token) {
      setAuthMode('login');
      setAuthModalOpen(true);
      setToast('Please log in or register to unlock exclusive content!');
      return;
    }

    const currentBal = Number(user?.credits) || 0;
    const cost = Number(post.creditCost) || 20;
    if (currentBal < cost) {
      setToast(`Insufficient credits! Required: ${cost} credits (Current balance: ${currentBal}). Recharge below.`);
      navigate('membership');
      return;
    }

    setUnlockingId(post._id);
    try {
      const res = await axios.post(
        `${API_BASE}/api/model-user/unlock-media`,
        { mediaId: post._id, type: post.type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.status) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated: UserProfile = {
            ...prev,
            credits: Number(res.data.credits) || 0,
            unlockedExclusiveMedia: Array.isArray(res.data.unlockedExclusiveMedia)
              ? res.data.unlockedExclusiveMedia
              : [...(prev.unlockedExclusiveMedia || []), post._id],
          };
          localStorage.setItem('shanaya_user', JSON.stringify(updated));
          return updated;
        });
        setToast(`Exclusive unlocked! -${res.data.creditsDeducted || cost} Credits ✨`);
        fetchWallet(token);
      } else {
        setToast(res.data?.message || 'Failed to unlock media');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to unlock media';
      setToast(msg);
    } finally {
      setUnlockingId(null);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/model-user/rates?hostSlug=${HOST_SLUG}`);
      if (res.data?.status) {
        setRates({
          freeCreditsEnabled: res.data.freeCreditsEnabled !== false,
          welcomeFreeCredits: Number(res.data.welcomeFreeCredits) || 100,
          chatCreditRate: Number(res.data.chatCreditRate) || 5,
          exclusivePhotoRate: Number(res.data.exclusivePhotoRate) || 20,
          exclusiveVideoRate: Number(res.data.exclusiveVideoRate) || 50,
          discoverFree: true,
        });
      }
    } catch (e) {
      console.warn('Failed to load rates:', e);
    }
  };

  const fetchWallet = async (authToken: string) => {
    setWalletLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/model-user/wallet`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.data?.status) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated: UserProfile = {
            ...prev,
            credits: Number(res.data.credits) || 0,
            unlockedExclusiveMedia: Array.isArray(res.data.unlockedExclusiveMedia) ? res.data.unlockedExclusiveMedia : [],
          };
          localStorage.setItem('shanaya_user', JSON.stringify(updated));
          return updated;
        });
        if (Array.isArray(res.data.transactions)) {
          setTransactions(res.data.transactions);
        }
      }
    } catch (e) {
      console.warn('Failed to load wallet:', e);
    } finally {
      setWalletLoading(false);
    }
  };

  // Load saved state, token, and feed posts on mount
  useEffect(() => {
    fetchLivePosts();
    fetchExclusivePosts();
    fetchCreditPlans();
    fetchRates();
    try {
      const raw = localStorage.getItem('shanaya-demo-v1');
      if (raw) setSaved({ ...initial, ...JSON.parse(raw) });

      const savedToken = localStorage.getItem('shanaya_jwt_token');
      const savedUser = localStorage.getItem('shanaya_user');
      if (savedToken) {
        setToken(savedToken);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setSaved((s) => ({ ...s, name: parsed.name || s.name }));
        }
        fetchHistory(savedToken);
        fetchWallet(savedToken);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem('shanaya-demo-v1', JSON.stringify(saved));
  }, [saved, ready]);

  useEffect(() => {
    if (page === 'chat') endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, page]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const patch = (p: Partial<Saved>) => setSaved((v) => ({ ...v, ...p }));
  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch Chat History from backend
  const fetchHistory = async (authToken: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/model-user/history?hostSlug=${HOST_SLUG}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.data?.status && Array.isArray(res.data.messages) && res.data.messages.length > 0) {
        const formatted: Msg[] = res.data.messages.map((m: any) => ({
          id: m._id || Date.now() + Math.random(),
          who: m.sender === 'user' ? 'user' : 'shanaya',
          text: m.message,
          time: m.createdAt,
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  // Auth Handler: Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword || !authName) {
      setAuthError('Please fill in all required fields.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/model-user/register`, {
        email: authEmail.trim(),
        password: authPassword,
        name: authName.trim(),
        gender: authGender,
        hostSlug: HOST_SLUG,
      });

      if (res.data?.status && res.data.token) {
        const newToken = res.data.token;
        const newUser = res.data.user;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('shanaya_jwt_token', newToken);
        localStorage.setItem('shanaya_user', JSON.stringify(newUser));
        patch({ name: newUser.name });
        setAuthModalOpen(false);
        setToast(res.data?.message || `Welcome to Shanaya's world, ${newUser.name}! +${newUser.credits ?? 100} Free Credits added! ✨`);
        fetchHistory(newToken);
        fetchWallet(newToken);
      } else {
        setAuthError(res.data?.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      const raw = err.response?.data?.message || err.message || '';
      // Show a clean message if email already registered
      if (raw.toLowerCase().includes('already exists') || raw.toLowerCase().includes('already registered')) {
        setAuthError('This email is already registered. Please switch to Log In.');
        setAuthMode('login');
      } else {
        setAuthError(raw || 'Registration failed. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth Handler: Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError('Please enter your email and password.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/model-user/login`, {
        email: authEmail.trim(),
        password: authPassword,
        hostSlug: HOST_SLUG,
      });

      if (res.data?.status && res.data.token) {
        const newToken = res.data.token;
        const loggedUser = res.data.user;
        setToken(newToken);
        setUser(loggedUser);
        localStorage.setItem('shanaya_jwt_token', newToken);
        localStorage.setItem('shanaya_user', JSON.stringify(loggedUser));
        patch({ name: loggedUser.name });
        setAuthModalOpen(false);
        setToast(`Welcome back, ${loggedUser.name}! (${loggedUser.credits ?? 0} Credits) 💗`);
        fetchHistory(newToken);
        fetchWallet(newToken);
      } else {
        setAuthError(res.data?.message || 'Invalid credentials');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('shanaya_jwt_token');
    localStorage.removeItem('shanaya_user');
    setToken(null);
    setUser(null);
    patch({ name: 'Guest' });
    setMessages([{ id: 1, who: 'shanaya', text: 'Hey, you. ✨ What kind of evening are we creating today?' }]);
    setToast('Logged out successfully.');
  };

  // Reset Chat Conversation Handler
  const handleResetChat = async () => {
    if (!window.confirm('Reset this entire conversation with Shanaya?')) return;
    if (token) {
      try {
        await axios.post(
          `${API_BASE}/api/model-user/reset`,
          { hostSlug: HOST_SLUG },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Reset error:', err);
      }
    }
    setMessages([{ id: Date.now(), who: 'shanaya', text: 'Conversation refreshed. What shall we talk about next? ✨' }]);
    setToast('Chat history cleared.');
  };

  // Send Message Handler (Live Backend API)
  const send = async (text = draft) => {
    const clean = text.trim();
    if (!clean || typing) return;

    // Check if user is authenticated
    if (!token) {
      setAuthMode('login');
      setAuthModalOpen(true);
      setToast('Please log in or register to chat with Shanaya!');
      return;
    }

    // Check credits before sending
    const currentCreds = user?.credits ?? 0;
    const requiredRate = rates.chatCreditRate || 5;
    if (requiredRate > 0 && currentCreds < requiredRate) {
      setToast(`Insufficient credits! You need ${requiredRate} credits to send a message (Balance: ${currentCreds}).`);
      return;
    }

    setDraft('');
    const userMsgId = Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, who: 'user', text: clean }]);
    setTyping(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/model-user/chat`,
        { message: clean, hostSlug: HOST_SLUG },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.status && res.data.reply) {
        if (res.data.creditsRemaining !== undefined) {
          setUser((u) => {
            if (!u) return u;
            const up = { ...u, credits: res.data.creditsRemaining };
            localStorage.setItem('shanaya_user', JSON.stringify(up));
            return up;
          });
        }
        setMessages((prev) => [
          ...prev,
          { id: res.data.hostMessage?._id || Date.now() + 1, who: 'shanaya', text: res.data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            who: 'shanaya',
            text: 'I loved reading that. Let’s talk a little more about it tonight. ✨',
          },
        ]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      if (err.response?.status === 402 || err.response?.data?.insufficientCredits) {
        const errMsg = err.response?.data?.message || `Insufficient credits! You need ${requiredRate} credits to send a message.`;
        setToast(errMsg);
      } else {
        const errMsg = err.response?.data?.message || 'Could not reach Shanaya right now. Please try again.';
        setToast(`Error: ${errMsg}`);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          who: 'shanaya',
          text: 'I am here listening, but my connection flickered for a second. Say that again? 💗',
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const photoCount = saved.unlocked.filter((id) => media.find((m) => m.id === id)?.type === 'photo').length;
  const videoCount = saved.unlocked.filter((id) => media.find((m) => m.id === id)?.type === 'video').length;
  const tier = tiers.find((t) => t.name === saved.plan)!;
  const allowed = (m: Media) => tiers.findIndex((t) => t.name === saved.plan) >= tiers.findIndex((t) => t.name === m.tier);

  const unlock = async (m: Media) => {
    if (saved.unlocked.includes(m.id)) {
      setToast('Already unlocked — enjoy your Moment.');
      return;
    }
    if (!token) {
      setAuthMode('login');
      setAuthModalOpen(true);
      setToast('Please sign in or register to unlock Exclusive Moments!');
      return;
    }

    const cost = m.type === 'video' ? rates.exclusiveVideoRate : rates.exclusivePhotoRate;
    const currentBal = user?.credits ?? 0;
    if (cost > 0 && currentBal < cost) {
      setToast(`Insufficient credits! Required: ${cost} credits. Your balance: ${currentBal}.`);
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/api/model-user/unlock-media`,
        { mediaId: m.id, type: m.type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.status) {
        patch({ unlocked: [...saved.unlocked, m.id] });
        if (res.data.credits !== undefined) {
          setUser((u) => {
            if (!u) return u;
            const updated = {
              ...u,
              credits: res.data.credits,
              unlockedExclusiveMedia: res.data.unlockedExclusiveMedia || [...(u.unlockedExclusiveMedia || []), m.id],
            };
            localStorage.setItem('shanaya_user', JSON.stringify(updated));
            return updated;
          });
        }
        setToast(`Unlocked "${m.title}" with ${res.data.creditsDeducted || cost} credits! ✨`);
        fetchWallet(token);
      } else {
        setToast(res.data?.message || 'Failed to unlock media');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to unlock media';
      setToast(msg);
    }
  };

  const fav = (id: string) => {
    patch({
      favorites: saved.favorites.includes(id) ? saved.favorites.filter((v) => v !== id) : [...saved.favorites, id],
    });
  };

  const remind = (id: string) => {
    patch({
      reminders: saved.reminders.includes(id) ? saved.reminders.filter((v) => v !== id) : [...saved.reminders, id],
    });
    setToast(saved.reminders.includes(id) ? 'Reminder removed.' : 'Reminder saved!');
  };

  const filtered = media.filter(
    (m) =>
      (filter === 'All' || m.type === (filter === 'Photos' ? 'photo' : 'video')) &&
      (tab === 'all' || (tab === 'unlocked' ? saved.unlocked.includes(m.id) : saved.favorites.includes(m.id))) &&
      (m.title + ' ' + m.collection).toLowerCase().includes(search.toLowerCase())
  );

  const title: { [k in Page]: string } = {
    home: 'Home',
    chat: 'Chat',
    moments: 'Exclusive',
    discover: 'Discover',
    membership: 'Membership',
    profile: 'Profile',
  };

  return (
    <div className="min-h-screen bg-midnight text-ivory">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(126,73,106,.14),transparent_45%)]" />

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[248px] flex-col border-r border-white/10 bg-[#1d1723] px-5 py-7 lg:flex">
        <button onClick={() => navigate('home')} className="mb-8 text-left">
          <div className="flex items-center gap-3">
            <img
              src={SHANAYA_AVATAR}
              alt="Shanaya"
              className="h-10 w-10 rounded-full border border-rose/40 object-cover shadow-sm"
            />
            <div>
              <div className="font-serif text-3xl font-semibold tracking-wide">
                Shanaya<span className="text-rose">.</span>
              </div>
              <p className="text-[10px] tracking-[.18em] text-blush/70">YOUR PRIVATE WORLD</p>
            </div>
          </div>
        </button>

        <nav className="space-y-2">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                page === n.id ? 'bg-plum text-blush' : 'text-[#c0b5c2] hover:bg-white/5 hover:text-ivory'
              }`}
            >
              <n.icon size={19} />
              {n.label}
            </button>
          ))}
          <button
            onClick={() => navigate('membership')}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ${
              page === 'membership' ? 'bg-plum text-champagne' : 'text-champagne hover:bg-white/5'
            }`}
          >
            <Crown size={19} />
            Membership
          </button>
        </nav>

        {/* Auth status badge in sidebar */}
        <div className="mt-auto">
          {token && user ? (
            <div className="rounded-2xl border border-white/10 bg-[#241c2c] p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-blush">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="rounded p-1 text-[#8f8292] hover:text-rose"
                >
                  <LogOut size={14} />
                </button>
              </div>
              <p className="mt-1 truncate text-[11px] text-[#8f8292]">{user.email}</p>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose/30 bg-plum/40 px-3 py-2.5 text-xs font-medium text-blush transition hover:bg-plum"
            >
              <LogIn size={15} />
              Log In / Register
            </button>
          )}

          <div className="mt-3 rounded-3xl border border-rose/20 bg-gradient-to-br from-plum to-[#251b2c] p-4">
            <Sparkles className="mb-2 text-champagne" size={20} />
            <p className="font-serif text-xl">Private World</p>
            <p className="mt-1 text-xs leading-relaxed text-[#c9b9c8]">
              Exclusive conversations, moments, and stories — just for you.
            </p>
          </div>
          <p className="mt-4 text-center text-[10px] text-[#8f8292]">SHANAYA JOSHI · 25Y · BENGALURU</p>
        </div>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-white/10 bg-[#17131eea] px-5 backdrop-blur-xl sm:px-8 lg:ml-[248px] lg:h-[82px] lg:px-10">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
              {title[page]}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {token && user && (
            <button
              onClick={() => navigate('profile')}
              className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 shadow-sm transition hover:bg-amber-500/20"
              title="Your Live Credits"
            >
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span>{user.credits ?? 0}</span>
              <span className="hidden sm:inline text-[10px] text-amber-300/70">Credits</span>
            </button>
          )}

          <span className="hidden rounded-full border border-champagne/25 px-3 py-1 text-xs text-champagne sm:inline">
            {saved.plan}
          </span>
          <button
            aria-label="Notifications"
            onClick={() => setShowNotice(true)}
            className="relative rounded-full bg-charcoal p-3 text-blush"
          >
            <Bell size={18} />
            {saved.reminders.length > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose" />
            )}
          </button>

          {token && user ? (
            <button
              onClick={() => navigate('profile')}
              title={`Profile of ${user.name}`}
              className="grid h-10 w-10 place-items-center rounded-full bg-rose font-serif text-xl font-bold text-midnight shadow"
            >
              {user.name.slice(0, 1).toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-full border border-rose/40 bg-plum/60 px-4 py-2 text-xs font-medium text-blush transition hover:bg-plum"
            >
              <LogIn size={15} />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative mx-auto max-w-[1500px] px-4 pb-28 pt-6 sm:px-8 lg:ml-[248px] lg:px-10 lg:pb-12 lg:pt-9">
        {/* HOME PAGE */}
        {page === 'home' && (
          <div className="space-y-8">
            <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
              <section className="relative min-h-[350px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#5a344b] via-[#35253f] to-[#1b1621] p-7 shadow-glow sm:min-h-[420px] sm:p-10">
                <div className="absolute -right-12 top-2 h-[350px] w-[350px] rounded-full bg-rose/15 blur-3xl" />
                <div className="relative z-10 flex h-full max-w-md flex-col justify-center">
                  <Pill>YOUR STORY STARTS HERE</Pill>
                  <h2 className="mt-5 font-serif text-5xl leading-[.95] sm:text-6xl">
                    A little closer,<br />
                    <em className="text-blush">every day.</em>
                  </h2>
                  <p className="mt-5 max-w-sm text-sm leading-7 text-[#e0d1df]">
                    Romantic conversations, curious stories, and exclusive little moments — connected directly with Shanaya.
                  </p>
                  <button
                    className="btn btn-primary mt-7 flex w-fit items-center gap-2"
                    onClick={() => navigate('chat')}
                  >
                    Talk to Shanaya <ArrowRight size={18} />
                  </button>
                </div>
                <img
                  src={SHANAYA_AVATAR}
                  alt="Shanaya"
                  className="absolute bottom-0 right-0 hidden h-full max-h-[420px] w-auto max-w-[280px] rounded-r-[28px] object-cover object-top opacity-90 shadow-2xl sm:block"
                  style={{ maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0))', WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0))' }}
                />
              </section>

              <section className="panel flex flex-col justify-between p-6 sm:p-8">
                <div>
                  <div className="flex items-center gap-2 text-xs tracking-widest text-champagne">
                    <Sparkles size={15} /> TODAY'S SPARK
                  </div>
                  <h3 className="mt-6 font-serif text-4xl leading-tight">What are you in the mood for?</h3>
                  <p className="muted mt-3 text-sm">Pick a spark. Let the live conversation unfold.</p>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  {[
                    ['💗', 'Romance'],
                    ['✨', 'Surprise me'],
                    ['🌙', 'Late-night talk'],
                    ['📖', 'A story'],
                  ].map(([e, t]) => (
                    <button
                      key={t}
                      onClick={() => {
                        navigate('chat');
                        send(t);
                      }}
                      className="rounded-2xl border border-white/10 bg-charcoal p-4 text-left transition hover:border-rose/50"
                    >
                      <span className="text-xl">{e}</span>
                      <p className="mt-2 text-sm font-medium">{t}</p>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <Metric
                label="YOUR MEMBERSHIP"
                value={saved.plan}
                icon={<Crown />}
                detail="Explore your benefits"
                onClick={() => navigate('membership')}
              />
              <Metric
                label="PHOTO CREDITS LEFT"
                value={`${Math.max(0, tier.photos - photoCount)} / ${tier.photos}`}
                icon={<ImageIcon />}
                detail="Explore Exclusive"
                onClick={() => navigate('moments')}
              />
              <Metric
                label="VIDEO CREDITS LEFT"
                value={`${Math.max(0, tier.videos - videoCount)} / ${tier.videos}`}
                icon={<Video />}
                detail="View video diaries"
                onClick={() => navigate('moments')}
              />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs tracking-[.18em] text-rose">JUST FOR YOU</p>
                <h2 className="mt-1 font-serif text-4xl">Featured Moments</h2>
              </div>
              <button onClick={() => navigate('moments')} className="text-sm text-blush">
                View all →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {media.slice(0, 3).map((m) => (
                <MediaCard
                  key={m.id}
                  m={m}
                  unlocked={saved.unlocked.includes(m.id)}
                  favorite={saved.favorites.includes(m.id)}
                  onOpen={() => setSelected(m)}
                  onFav={() => fav(m.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* CHAT PAGE (LIVE AI API) */}
        {page === 'chat' && (
          <div className="mx-auto flex h-[calc(100dvh-190px)] min-h-[480px] max-w-[900px] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#211a28] lg:h-[calc(100dvh-160px)]">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={SHANAYA_AVATAR}
                    alt="Shanaya"
                    className="h-11 w-11 rounded-full border border-rose/40 object-cover"
                  />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#211a28] bg-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-ivory">
                    Shanaya Joshi
                  </p>
                  <p className="text-xs text-[#bdb0bf]">
                    {token && user ? `Chatting with ${user.name}` : 'Sign in to chat'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  title="Clear conversation"
                  onClick={handleResetChat}
                  className="rounded-xl p-2 text-lavender hover:bg-white/10"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="scrollbar flex-1 space-y-5 overflow-y-auto p-4 sm:p-7">
              <div className="mx-auto mb-5 w-fit rounded-full border border-white/10 bg-midnight/40 px-3.5 py-1 text-[11px] text-lavender">
                🔒 Private conversation with Shanaya
              </div>

              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-[20px] px-4 py-3 text-sm leading-7 sm:max-w-[70%] ${
                      m.who === 'user'
                        ? 'rounded-br-sm bg-rose text-midnight'
                        : 'rounded-bl-sm bg-plum text-ivory'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-plum px-5 py-3 text-blush">
                    <Loader2 size={16} className="animate-spin text-rose" />
                    <span>Shanaya is thinking…</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick Sparks & Chat Input */}
            <div className="border-t border-white/10 p-3 sm:p-5">
              <div className="scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
                {['Aap kaisi ho?', 'Tell me something romantic', 'Let’s talk about today', 'Surprise me ✨'].map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      disabled={typing}
                      className="chip text-blush transition hover:bg-plum"
                    >
                      {s}
                    </button>
                  )
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-charcoal p-2 pl-4 transition focus-within:border-rose focus-within:ring-1 focus-within:ring-rose/30"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={token ? 'Message Shanaya…' : 'Sign in to message Shanaya…'}
                  aria-label="Message Shanaya"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ivory outline-none focus:outline-none focus:ring-0 focus-visible:outline-none placeholder:text-[#99899c]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || typing}
                  aria-label="Send message"
                  className="grid h-11 w-11 place-items-center rounded-xl bg-rose text-midnight disabled:opacity-40"
                >
                  <ArrowUp size={19} />
                </button>
              </form>

              <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-[#99899c]">
                <span>
                  {token && user ? (
                    <span className="text-amber-300 font-medium">Your Balance: {user.credits ?? 0} Credits</span>
                  ) : (
                    <span>Register to get 100 Welcome Free Credits</span>
                  )}
                </span>
                <span className="text-rose/80">{rates.chatCreditRate || 5} credits per message</span>
              </div>


            </div>
          </div>
        )}

        {/* EXCLUSIVE VAULT (PAID CREDIT-UNLOCKED CONTENT) */}
        {page === 'moments' && (
          <div className="mx-auto max-w-4xl space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col items-center justify-between gap-4 border-b border-white/10 pb-6 text-center sm:flex-row sm:text-left">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-amber-300">
                  <LockKeyhole size={13} />
                  <span>EXCLUSIVE VAULT · UNLOCK WITH CREDITS</span>
                </div>
                <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Shanaya’s Exclusive</h2>
                <p className="mt-2 text-sm text-[#bdb0bf]">
                  Private photos, behind-the-scenes moments, and exclusive videos. Unlock once with your credits to keep forever.
                </p>
              </div>

              {/* Wallet Credits Pill & Top-Up Shortcut */}
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-[#211a28] px-4 py-2 text-right">
                  <div className="text-[10px] uppercase tracking-wider text-[#a89aa9]">Your Credits</div>
                  <div className="font-serif text-xl font-bold text-amber-300 flex items-center gap-1.5 justify-end">
                    <Sparkles size={16} className="text-amber-400 animate-pulse" />
                    <span>{user?.credits ?? 0}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('membership')}
                  className="btn btn-primary rounded-2xl px-4 py-2.5 text-xs font-semibold"
                >
                  + Add Credits
                </button>
              </div>
            </div>

            {/* Content Grid */}
            {exclusiveLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="animate-spin text-rose mb-3" size={32} />
                <p className="text-sm text-[#bdb0bf]">Loading exclusive media...</p>
              </div>
            ) : exclusivePosts.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#211a28] p-12 text-center">
                <div className="relative mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
                  <LockKeyhole size={28} />
                </div>
                <h3 className="font-serif text-2xl text-ivory">Exclusive Content Arriving Soon</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#bdb0bf]">
                  Shanaya is curating exclusive private photos and moments for this vault. In the meantime, explore her 100% free Discover feed!
                </p>
                <button
                  onClick={() => setPage('discover')}
                  className="btn btn-primary mt-6 rounded-full px-6 py-2.5 text-sm font-semibold"
                >
                  Explore Free Discover Feed
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {exclusivePosts.map((post) => {
                  const isUnlocked = Array.isArray(user?.unlockedExclusiveMedia) && user.unlockedExclusiveMedia.includes(post._id);
                  const isUnlockingThis = unlockingId === post._id;
                  const cost = Number(post.creditCost) || 20;
                  const mediaList = getPostMediaList(post);
                  const isCarousel = mediaList.length > 1;
                  const activeIdx = (carouselIndices[post._id] || 0) % (mediaList.length || 1);
                  const currentMedia = mediaList[activeIdx] || post.mediaUrl;
                  const isCurrentVideo = post.type === 'video' || (typeof currentMedia === 'string' && (currentMedia.endsWith('.mp4') || currentMedia.endsWith('.mov') || currentMedia.endsWith('.webm')));

                  return (
                    <div
                      key={post._id}
                      className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#1d1723] transition hover:border-rose/30 shadow-lg"
                    >
                      {/* Media Container */}
                      <div
                        className="relative aspect-[4/5] w-full overflow-hidden bg-black select-none cursor-pointer"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={(e) => handleTouchEnd(e, post._id, mediaList.length, activeIdx)}
                      >
                        {isUnlocked ? (
                          // UNLOCKED: Show real photo or video (with carousel controls if multiple)
                          <>
                            {isCurrentVideo ? (
                              <video
                                key={currentMedia}
                                src={resolvePostMedia(currentMedia)}
                                controls
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <img
                                key={currentMedia}
                                src={resolvePostMedia(currentMedia)}
                                alt={post.title}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            )}

                            {isCarousel && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCarouselIndices((prev) => ({
                                      ...prev,
                                      [post._id]: (activeIdx - 1 + mediaList.length) % mediaList.length,
                                    }));
                                  }}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/90 active:scale-95 shadow-md"
                                  aria-label="Previous slide"
                                >
                                  <ChevronLeft size={18} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCarouselIndices((prev) => ({
                                      ...prev,
                                      [post._id]: (activeIdx + 1) % mediaList.length,
                                    }));
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/90 active:scale-95 shadow-md"
                                  aria-label="Next slide"
                                >
                                  <ChevronRight size={18} />
                                </button>
                                {/* Dots */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 backdrop-blur-md">
                                  {mediaList.map((_, idx) => (
                                    <span
                                      key={idx}
                                      className={`h-1.5 rounded-full transition-all ${
                                        idx === activeIdx ? 'w-3.5 bg-rose' : 'w-1.5 bg-white/50'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          // LOCKED: Blurred Teaser
                          <>
                            <img
                              src={resolvePostMedia(post.mediaUrl)}
                              alt="Locked preview"
                              className="h-full w-full object-cover filter blur-xl scale-110 opacity-40"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-sm">
                              <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-xl">
                                <LockKeyhole size={26} />
                              </div>
                              <span className="rounded-full bg-amber-500/20 border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider">
                                {cost} Credits
                              </span>
                              <h4 className="mt-3 font-serif text-lg font-semibold text-ivory line-clamp-1">
                                {post.title || 'Private Moment'}
                              </h4>
                              <p className="mt-1 text-xs text-[#a99aaa] line-clamp-2 max-w-xs">
                                {post.description || 'Unlock to view this private photo/video.'}
                              </p>
                              <button
                                disabled={isUnlockingThis}
                                onClick={() => handleUnlockMedia(post)}
                                className="mt-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose px-5 py-2.5 text-xs font-bold text-midnight shadow-lg transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                              >
                                {isUnlockingThis ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Unlocking...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={14} />
                                    <span>Unlock Now ({cost} Credits)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}

                        {/* Top Badges */}
                        <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5">
                          <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                            {isCurrentVideo ? <Video size={12} className="text-amber-400" /> : <ImageIcon size={12} className="text-rose" />}
                            <span className="capitalize">{isCurrentVideo ? 'Video' : 'Photo'}</span>
                          </span>
                          {isCarousel && (
                            <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-champagne backdrop-blur-md">
                              <Layers size={11} />
                              <span>{isUnlocked ? `${activeIdx + 1} / ${mediaList.length}` : `${mediaList.length} items`}</span>
                            </span>
                          )}
                        </div>

                        {isUnlocked && (
                          <div className="absolute right-3 top-3 z-20">
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-bold text-white shadow-md">
                              <CheckCircle2 size={12} />
                              <span>UNLOCKED</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Info Footer (Shown when unlocked) */}
                      {isUnlocked && (
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-serif text-lg font-semibold text-ivory line-clamp-1">{post.title || 'Exclusive Moment'}</h4>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleLike(post)}
                                className={`flex items-center gap-1 text-xs transition ${
                                  (likesState[post._id]?.isLiked ?? post.likedByUsers?.includes(user?.email || 'user'))
                                    ? 'text-rose font-semibold'
                                    : 'text-ivory hover:text-rose'
                                }`}
                                aria-label="Like moment"
                              >
                                <Heart size={16} fill={(likesState[post._id]?.isLiked ?? post.likedByUsers?.includes(user?.email || 'user')) ? 'currentColor' : 'none'} />
                                <span>{likesState[post._id]?.count ?? (post.likesCount || 19)}</span>
                              </button>
                              <button
                                onClick={() => handleOpenComments(post)}
                                className="flex items-center gap-1 text-xs text-ivory hover:text-rose transition"
                                aria-label="Comment on moment"
                              >
                                <MessageCircle size={16} />
                                <span>{post.commentsCount ?? (post.comments ? post.comments.length : 3)}</span>
                              </button>
                            </div>
                          </div>
                          {post.description && (
                            <p className="mt-1 text-xs text-[#cbbbc9] leading-relaxed line-clamp-2">{post.description}</p>
                          )}
                          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-[#8f8292]">
                            <span className="text-emerald-400 font-medium">Unlocked in your collection</span>
                            <span>{new Date(post.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DISCOVER / FEED PAGE (INSTAGRAM-STYLE SCROLLABLE FEED) */}
        {page === 'discover' && (
          <div className="mx-auto max-w-2xl space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col items-center justify-between gap-4 border-b border-white/10 pb-6 text-center sm:flex-row sm:text-left">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  <Sparkles size={13} />
                  <span>PUBLIC FEED · 100% FREE</span>
                </div>
                <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Shanaya’s Moments</h2>
                <p className="mt-2 text-sm text-[#bdb0bf]">
                  Stories, photo journals, and video diaries directly from Shanaya. Free for everyone to watch.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#211a28] p-1">
                {(['all', 'photo', 'video'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFeedFilter(tab)}
                    className={`rounded-xl px-4 py-1.5 text-xs font-medium capitalize transition ${
                      feedFilter === tab
                        ? 'bg-rose text-midnight font-semibold shadow-sm'
                        : 'text-[#bdb0bf] hover:text-ivory'
                    }`}
                  >
                    {tab === 'all' ? 'All' : tab === 'photo' ? 'Photos' : 'Videos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed Posts (Instagram-style Cards) */}
            {feedLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 size={32} className="animate-spin text-rose" />
                <p className="mt-3 text-sm text-[#bdb0bf]">Loading Shanaya’s feed…</p>
              </div>
            ) : (
              <div className="space-y-8">
                {(feedPosts.length > 0
                  ? feedPosts
                  : [
                      {
                        _id: 'default-1',
                        hostSlug: HOST_SLUG,
                        title: 'Bangalore Nights & Quiet Moments ✨',
                        description:
                          'Sometimes the best evenings are the unhurried ones. Caught between cozy lights, good music, and endless thoughts.',
                        mediaUrl:
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1080&q=85',
                        type: 'photo' as const,
                        createdAt: new Date().toISOString(),
                      },
                      {
                        _id: 'default-2',
                        hostSlug: HOST_SLUG,
                        title: 'Indiranagar Coffee Run ☕',
                        description:
                          'Filtered coffee, little book shops, and warm conversation. What does your perfect Sunday look like?',
                        mediaUrl:
                          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1080&q=85',
                        type: 'photo' as const,
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                      },
                    ]
                )
                  .filter((p) => feedFilter === 'all' || p.type === feedFilter)
                  .map((post) => {
                    const postLikesCount = likesState[post._id]?.count ?? (post.likesCount || 38);
                    const postIsLiked = likesState[post._id]?.isLiked ?? (post.likedByUsers?.includes(user?.email || 'user') || postLikes[post._id] || false);
                    const postCommentsCount = post.commentsCount ?? (post.comments ? post.comments.length : 6);

                    const mediaList = getPostMediaList(post);
                    const isCarousel = mediaList.length > 1;
                    const activeIdx = (carouselIndices[post._id] || 0) % (mediaList.length || 1);
                    const currentMedia = mediaList[activeIdx] || post.mediaUrl;
                    const isCurrentVideo = post.type === 'video' || (typeof currentMedia === 'string' && (currentMedia.endsWith('.mp4') || currentMedia.endsWith('.mov') || currentMedia.endsWith('.webm')));

                    return (
                      <article
                        key={post._id}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-[#211a28] shadow-2xl transition hover:border-rose/30"
                      >
                        {/* Post Header (Avatar, Name, Location, Tag) */}
                        <div className="flex items-center justify-between px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={SHANAYA_AVATAR}
                                alt="Shanaya Joshi"
                                className="h-10 w-10 rounded-full border border-rose/50 object-cover ring-2 ring-rose/20"
                              />
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#211a28] bg-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-ivory">Shanaya Joshi</p>
                              <p className="flex items-center gap-1 text-[11px] text-[#a89aa9]">
                                <MapPin size={10} className="text-rose" /> Indiranagar, Bengaluru
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isCarousel && (
                              <span className="flex items-center gap-1 rounded-full border border-champagne/30 bg-champagne/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-champagne">
                                <Layers size={11} />
                                <span>Carousel</span>
                              </span>
                            )}
                            <span className="rounded-full border border-white/10 bg-midnight/50 px-2.5 py-1 text-[10px] uppercase tracking-wider text-champagne">
                              {isCurrentVideo ? 'Video' : 'Photo'}
                            </span>
                          </div>
                        </div>

                        {/* Media View (Image or Video) with Instagram Swipe Support */}
                        <div
                          className="relative bg-black group/carousel overflow-hidden select-none cursor-pointer"
                          onTouchStart={handleTouchStart}
                          onTouchEnd={(e) => handleTouchEnd(e, post._id, mediaList.length, activeIdx)}
                        >
                          {isCurrentVideo ? (
                            <video
                              key={currentMedia}
                              src={resolvePostMedia(currentMedia)}
                              controls
                              playsInline
                              preload="metadata"
                              className="max-h-[600px] w-full object-contain"
                            />
                          ) : (
                            <img
                              key={currentMedia}
                              src={resolvePostMedia(currentMedia)}
                              alt={post.title}
                              className="max-h-[620px] w-full object-cover transition-opacity duration-300"
                            />
                          )}

                          {isCarousel && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCarouselIndices((prev) => ({
                                    ...prev,
                                    [post._id]: (activeIdx - 1 + mediaList.length) % mediaList.length,
                                  }));
                                }}
                                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/90 active:scale-95 shadow-lg"
                                aria-label="Previous slide"
                              >
                                <ChevronLeft size={20} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCarouselIndices((prev) => ({
                                    ...prev,
                                    [post._id]: (activeIdx + 1) % mediaList.length,
                                  }));
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/90 active:scale-95 shadow-lg"
                                aria-label="Next slide"
                              >
                                <ChevronRight size={20} />
                              </button>

                              {/* Instagram-style Dots */}
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-md">
                                {mediaList.map((_, idx) => (
                                  <span
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      idx === activeIdx ? 'w-4 bg-rose' : 'w-1.5 bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>

                              {/* Instagram Slide Counter Badge */}
                              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-md">
                                <Layers size={11} className="text-rose" />
                                <span>{activeIdx + 1} / {mediaList.length}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Actions (Like, Comment, Share, Bookmark) */}
                        <div className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleToggleLike(post)}
                                className={`transition transform active:scale-125 ${
                                  postIsLiked ? 'text-rose font-semibold' : 'text-ivory hover:text-rose'
                                }`}
                                aria-label="Like post"
                              >
                                <Heart size={22} fill={postIsLiked ? 'currentColor' : 'none'} />
                              </button>

                              <button
                                onClick={() => handleOpenComments(post)}
                                className="text-ivory transition hover:text-rose"
                                title="View & Add comments"
                                aria-label="View comments"
                              >
                                <MessageCircle size={22} />
                              </button>

                              <button
                                onClick={() => {
                                  setDraft(`Loved your post "${post.title}"! `);
                                  setPage('chat');
                                }}
                                className="text-ivory transition hover:text-rose"
                                title="Reply in Chat with Shanaya"
                                aria-label="Reply in Chat"
                              >
                                <Share2 size={21} />
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                setToast('Moment bookmarked 🔖');
                              }}
                              className="text-ivory transition hover:text-champagne"
                              title="Bookmark"
                              aria-label="Bookmark"
                            >
                              <Bookmark size={21} />
                            </button>
                          </div>

                          {/* Likes & Comments Count Preview */}
                          <div className="mt-3 flex items-center gap-3 text-xs">
                            <span className="font-semibold text-ivory">
                              {postLikesCount.toLocaleString()} {postLikesCount === 1 ? 'like' : 'likes'}
                            </span>
                            <span className="text-white/20">•</span>
                            <button
                              onClick={() => handleOpenComments(post)}
                              className="text-[#baaabf] hover:text-ivory transition font-medium"
                            >
                              {postCommentsCount > 0 ? `View all ${postCommentsCount} comments` : 'Add comment...'}
                            </button>
                          </div>

                          {/* Post Title & Description */}
                          <div className="mt-4 space-y-1.5">
                            <p className="text-base font-semibold text-ivory">
                              {post.title}
                            </p>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-[#d4c5d5]">
                              {post.description}
                            </p>
                          </div>

                          {/* Bottom Row */}
                          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                            <span className="text-[11px] uppercase tracking-wider text-[#8e8191]">
                              {new Date(post.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>

                            <button
                              onClick={() => {
                                setDraft(`I just saw your "${post.title}" post! `);
                                setPage('chat');
                              }}
                              className="flex items-center gap-1.5 rounded-full border border-rose/30 bg-rose/10 px-3.5 py-1 text-xs font-medium text-rose transition hover:bg-rose hover:text-midnight"
                            >
                              <MessageCircle size={13} />
                              <span>Message Shanaya</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* MEMBERSHIP & CREDITS RECHARGE PAGE */}
        {page === 'membership' && (
          <div className="space-y-12">
            {/* 1. CREDIT RECHARGE PACKS */}
            <div className="rounded-3xl border border-rose/20 bg-gradient-to-b from-[#211728] to-[#18121f] p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-white/10">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    <Sparkles size={13} className="text-amber-400" />
                    <span>CREDIT PACKAGES</span>
                  </div>
                  <h3 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-ivory">
                    Recharge Your Credits
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[#bdb0bf]">
                    Credits are used in real-time to unlock exclusive media and chat with Shanaya.
                  </p>
                </div>

                {/* Current Balance */}
                <div className="rounded-2xl border border-white/10 bg-[#251b2d] px-5 py-3 text-right">
                  <div className="text-[10px] uppercase tracking-wider text-[#a89aa9]">Current Balance</div>
                  <div className="font-serif text-2xl font-bold text-amber-300 flex items-center gap-1.5 justify-end">
                    <Sparkles size={18} className="text-amber-400" />
                    <span>{user?.credits ?? 0}</span>
                    <span className="text-xs text-amber-300/70 font-sans">Credits</span>
                  </div>
                </div>
              </div>

              {creditPlansLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="animate-spin text-rose mx-auto mb-2" size={28} />
                  <p className="text-xs text-[#bdb0bf]">Loading credit packages...</p>
                </div>
              ) : creditPlans.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {creditPlans.map((plan: any) => {
                    const bonus = Number(plan.bonusCredits) || 0;
                    return (
                      <div
                        key={plan._id}
                        className={`flex flex-col justify-between rounded-3xl border p-6 transition ${
                          plan.isFeatured
                            ? 'border-amber-400/70 bg-gradient-to-b from-[#311f38] to-[#211627] shadow-glow'
                            : 'border-white/10 bg-[#241c2c] hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                              <Sparkles size={14} />
                              <span>{plan.credits} CREDITS</span>
                            </span>
                            {plan.isFeatured && (
                              <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                                Popular
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex items-baseline gap-2">
                            <span className="font-serif text-4xl font-bold text-ivory">₹{plan.price}</span>
                            {plan.actualPrice && plan.actualPrice > plan.price && (
                              <span className="text-sm text-[#8f8292] line-through">₹{plan.actualPrice}</span>
                            )}
                            {plan.discount > 0 && (
                              <span className="rounded-full bg-rose/20 border border-rose/30 px-2 py-0.5 text-[10px] font-bold text-rose">
                                {plan.discount}% OFF
                              </span>
                            )}
                          </div>

                          {bonus > 0 && (
                            <p className="mt-3 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={13} /> +{bonus} Free Bonus Credits
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (!token) {
                              setAuthMode('login');
                              setAuthModalOpen(true);
                              setToast('Please log in to recharge credits.');
                              return;
                            }
                            setUser((prev) => {
                              if (!prev) return prev;
                              const updated = {
                                ...prev,
                                credits: (Number(prev.credits) || 0) + plan.credits + bonus,
                              };
                              localStorage.setItem('shanaya_user', JSON.stringify(updated));
                              return updated;
                            });
                            setToast(`+${plan.credits + bonus} Credits added to your balance! ✨`);
                          }}
                          className={`mt-6 w-full rounded-full py-3 text-xs font-bold transition shadow-md ${
                            plan.isFeatured
                              ? 'bg-gradient-to-r from-amber-400 to-rose text-midnight hover:opacity-90 active:scale-95'
                              : 'border border-rose/40 bg-plum/40 text-blush hover:bg-plum active:scale-95'
                          }`}
                        >
                          Recharge ₹{plan.price}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#241c2c] p-6 text-center text-xs text-[#8f8292]">
                  No credit packages available at the moment. Create credit plans in Admin Panel &rarr; Plan &rarr; Credits Plan.
                </div>
              )}
            </div>

            {/* 2. MONTHLY MEMBERSHIP TIERS */}
            <div className="space-y-6">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-xs tracking-[.2em] text-champagne">THE SHANAYA EXPERIENCE</p>
                <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Monthly Subscriptions</h2>
                <p className="muted mt-2 text-sm">Or choose an all-inclusive VIP experience with monthly benefits.</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {tiers.map((t) => (
                  <div
                    key={t.name}
                    className={`flex flex-col rounded-[26px] border p-6 ${
                      t.name === 'Premium'
                        ? 'border-rose bg-gradient-to-b from-plum to-[#241c2b] shadow-glow'
                        : 'border-white/10 bg-[#231d2a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-3xl">{t.name}</h3>
                      {t.name === 'Premium' && <Pill>POPULAR</Pill>}
                    </div>
                    <div className="mt-5">
                      <span className="text-4xl font-bold">₹{t.price}</span>
                      <span className="muted text-sm"> / month</span>
                    </div>
                    <div className="my-6 h-px bg-white/10" />
                    <div className="flex-1 space-y-4">
                      {t.features.map((f) => (
                        <div key={f} className="flex items-start gap-3 text-sm">
                          <Check size={17} className="shrink-0 text-rose" />
                          {f}
                        </div>
                      ))}
                    </div>
                    <button
                      disabled={saved.plan === t.name}
                      onClick={() => setConfirmPlan(t.name)}
                      className={`btn mt-8 w-full ${t.name === 'Premium' ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {saved.plan === t.name ? 'Current plan' : 'Select ' + t.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROFILE PAGE */}
        {page === 'profile' && (
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-rose to-plum font-serif text-4xl shadow">
                {(user?.name || saved.name).slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-4xl">{user?.name || 'Guest User'}</h2>
                <p className="muted mt-1 text-sm">
                  {user ? `${user.email}` : 'Sign in to access your personal space.'}
                </p>
              </div>
              {token ? (
                <button
                  onClick={handleLogout}
                  className="btn btn-outline flex items-center gap-2 border-red-400/40 text-red-300 hover:bg-red-500/10"
                >
                  <LogOut size={16} /> Log Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <LogIn size={16} /> Sign In / Register
                </button>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Wallet & Free Credits Card */}
              <div className="panel space-y-5 p-6 border border-amber-400/30 bg-gradient-to-br from-[#2a1e35] via-[#21182a] to-[#18121f] rounded-3xl shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-midnight shadow-md">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ivory text-base">Wallet & Credits</h3>
                      <p className="text-[11px] text-[#baaabf]">Your private credits for chats & exclusive moments</p>
                    </div>
                  </div>
                  {token && (
                    <button
                      onClick={() => fetchWallet(token)}
                      className="rounded-full bg-white/5 p-2 text-xs text-[#baaabf] hover:text-white hover:bg-white/10 transition"
                      title="Refresh Balance"
                    >
                      <RotateCcw size={14} className={walletLoading ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>

                {/* Hero Balance Box */}
                <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-rose/10 p-5 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">Available Balance</span>
                        {user?.receivedWelcomeBonus && (
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            ✓ 100 Free Credits Claimed
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="font-serif text-5xl font-extrabold text-amber-300 tracking-tight">
                          {user?.credits ?? (token ? 0 : 100)}
                        </span>
                        <span className="text-sm font-semibold text-amber-300/80 uppercase tracking-wider">Credits</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('membership')}
                        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-rose px-5 py-2.5 text-xs font-bold text-midnight shadow-lg transition hover:opacity-95 active:scale-95"
                      >
                        <Sparkles size={14} />
                        <span>+ Add Credits</span>
                      </button>
                    </div>
                  </div>

                  {!token && (
                    <div className="mt-3 rounded-xl bg-amber-400/10 border border-amber-400/20 px-3 py-2 text-xs text-amber-200">
                      ✨ <strong>New User Bonus:</strong> Register now to claim your <strong>100 Free Credits</strong> instantly!
                    </div>
                  )}
                </div>

                {/* Recent Transactions Ledger */}
                {transactions.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-semibold text-ivory">Recent Transactions</span>
                      <span className="text-[10px] text-[#88788b]">{transactions.length} total entries</span>
                    </div>
                    <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                      {transactions.map((tx) => (
                        <div key={tx._id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${
                              tx.type === 'credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose/20 text-rose'
                            }`}>
                              {tx.type === 'credit' ? '+' : '-'}
                            </span>
                            <div>
                              <p className="font-medium text-ivory capitalize line-clamp-1">{tx.description || tx.category.replace('_', ' ')}</p>
                              <p className="text-[10px] text-[#88788b]">
                                {new Date(tx.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-rose'}`}>
                              {tx.type === 'credit' ? '+' : '-'}{tx.amount} Credits
                            </span>
                            <p className="text-[10px] text-[#88788b]">Bal: {tx.balanceAfter}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="panel space-y-4 p-6">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Crown size={18} className="text-champagne" /> Membership
                </h3>
                <p className="font-serif text-3xl">{saved.plan}</p>
                <p className="muted text-sm">
                  {tier.photos - photoCount} photo and {tier.videos - videoCount} video unlocks remaining.
                </p>
                <button className="btn btn-outline w-full" onClick={() => navigate('membership')}>
                  Manage membership
                </button>
              </div>

              <div className="panel space-y-5 p-6">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Settings2 size={18} className="text-rose" /> Preferences
                </h3>
                <Toggle
                  label="Allow saved memories"
                  description="Keep context between conversations with Shanaya."
                  checked={saved.memory}
                  onChange={(v) => patch({ memory: v })}
                />
                <Toggle
                  label="Release notifications"
                  description="Receive alerts when Shanaya posts new Moments."
                  checked={saved.notifications}
                  onChange={(v) => patch({ notifications: v })}
                />
              </div>

              <div className="panel space-y-4 p-6">
                <h3 className="flex items-center gap-2 font-semibold">
                  <ShieldCheck size={18} className="text-rose" /> Reset & Clear
                </h3>
                <p className="muted text-sm leading-6">
                  Clear local cache or reset your entire live conversation history with Shanaya.
                </p>
                <button
                  onClick={handleResetChat}
                  className="btn flex w-full items-center justify-center gap-2 border border-rose/30 text-blush hover:bg-plum/40"
                >
                  <RotateCcw size={16} /> Reset Chat History
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-white/10 bg-[#211a29ee] px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => navigate(n.id)}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] ${
              page === n.id ? 'text-blush' : 'text-[#a99aaa]'
            }`}
          >
            <n.icon size={21} strokeWidth={page === n.id ? 2.5 : 1.8} />
            {n.label}
          </button>
        ))}
      </nav>

      {/* INSTAGRAM-STYLE COMMENTS DRAWER / MODAL */}
      {activeCommentsPost && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveCommentsPost(null)}
        >
          <div
            className="relative flex flex-col w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#1d1723] shadow-2xl overflow-hidden max-h-[85vh] h-[550px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <MessageCircle size={18} className="text-rose" />
                <h3 className="font-serif text-lg font-semibold text-ivory">
                  Comments ({commentsList.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveCommentsPost(null)}
                className="rounded-full bg-white/5 p-1.5 text-lavender hover:bg-white/10 hover:text-white transition"
                aria-label="Close comments"
              >
                <X size={18} />
              </button>
            </div>

            {/* Post preview bar */}
            <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-5 py-3 flex-shrink-0">
              <img
                src={SHANAYA_AVATAR}
                alt="Shanaya"
                className="h-8 w-8 rounded-full border border-rose/30 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ivory line-clamp-1">{activeCommentsPost.title || 'Moment'}</p>
                <p className="text-[11px] text-[#99899c] line-clamp-1">{activeCommentsPost.description || 'Shared by Shanaya'}</p>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {commentsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#99899c]">
                  No comments yet. Be the first to say something sweet! 💕
                </div>
              ) : (
                commentsList.map((c, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-rose/30 to-purple-500/30 text-xs font-bold text-rose border border-rose/20 flex-shrink-0">
                      {(c.userName || 'U').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-ivory text-[11px]">{c.userName || 'User'}</span>
                        <span className="text-[10px] text-[#88788b]">
                          {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-[#e2d5e5] leading-relaxed">{c.text}</p>

                      {/* Creator Verified Reply */}
                      {c.reply?.text && (
                        <div className="mt-2.5 rounded-xl bg-gradient-to-r from-rose/15 to-purple-500/10 p-2.5 border border-rose/30">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-serif font-semibold text-rose text-[11px]">{c.reply.author || 'Shanaya'}</span>
                            <span className="rounded-full bg-rose/25 text-rose px-1.5 py-0.5 text-[9px] font-bold">Creator</span>
                            {c.reply.repliedAt && (
                              <span className="text-[9px] text-[#88788b] ml-auto">
                                {new Date(c.reply.repliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <p className="text-ivory text-[11px] leading-relaxed">{c.reply.text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="border-t border-white/10 p-3 bg-[#17121c] flex items-center gap-2 flex-shrink-0">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={user ? "Add a sweet comment..." : "Sign in or comment as guest..."}
                className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-ivory placeholder-[#88788b] outline-none focus:border-rose/50 transition"
              />
              <button
                type="submit"
                disabled={!commentInput.trim() || submittingComment}
                className="grid h-9 w-9 place-items-center rounded-full bg-rose text-midnight font-bold shadow-md hover:opacity-90 active:scale-95 disabled:opacity-40 transition flex-shrink-0"
                aria-label="Post comment"
              >
                {submittingComment ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AUTH MODAL (LOGIN & REGISTER) */}
      {authModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setAuthModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[28px] border border-rose/30 bg-[#211929] p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={SHANAYA_AVATAR}
                  alt="Shanaya"
                  className="h-8 w-8 rounded-full border border-rose/40 object-cover"
                />
                <span className="font-serif text-2xl font-bold">Shanaya<span className="text-rose">.</span></span>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="rounded-full bg-white/5 p-1.5 text-lavender hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex rounded-2xl bg-charcoal p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                  authMode === 'login' ? 'bg-rose text-midnight' : 'text-[#bbb0be] hover:text-ivory'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                  authMode === 'register' ? 'bg-rose text-midnight' : 'text-[#bbb0be] hover:text-ivory'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mt-4 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-xs text-red-300">
                {authError}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="mt-5 space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs text-lavender">Your Name</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-charcoal px-3.5 py-2.5 transition focus-within:border-rose focus-within:ring-1 focus-within:ring-rose/30">
                    <User size={16} className="text-blush shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                      className="w-full bg-transparent text-sm text-ivory outline-none focus:outline-none focus:ring-0 focus-visible:outline-none placeholder:text-[#8f8292]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-lavender">Email Address</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-charcoal px-3.5 py-2.5 transition focus-within:border-rose focus-within:ring-1 focus-within:ring-rose/30">
                  <Mail size={16} className="text-blush shrink-0" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm text-ivory outline-none focus:outline-none focus:ring-0 focus-visible:outline-none placeholder:text-[#8f8292]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-lavender">Password</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-charcoal px-3.5 py-2.5 transition focus-within:border-rose focus-within:ring-1 focus-within:ring-rose/30">
                  <KeyRound size={16} className="text-blush shrink-0" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm text-ivory outline-none focus:outline-none focus:ring-0 focus-visible:outline-none placeholder:text-[#8f8292]"
                  />
                </div>
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs text-lavender">Gender</label>
                  <div className="mt-1 flex gap-3">
                    {['male', 'female'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setAuthGender(g)}
                        className={`flex-1 rounded-xl border py-2 text-xs capitalize transition ${
                          authGender === g
                            ? 'border-rose bg-rose/20 text-rose font-medium'
                            : 'border-white/10 bg-charcoal text-[#c0b5c2]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="btn btn-primary mt-6 flex w-full items-center justify-center gap-2 py-3"
              >
                {authLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Please wait…
                  </>
                ) : authMode === 'login' ? (
                  <>
                    <LogIn size={16} /> Log In to Shanaya
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Create Account
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-[11px] text-[#8e8190]">
              {authMode === 'login' ? (
                <>
                  New to Shanaya?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError('');
                    }}
                    className="font-semibold text-blush underline"
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    className="font-semibold text-blush underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Media Detail Modal */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[95dvh] w-full max-w-3xl overflow-y-auto rounded-[26px] border border-white/15 bg-[#241c2b]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-52 overflow-hidden sm:h-72">
              <img src={selected.image} alt={selected.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#241c2b] to-transparent" />
              <button
                onClick={() => setSelected(null)}
                aria-label="Close details"
                className="absolute right-4 top-4 rounded-full bg-black/60 p-2"
              >
                <X />
              </button>
              <div className="absolute bottom-4 left-6">
                <Pill>{selected.collection}</Pill>
                <h2 className="mt-3 font-serif text-4xl">{selected.title}</h2>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div className="flex items-center gap-3 text-sm text-lavender">
                <span className="capitalize">{selected.type}</span>
                <span>·</span>
                <span>{selected.tier}</span>
                {selected.duration && <span>· {selected.duration}</span>}
              </div>
              <p className="muted">{selected.description}</p>
              <div className="rounded-2xl border border-white/10 bg-charcoal p-4 text-sm">
                {saved.unlocked.includes(selected.id) ? (
                  <span className="flex items-center gap-2 text-[#a4d7b9]">
                    <CheckCircle2 size={18} /> Unlocked in this browser.
                  </span>
                ) : (
                  <>
                    <p className="flex items-center gap-2">
                      <LockKeyhole size={17} className="text-rose" /> Unlock this {selected.type} with 1 credit
                    </p>
                    <p className="muted mt-2">
                      {allowed(selected)
                        ? `${selected.type === 'photo' ? Math.max(0, tier.photos - photoCount) : Math.max(0, tier.videos - videoCount)} credits remaining on ${saved.plan}.`
                        : `Requires ${selected.tier} or higher.`}
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => fav(selected.id)} className="btn btn-outline flex items-center gap-2">
                  <Heart size={17} fill={saved.favorites.includes(selected.id) ? 'currentColor' : 'none'} />
                  {saved.favorites.includes(selected.id) ? 'Saved' : 'Favourite'}
                </button>
                {!saved.unlocked.includes(selected.id) && (
                  <button
                    onClick={() => unlock(selected)}
                    className="btn btn-primary flex flex-1 items-center justify-center gap-2"
                  >
                    {allowed(selected) ? 'Unlock with 1 credit' : 'View memberships'} <ArrowRight size={17} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Switch Modal */}
      {confirmPlan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setConfirmPlan(null)}
        >
          <div className="panel w-full max-w-md space-y-5 p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between">
              <Crown className="text-champagne" />
              <button onClick={() => setConfirmPlan(null)} aria-label="Close">
                <X />
              </button>
            </div>
            <h2 className="font-serif text-4xl">Switch to {confirmPlan}?</h2>
            <p className="muted text-sm leading-6">
              This changes your tier privileges for Moments and releases.
            </p>
            <button
              className="btn btn-primary w-full"
              onClick={() => {
                patch({ plan: confirmPlan });
                setConfirmPlan(null);
                setToast(`Membership changed to ${confirmPlan}.`);
              }}
            >
              Confirm plan switch
            </button>
            <button className="btn btn-ghost w-full" onClick={() => setConfirmPlan(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/65"
          onClick={() => setShowNotice(false)}
        >
          <div className="h-full w-full max-w-sm overflow-y-auto border-l border-white/10 bg-[#211a29] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl">Notifications</h2>
              <button onClick={() => setShowNotice(false)} aria-label="Close notifications">
                <X />
              </button>
            </div>
            <p className="muted mt-3 text-sm">Your saved release reminders</p>
            <div className="mt-6 space-y-3">
              {saved.reminders.length ? (
                saved.reminders.map((id) => {
                  const r = releases.find((r) => r.id === id);
                  return r ? (
                    <div key={id} className="rounded-2xl bg-charcoal p-4">
                      <p className="font-semibold">{r.title}</p>
                      <p className="muted mt-1 text-xs">{formatDate(r.date)}</p>
                      <button className="mt-3 text-xs text-rose" onClick={() => remind(id)}>
                        Remove reminder
                      </button>
                    </div>
                  ) : null;
                })
              ) : (
                <p className="muted rounded-2xl border border-white/10 p-5 text-sm">
                  No reminders saved yet. Explore upcoming releases in Discover.
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setShowNotice(false);
                navigate('discover');
              }}
              className="btn btn-primary mt-6 w-full"
            >
              Explore releases
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[60] w-[max-content] max-w-[90vw] -translate-x-1/2 rounded-2xl border border-rose/30 bg-plum px-5 py-3 text-center text-sm shadow-2xl lg:bottom-8"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  detail,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="panel flex items-center gap-4 p-5 text-left transition hover:border-rose/40">
      <div className="rounded-2xl bg-plum p-3 text-blush">{icon}</div>
      <div>
        <p className="text-[10px] tracking-[.16em] text-lavender">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-blush">{detail} →</p>
      </div>
    </button>
  );
}

function Quota({
  label,
  used,
  max,
  icon,
}: {
  label: string;
  used: number;
  max: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="panel space-y-3 p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-blush">
          {icon}
          {label}
        </span>
        <span className="text-sm font-semibold">{Math.max(0, max - used)} left</span>
      </div>
      <div className="range">
        <div style={{ width: `${Math.min(100, (used / max) * 100)}%` }} />
      </div>
      <p className="text-xs text-lavender">{used} of {max} used</p>
    </div>
  );
}

function MediaCard({
  m,
  unlocked,
  favorite,
  onOpen,
  onFav,
}: {
  m: Media;
  unlocked: boolean;
  favorite: boolean;
  onOpen: () => void;
  onFav: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-[22px] border border-white/10 bg-[#241e2b] transition hover:border-rose/40">
      <div
        className="cover relative aspect-[4/4.7] cursor-pointer bg-plum"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onOpen();
        }}
        aria-label={`View ${m.title}`}
      >
        <img src={m.image} alt={`Editorial preview for ${m.title}`} loading="lazy" />
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-midnight/80 px-2.5 py-1 text-[10px] text-ivory">
          {m.type === 'video' ? <Play size={12} /> : <ImageIcon size={12} />} {m.type === 'video' ? 'VIDEO' : 'PHOTO'}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          aria-label={favorite ? 'Remove favourite' : 'Add favourite'}
          className="absolute right-3 top-3 z-10 rounded-full bg-midnight/70 p-2 text-blush"
        >
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <div className="absolute bottom-3 left-3 z-10">
          {unlocked ? (
            <span className="flex items-center gap-1 rounded-full bg-[#244a3a]/90 px-2.5 py-1 text-[10px] text-[#c1f0d1]">
              <Check size={12} /> UNLOCKED
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-midnight/80 px-2.5 py-1 text-[10px] text-blush">
              <LockKeyhole size={12} />
              {m.tier}
            </span>
          )}
        </div>
      </div>
      <button onClick={onOpen} className="w-full p-4 text-left">
        <h3 className="font-serif text-2xl leading-tight">{m.title}</h3>
        <p className="muted mt-1 text-xs">
          {m.collection}
          {m.duration ? ' · ' + m.duration : ''}
        </p>
      </button>
    </article>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="muted mt-1 text-xs leading-5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-rose' : 'bg-[#58485e]'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-ivory transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
