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
  Pause,
  Volume2,
  VolumeX,
  Music2,
  ChevronUp,
  ChevronDown,
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
  Coins,
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

const sparks = [
  {
    icon: '💗',
    title: 'Romance',
    tag: 'Pyaar & Care',
    quote: 'Kuch baatein aisi hoti hain jo sirf raat ko hoti hain... Tum aur main. 💕',
    msg: 'Tell me something romantic, Shanaya 💕',
  },
  {
    icon: '✨',
    title: 'Flirty',
    tag: 'Shararat',
    quote: 'Aise dekhoge toh sach me sharma jaungi... Kya soch rahe ho? 😉✨',
    msg: 'Aise dekhoge toh sharma jaungi... kuch flirty batao 😉✨',
  },
  {
    icon: '🌙',
    title: 'Night Talk',
    tag: 'Gehari Baatein',
    quote: 'Neend nahi aa rahi na? Koi baat nahi, chalo thodi der baatein karte hain. 🌙',
    msg: 'Neend nahi aa rahi... chalo thodi der baatein karte hain 🌙',
  },
  {
    icon: '📖',
    title: 'A Secret',
    tag: 'Confession',
    quote: 'Ek aisi baat bataun jo maine abhi tak kisi ko nahi batayi? Promise keep it safe? 🤫',
    msg: 'Ek secret baat batao na jo kisi ko nahi batayi 📖',
  },
];

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [activeSparkIndex, setActiveSparkIndex] = useState<number>(0);
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

  // Full-screen Instagram Reels State & Autoplay
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playingState, setPlayingState] = useState<Record<string, boolean>>({});
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [heartBurst, setHeartBurst] = useState<string | null>(null);
  const [overlayIndicator, setOverlayIndicator] = useState<{ postId: string; type: 'play' | 'pause' } | null>(null);
  const feedContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const lastTapRef = useRef<{ time: number; postId: string }>({ time: 0, postId: '' });

  const handleFeedScroll = () => {
    if (!feedContainerRef.current) return;
    const { scrollTop, clientHeight } = feedContainerRef.current;
    if (clientHeight <= 0) return;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeReelIndex) {
      setActiveReelIndex(index);
    }
  };

  const scrollToReel = (index: number) => {
    if (!feedContainerRef.current) return;
    const clientHeight = feedContainerRef.current.clientHeight;
    feedContainerRef.current.scrollTo({
      top: index * clientHeight,
      behavior: 'smooth',
    });
    setActiveReelIndex(index);
  };

  const handleVideoTimeUpdate = (postId: string, e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.duration) {
      const pct = (v.currentTime / v.duration) * 100;
      setVideoProgress((prev) => ({ ...prev, [postId]: pct }));
    }
  };

  const handleMediaClick = (post: LivePost) => {
    const now = Date.now();
    if (now - lastTapRef.current.time < 300 && lastTapRef.current.postId === post._id) {
      // Double tap -> Like with floating heart animation!
      handleToggleLike(post);
      setHeartBurst(post._id);
      setTimeout(() => setHeartBurst(null), 850);
      lastTapRef.current = { time: 0, postId: '' };
      return;
    }
    lastTapRef.current = { time: now, postId: post._id };

    const mediaList = getPostMediaList(post);
    const activeIdx = (carouselIndices[post._id] || 0) % (mediaList.length || 1);
    const currentMedia = mediaList[activeIdx] || post.mediaUrl;
    const isVideo = post.type === 'video' || (typeof currentMedia === 'string' && (currentMedia.endsWith('.mp4') || currentMedia.endsWith('.mov') || currentMedia.endsWith('.webm')));

    if (isVideo) {
      const v = videoRefs.current[post._id];
      if (v) {
        if (v.paused) {
          v.play().catch(() => {});
          setPlayingState((prev) => ({ ...prev, [post._id]: true }));
          setOverlayIndicator({ postId: post._id, type: 'play' });
        } else {
          v.pause();
          setPlayingState((prev) => ({ ...prev, [post._id]: false }));
          setOverlayIndicator({ postId: post._id, type: 'pause' });
        }
        setTimeout(() => setOverlayIndicator(null), 600);
      }
    }
  };

  useEffect(() => {
    if (page !== 'discover') {
      Object.values(videoRefs.current).forEach((v) => {
        if (v && !v.paused) v.pause();
      });
      return;
    }

    const postsToDisplay = (feedPosts.length > 0
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
        ]
    ).filter((p) => feedFilter === 'all' || p.type === feedFilter);

    postsToDisplay.forEach((post, idx) => {
      const v = videoRefs.current[post._id];
      if (!v) return;

      if (idx === activeReelIndex) {
        v.currentTime = 0;
        v.muted = isMuted;
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setPlayingState((prev) => ({ ...prev, [post._id]: true }));
            })
            .catch(() => {
              v.muted = true;
              setIsMuted(true);
              v.play().catch(() => {});
            });
        }
      } else {
        if (!v.paused) {
          v.pause();
          v.currentTime = 0;
        }
        setPlayingState((prev) => ({ ...prev, [post._id]: false }));
      }
    });
  }, [activeReelIndex, page, feedPosts, feedFilter, isMuted]);

  useEffect(() => {
    if (page !== 'discover') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      const postsToDisplay = (feedPosts.length > 0 ? feedPosts : []).filter(
        (p) => feedFilter === 'all' || p.type === feedFilter
      );

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        if (activeReelIndex < postsToDisplay.length - 1) {
          scrollToReel(activeReelIndex + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        if (activeReelIndex > 0) {
          scrollToReel(activeReelIndex - 1);
        }
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        const activePost = postsToDisplay[activeReelIndex];
        if (activePost) {
          const v = videoRefs.current[activePost._id];
          if (v) {
            if (v.paused) {
              v.play().catch(() => {});
              setPlayingState((prev) => ({ ...prev, [activePost._id]: true }));
              setOverlayIndicator({ postId: activePost._id, type: 'play' });
            } else {
              v.pause();
              setPlayingState((prev) => ({ ...prev, [activePost._id]: false }));
              setOverlayIndicator({ postId: activePost._id, type: 'pause' });
            }
            setTimeout(() => setOverlayIndicator(null), 600);
          }
        }
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, activeReelIndex, feedPosts, feedFilter]);

  const syncLikesFromPosts = (posts: LivePost[], currentUser: UserProfile | null) => {
    const userIdentifier = String(currentUser?.email || (currentUser as any)?._id || (currentUser as any)?.id || '').trim();
    setLikesState((prev) => {
      const updated = { ...prev };
      posts.forEach((p) => {
        const count = typeof p.likesCount === 'number' ? p.likesCount : 0;
        const isLiked = Boolean(userIdentifier && Array.isArray(p.likedByUsers) && p.likedByUsers.includes(userIdentifier));
        updated[p._id] = { count, isLiked };
      });
      return updated;
    });
    setPostLikes((prev) => {
      const updated = { ...prev };
      posts.forEach((p) => {
        const isLiked = Boolean(userIdentifier && Array.isArray(p.likedByUsers) && p.likedByUsers.includes(userIdentifier));
        updated[p._id] = isLiked;
      });
      return updated;
    });
  };

  const handleToggleLike = async (post: LivePost) => {
    if (!token || !user) {
      setAuthMode('login');
      setAuthModalOpen(true);
      setToast('Please log in or register to like moments! ❤️');
      return;
    }

    const userIdentifier = String(user.email || (user as any)._id || (user as any).id || '').trim();
    if (!userIdentifier) {
      setAuthMode('login');
      setAuthModalOpen(true);
      setToast('Please log in or register to like moments! ❤️');
      return;
    }

    const currentLiked = likesState[post._id]?.isLiked ?? Boolean(Array.isArray(post.likedByUsers) && post.likedByUsers.includes(userIdentifier));
    const currentCount = likesState[post._id]?.count ?? (typeof post.likesCount === 'number' ? post.likesCount : 0);

    const nextIsLiked = !currentLiked;
    const nextCount = nextIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    // Optimistically update likesState & postLikes
    setLikesState((prev) => ({
      ...prev,
      [post._id]: { count: nextCount, isLiked: nextIsLiked },
    }));
    setPostLikes((prev) => ({ ...prev, [post._id]: nextIsLiked }));
    setToast(nextIsLiked ? 'Liked! ❤️' : 'Unliked');

    // Update in-memory lists
    const updatePostInList = (list: LivePost[]) =>
      list.map((p) => {
        if (p._id !== post._id) return p;
        const currentLikedUsers = Array.isArray(p.likedByUsers) ? p.likedByUsers : [];
        const nextLikedUsers = nextIsLiked
          ? (currentLikedUsers.includes(userIdentifier) ? currentLikedUsers : [...currentLikedUsers, userIdentifier])
          : currentLikedUsers.filter((u) => u !== userIdentifier);
        return {
          ...p,
          likesCount: nextCount,
          likedByUsers: nextLikedUsers,
        };
      });

    setFeedPosts((prev) => updatePostInList(prev));
    setExclusivePosts((prev) => updatePostInList(prev));

    try {
      const res = await axios.post(`${API_BASE}/api/model-media/like`, {
        postId: post._id,
        userId: userIdentifier,
        userName: user.name || 'User',
      });
      if (res.data?.status && typeof res.data.likesCount === 'number') {
        const confirmedCount = res.data.likesCount;
        const confirmedIsLiked = Boolean(res.data.isLiked);
        setLikesState((prev) => ({
          ...prev,
          [post._id]: { count: confirmedCount, isLiked: confirmedIsLiked },
        }));
        setPostLikes((prev) => ({ ...prev, [post._id]: confirmedIsLiked }));

        if (Array.isArray(res.data.likedByUsers)) {
          const confirmedLikedUsers = res.data.likedByUsers;
          const syncConfirmedInList = (list: LivePost[]) =>
            list.map((p) =>
              p._id === post._id
                ? { ...p, likesCount: confirmedCount, likedByUsers: confirmedLikedUsers }
                : p
            );
          setFeedPosts((prev) => syncConfirmedInList(prev));
          setExclusivePosts((prev) => syncConfirmedInList(prev));
        }
      }
    } catch (e: any) {
      console.warn('Like sync error:', e);
      // Revert optimistic state on error
      setLikesState((prev) => ({
        ...prev,
        [post._id]: { count: currentCount, isLiked: currentLiked },
      }));
      setPostLikes((prev) => ({ ...prev, [post._id]: currentLiked }));
      setToast('Unable to update like. Please try again.');
    }
  };

  const handleOpenComments = async (post: LivePost) => {
    setActiveCommentsPost(post);
    setCommentsList(Array.isArray(post.comments) ? post.comments : []);
    try {
      const res = await axios.get(`${API_BASE}/api/model-media/comments?postId=${post._id}`);
      if (res.data?.status && Array.isArray(res.data.comments)) {
        setCommentsList(res.data.comments);
      }
    } catch (e) {
      console.warn('Fetch comments error:', e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) {
      setAuthMode('login');
      setAuthModalOpen(true);
      setToast('Please log in or register to post a comment! 💕');
      return;
    }
    if (!activeCommentsPost || !commentInput.trim()) return;
    const text = commentInput.trim();
    const userIdentifier = String(user.email || (user as any)._id || (user as any).id || '').trim();
    setCommentInput('');
    setSubmittingComment(true);

    const newComment: CommentItem = {
      userName: user.name || 'You',
      userAvatar: user.avatar || '',
      text,
      createdAt: new Date().toISOString(),
    };
    setCommentsList((prev) => [...prev, newComment]);

    const updateCommentInList = (list: LivePost[]) =>
      list.map((p) =>
        p._id === activeCommentsPost._id
          ? {
              ...p,
              commentsCount: (typeof p.commentsCount === 'number' ? p.commentsCount : (p.comments?.length || 0)) + 1,
              comments: [...(p.comments || []), newComment],
            }
          : p
      );

    setFeedPosts((prev) => updateCommentInList(prev));
    setExclusivePosts((prev) => updateCommentInList(prev));

    try {
      const res = await axios.post(`${API_BASE}/api/model-media/comment`, {
        postId: activeCommentsPost._id,
        text,
        userId: userIdentifier,
        userName: user.name || 'You',
        userAvatar: user.avatar || '',
      });
      if (res.data?.status) {
        setToast('Comment posted! 💬');
        if (Array.isArray(res.data.comments)) {
          setCommentsList(res.data.comments);
        }
      }
    } catch (e) {
      console.warn('Add comment error:', e);
      setToast('Failed to post comment. Please try again.');
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
        syncLikesFromPosts(discoverOnly, user);
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
        syncLikesFromPosts(exclusiveOnly, user);
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

      // Immediate chat history restore from local cache on refresh
      const cachedChat = localStorage.getItem('shanaya_chat_history');
      if (cachedChat) {
        const parsedChat = JSON.parse(cachedChat);
        if (Array.isArray(parsedChat) && parsedChat.length > 0) {
          setMessages(parsedChat);
        }
      }

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
    const allPosts = [...feedPosts, ...exclusivePosts];
    if (allPosts.length > 0) {
      syncLikesFromPosts(allPosts, user);
    }
  }, [user]);

  useEffect(() => {
    if (ready) localStorage.setItem('shanaya-demo-v1', JSON.stringify(saved));
  }, [saved, ready]);

  // Persist chat messages to localStorage whenever messages update
  useEffect(() => {
    if (ready && messages.length > 0) {
      try {
        localStorage.setItem('shanaya_chat_history', JSON.stringify(messages));
      } catch (e) {
        // ignore
      }
    }
  }, [messages, ready]);

  useEffect(() => {
    if (page === 'chat') endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, page]);

  // Live Auto-Refresh Wallet & Credits (When page changes, tab focused, or interval)
  useEffect(() => {
    if (token) {
      fetchWallet(token);
    }
  }, [page, token]);

  useEffect(() => {
    const handleFocus = () => {
      if (token) fetchWallet(token);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => {
      fetchWallet(token);
    }, 15000);
    return () => clearInterval(timer);
  }, [token]);

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
      const chatList = res.data?.chats || res.data?.messages || [];
      if (res.data?.status && Array.isArray(chatList) && chatList.length > 0) {
        const formatted: Msg[] = chatList.map((m: any) => ({
          id: m._id || `${Date.now()}-${Math.random()}`,
          who: (m.sender === 'user' ? 'user' : 'shanaya') as 'user' | 'shanaya',
          text: m.message || m.text || '',
          time: m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined,
        }));
        setMessages(formatted);
        try {
          localStorage.setItem('shanaya_chat_history', JSON.stringify(formatted));
        } catch (e) {}
      } else if (res.data?.status && Array.isArray(chatList) && chatList.length === 0) {
        setMessages([{ id: 1, who: 'shanaya', text: 'Hey, you. ✨ What kind of evening are we creating today?' }]);
        try {
          localStorage.removeItem('shanaya_chat_history');
        } catch (e) {}
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
    localStorage.removeItem('shanaya_chat_history');
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
    const fresh: Msg[] = [
      { id: Date.now(), who: 'shanaya', text: 'Conversation refreshed. What shall we talk about next? ✨' },
    ];
    setMessages(fresh);
    try {
      localStorage.setItem('shanaya_chat_history', JSON.stringify(fresh));
    } catch (e) {}
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
    membership: 'Get Credits',
    profile: 'Profile',
  };

  return (
    <div
      className={`bg-midnight text-ivory ${
        page === 'chat' || page === 'discover'
          ? 'h-[100dvh] overflow-hidden'
          : 'min-h-screen'
      }`}
    >
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
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
              page === 'membership' ? 'bg-plum text-amber-300 font-semibold' : 'text-amber-300/80 hover:bg-white/5'
            }`}
          >
            <Coins size={19} className="text-amber-400" />
            Get Credits
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
          {/* Compact Coin Balance (Only Icon + Available Number) */}
          <button
            onClick={() => navigate('membership')}
            className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-300 transition hover:bg-amber-400/25 active:scale-95"
            title="Available Credits"
          >
            <Coins size={14} className="text-amber-400" />
            <span>{token && user ? (user.credits ?? 0) : 0}</span>
          </button>

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
      <main
        className={`relative mx-auto max-w-[1500px] ${
          page === 'discover' || page === 'chat'
            ? 'p-0 overflow-hidden h-[calc(100dvh-70px-64px)] lg:h-[calc(100vh-82px)] lg:py-3 lg:px-6 flex items-center justify-center'
            : 'px-4 pb-28 pt-6 sm:px-8 lg:px-10 lg:pb-12 lg:pt-9'
        } lg:ml-[248px]`}
      >
        {/* HOME PAGE */}
        {page === 'home' && (
          <div className="space-y-8 pb-10">
            {/* 1. Live Status & Quick Chat Strip (Hinglish vibe) */}
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#211a28]/80 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={SHANAYA_AVATAR}
                    alt="Shanaya"
                    className="h-10 w-10 rounded-full border border-rose/50 object-cover shadow"
                  />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#211a28] bg-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wide text-ivory">Shanaya Joshi</span>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online Now
                    </span>
                  </div>
                  <p className="text-xs text-[#c9b9c8]">
                    <MapPin size={11} className="inline text-rose mr-1" />
                    Bengaluru · <span className="italic">"Coffee ke sath baithi hoon, aao kuch baatein karein... ☕️✨"</span>
                  </p>
                </div>
              </div>

              {/* Quick Chat Triggers in Hinglish */}
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
                {[
                  ['👋 Aap kaisi ho?', 'Aap kaisi ho? Aaj ka din kaisa raha? ✨'],
                  ['💖 Kuch romantic baatein', 'Mujhe kuch romantic sunao na... 💕'],
                  ['🌙 Aaj raat ka plan?', 'Aaj raat ka kya plan hai tumhara? 🌙'],
                  ['✨ Surprise me', 'Surprise me with something sweet! ✨'],
                ].map(([label, msg]) => (
                  <button
                    key={label}
                    onClick={() => {
                      navigate('chat');
                      send(msg);
                    }}
                    className="flex-shrink-0 whitespace-nowrap rounded-full border border-rose/30 bg-plum/40 px-3.5 py-1.5 text-xs font-medium text-blush transition hover:bg-rose hover:text-midnight active:scale-95"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Ultra-Luxury Hero Section & Interactive Chemistry Spark */}
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              {/* HERO BANNER CARD (Shanaya portrait visible on BOTH mobile and desktop) */}
              <section className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-white/15 bg-gradient-to-br from-[#4c213b] via-[#26172d] to-[#140f1a] p-6 sm:p-9 shadow-2xl flex flex-col justify-between min-h-[460px]">
                {/* Ambient Glows */}
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-rose/25 blur-3xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 h-52 w-52 rounded-full bg-purple-900/30 blur-2xl pointer-events-none" />

                {/* Top VIP Tag & Online Pill */}
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-rose/40 bg-black/40 px-3.5 py-1 text-[11px] font-bold text-blush tracking-wider uppercase backdrop-blur-md">
                    ✨ VIP PRIVATE WORLD · EXCLUSIVE
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400 backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live & Active
                  </span>
                </div>

                {/* Mobile & Desktop Content + Shanaya's Portrait */}
                <div className="relative z-10 my-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  {/* Left Column: Heading & Copy */}
                  <div className="max-w-md">
                    <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.02] text-white">
                      Har roz thoda aur,<br />
                      <em className="text-blush font-serif italic">kareeb.</em>
                    </h2>
                    <p className="mt-4 text-xs sm:text-sm leading-6 sm:leading-7 text-[#e0d1df]">
                      Late night intimate baatein, curious stories aur private moments — judiye seedhe Shanaya ke sath bina kisi judgement ke.
                    </p>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        className="btn btn-primary flex items-center gap-2 shadow-lg shadow-rose/25 hover:scale-105 active:scale-95 transition"
                        onClick={() => navigate('chat')}
                      >
                        Talk to Shanaya <ArrowRight size={17} />
                      </button>
                      <button
                        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-semibold text-ivory backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                        onClick={() => navigate('discover')}
                      >
                        <Play size={14} className="fill-white" /> Watch Reels
                      </button>
                    </div>
                  </div>

                  {/* Shanaya's Featured Portrait Card (PROMINENT ON BOTH MOBILE & DESKTOP) */}
                  <div className="relative mx-auto sm:mx-0 flex-shrink-0">
                    <div className="relative h-64 w-52 sm:h-72 sm:w-56 lg:h-80 lg:w-60 overflow-hidden rounded-[24px] border-2 border-rose/40 shadow-2xl group">
                      <img
                        src={SHANAYA_AVATAR}
                        alt="Shanaya Joshi"
                        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                      {/* Floating Creator Info in Card */}
                      <div className="absolute bottom-3 left-3 right-3 text-left pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          <p className="font-serif font-bold text-sm text-white drop-shadow">Shanaya Joshi</p>
                          <span className="text-[10px] text-amber-300">✨</span>
                        </div>
                        <p className="text-[10px] text-white/80 italic line-clamp-1">
                          "Aaj raat tumse baatein karni hain..."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Trust/Location Strip */}
                <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#bdaabf]">
                  <span>🔒 100% Private & Confidential 1-on-1 Chat</span>
                  <span className="text-rose font-medium">Bengaluru · 25Y</span>
                </div>
              </section>

              {/* INTERACTIVE CHEMISTRY & MOOD SPARK CARD */}
              <section className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-white/15 bg-gradient-to-br from-[#2a1b32] via-[#201526] to-[#160f1b] p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-champagne">
                    <Sparkles size={15} /> CHEMISTRY SPARK · AAJ KIS MOOD ME HO?
                  </div>
                  <h3 className="mt-3 font-serif text-2xl sm:text-3xl leading-snug text-white">
                    Pick a mood. <span className="text-blush italic">Shanaya reply karegi.</span>
                  </h3>
                  <p className="mt-1.5 text-xs text-[#bdaabf]">
                    Niche kisi bhi mood par tap karein aur instant conversation shuru karein:
                  </p>

                  {/* 4 Mood Selector Chips/Buttons */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    {sparks.map((spark, idx) => {
                      const isSelected = activeSparkIndex === idx;
                      return (
                        <button
                          key={spark.title}
                          onClick={() => setActiveSparkIndex(idx)}
                          className={`rounded-2xl p-3 text-left transition-all ${
                            isSelected
                              ? 'border-2 border-rose bg-rose/15 shadow-md shadow-rose/20'
                              : 'border border-white/10 bg-charcoal/80 hover:border-white/25 hover:bg-plum/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xl">{spark.icon}</span>
                            <span className="text-[10px] text-[#99899c] font-medium">{spark.tag}</span>
                          </div>
                          <p className={`mt-1.5 text-xs font-bold ${isSelected ? 'text-rose' : 'text-ivory'}`}>
                            {spark.title}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Live Teaser Preview Box for Selected Mood */}
                <div className="mt-5 rounded-2xl border border-rose/30 bg-[#1e1525]/90 p-4 shadow-inner">
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={SHANAYA_AVATAR}
                        alt="Shanaya"
                        className="h-9 w-9 rounded-full border border-rose/50 object-cover shadow"
                      />
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#1e1525] bg-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Shanaya</span>
                        <span className="text-[10px] text-[#a99aaa]">typing preview...</span>
                      </div>
                      <p className="mt-1 text-xs text-blush leading-relaxed italic">
                        "{sparks[activeSparkIndex]?.quote}"
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigate('chat');
                      send(sparks[activeSparkIndex]?.msg);
                    }}
                    className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose to-[#a65275] py-2.5 text-xs font-bold text-midnight shadow transition hover:scale-[1.02] active:scale-98"
                  >
                    <span>Start {sparks[activeSparkIndex]?.title} Chat</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </section>
            </div>

            {/* 3. Shanaya's Latest Discover Moments (Real Reels / Photos from backend) */}
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[.18em] text-rose">DISCOVER FEED · TAZA PAL ✨</p>
                  <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Latest Moments & Reels</h2>
                </div>
                <button
                  onClick={() => navigate('discover')}
                  className="flex items-center gap-1 text-sm font-medium text-blush hover:underline"
                >
                  View all reels <ArrowRight size={15} />
                </button>
              </div>

              {feedPosts.length > 0 ? (
                <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                  {feedPosts.slice(0, 6).map((post) => {
                    const mediaList = getPostMediaList(post);
                    const rawUrl = mediaList[0] || post.mediaUrl || '';
                    const resolvedMedia = resolvePostMedia(rawUrl);
                    const isVideo =
                      post.type === 'video' ||
                      (typeof rawUrl === 'string' &&
                        (rawUrl.endsWith('.mp4') || rawUrl.endsWith('.mov') || rawUrl.endsWith('.webm')));

                    return (
                      <div
                        key={post._id}
                        onClick={() => navigate('discover')}
                        className="group relative h-[260px] w-[180px] sm:h-[300px] sm:w-[210px] flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-charcoal shadow-lg transition hover:scale-[1.02] hover:border-rose/60"
                      >
                        {isVideo ? (
                          <>
                            <video
                              src={`${resolvedMedia}#t=0.001`}
                              preload="metadata"
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                            />
                            {/* Center Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/20 shadow-lg group-hover:scale-110 transition">
                                <Play size={16} className="fill-white translate-x-0.5" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <img
                            src={resolvedMedia}
                            alt={post.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = SHANAYA_AVATAR;
                            }}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                        {/* Post Type Badge */}
                        <div className="absolute left-3 top-3 z-10 pointer-events-none">
                          <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                            {isVideo ? <Video size={11} className="text-rose" /> : <ImageIcon size={11} className="text-champagne" />}
                            {isVideo ? 'Reel' : 'Photo'}
                          </span>
                        </div>

                        {/* Bottom Info */}
                        <div className="absolute bottom-3 left-3 right-3 text-left z-10 pointer-events-none">
                          <p className="line-clamp-2 text-xs font-semibold text-ivory group-hover:text-blush transition">
                            {post.title}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-white/70">
                            <span className="flex items-center gap-1">
                              <Heart size={11} className="text-rose" /> {post.likesCount ?? post.likedByUsers?.length ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle size={11} /> {post.commentsCount ?? post.comments?.length ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-charcoal/40 p-6 text-center text-xs text-[#99899c]">
                  New reels & moments update ho rahe hain. Discover tab me jaake check karein!
                </div>
              )}
            </div>

            {/* 4. Question of the Day / Shanaya ki Dil ki Baat (Intimate Hinglish Card) */}
            <div className="relative overflow-hidden rounded-[26px] border border-rose/30 bg-gradient-to-r from-[#3f2136] via-[#2a1b2f] to-[#1e1726] p-6 sm:p-8 shadow-glow">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-rose/20 blur-2xl" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-champagne">
                    <Sparkles size={14} /> SHANAYA'S QUESTION · AAJ KA SAWAAL 💭
                  </div>
                  <h3 className="mt-3 font-serif text-2xl sm:text-3xl text-ivory leading-snug">
                    "Agar aaj raat hum dono sath hote, toh humari perfect date kaisi hoti?"
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#e0d1df]">
                    Mujhe chat me aake batao na... Main aapke reply ka wait kar rahi hoon 💗
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate('chat');
                    send('Agar hum dono sath hote, toh meri perfect date aisi hoti... 💖');
                  }}
                  className="flex-shrink-0 flex items-center justify-center gap-2 rounded-full bg-rose px-6 py-3 text-xs font-bold text-midnight shadow-lg transition hover:scale-105 active:scale-95"
                >
                  <Send size={15} /> Answer Shanaya in Chat
                </button>
              </div>
            </div>

            {/* 5. Secret Vault Sneak-Peek (Exclusive Media from backend) */}
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[.18em] text-amber-400">EXCLUSIVE VAULT · SECRET CONTENT 🔒</p>
                  <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Private & Unseen Moments</h2>
                  <p className="mt-1 text-xs text-[#bdb0bf]">Khaas aapke liye locked photos aur video diaries. Credits se unlock karein.</p>
                </div>
                <button
                  onClick={() => navigate('moments')}
                  className="flex items-center gap-1 text-sm font-medium text-amber-300 hover:underline"
                >
                  Explore Vault <ArrowRight size={15} />
                </button>
              </div>

              {exclusivePosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {exclusivePosts.slice(0, 3).map((post) => {
                    const mediaList = getPostMediaList(post);
                    const rawUrl = mediaList[0] || post.mediaUrl || '';
                    const resolvedMedia = resolvePostMedia(rawUrl);

                    return (
                      <div
                        key={post._id}
                        onClick={() => navigate('moments')}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-400/20 bg-[#211a28] p-5 shadow-lg transition hover:border-amber-400/50 cursor-pointer"
                      >
                        <div className="relative h-44 w-full overflow-hidden rounded-xl bg-charcoal">
                          <img
                            src={resolvedMedia}
                            alt={post.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = SHANAYA_AVATAR;
                            }}
                            className="h-full w-full object-cover blur-[6px] filter transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 text-center p-3 pointer-events-none">
                            <div className="grid h-12 w-12 place-items-center rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-md">
                              <LockKeyhole size={20} />
                            </div>
                            <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                              {post.creditCost || 20} Credits to Unlock
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="font-semibold text-ivory text-sm group-hover:text-amber-300 transition line-clamp-1">
                            {post.title}
                          </h4>
                          <p className="mt-1 text-xs text-[#99899c] line-clamp-2">
                            {post.description || 'Exclusive private moment captured just for you.'}
                          </p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('moments');
                          }}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 py-2.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400 hover:text-midnight active:scale-95"
                        >
                          <LockKeyhole size={14} /> Unlock in Vault ✨
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#211a28] p-6 text-center text-xs text-[#99899c]">
                  Naye exclusive moments jald hi unlock hone wale hain!
                </div>
              )}
            </div>

            {/* 6. Quick Free Credits / Welcome Offer Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/10 bg-[#1e1826] p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex-shrink-0">
                  <Coins size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-ivory">
                    {token && user ? `Available Credits: ${user.credits ?? 0}` : 'New User Welcome Bonus: 100 Free Credits! ✨'}
                  </p>
                  <p className="text-xs text-[#99899c]">
                    {token && user
                      ? 'Shanaya se chat continue rakhne ke liye apne wallet ko recharge karein.'
                      : 'Free register karein aur turant 100 credits ke sath Shanaya se baat karein.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (token && user) {
                    navigate('membership');
                  } else {
                    setAuthMode('register');
                    setAuthModalOpen(true);
                  }
                }}
                className="flex-shrink-0 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500 to-rose px-5 py-2.5 text-xs font-bold text-midnight shadow transition hover:scale-105 active:scale-95"
              >
                {token && user ? '+ Add Credits' : 'Claim 100 Free Credits ✨'}
              </button>
            </div>
          </div>
        )}

        {/* CHAT PAGE (LIVE AI API) */}
        {page === 'chat' && (
          <div className="flex h-full w-full max-w-[900px] flex-col overflow-hidden rounded-none sm:rounded-[26px] border-0 sm:border border-white/10 bg-[#211a28] shadow-2xl">
            {/* Chat Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-[#211a28]/95 px-4 py-2.5 backdrop-blur-md sm:px-5 sm:py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={SHANAYA_AVATAR}
                    alt="Shanaya"
                    className="h-10 w-10 rounded-full border border-rose/40 object-cover sm:h-11 sm:w-11"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#211a28] bg-emerald-400 sm:h-3 sm:w-3" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ivory sm:text-base">
                    Shanaya Joshi
                  </p>
                  <p className="truncate text-xs text-[#bdb0bf]">
                    {typing ? (
                      <span className="flex items-center gap-1.5 font-medium text-rose animate-pulse">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose animate-ping" />
                        typing…
                      </span>
                    ) : token && user ? (
                      `Chatting with ${user.name}`
                    ) : (
                      'Sign in to chat'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1.5">
                <button
                  title="Clear conversation"
                  onClick={handleResetChat}
                  className="rounded-xl p-2 text-lavender transition hover:bg-white/10 active:scale-95"
                >
                  <RotateCcw size={17} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="scrollbar flex-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain p-3.5 sm:p-6">
              <div className="mx-auto mb-3 w-fit rounded-full border border-white/10 bg-midnight/40 px-3 py-1 text-[11px] text-lavender">
                🔒 Private conversation with Shanaya
              </div>

              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-[20px] px-4 py-2.5 text-sm leading-6 sm:max-w-[70%] sm:py-3 sm:leading-7 ${
                      m.who === 'user'
                        ? 'rounded-br-sm bg-rose font-medium text-midnight'
                        : 'rounded-bl-sm bg-plum text-ivory'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex items-end justify-start gap-2.5">
                  <img
                    src={SHANAYA_AVATAR}
                    alt="Shanaya"
                    className="mb-1 h-7 w-7 flex-shrink-0 rounded-full border border-rose/30 object-cover shadow-sm"
                  />
                  <div className="flex items-center gap-1.5 rounded-[20px] rounded-bl-sm bg-plum px-4 py-3 text-blush shadow-md">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick Sparks & Chat Input */}
            <div className="flex-shrink-0 border-t border-white/10 bg-[#211a28]/95 p-2.5 sm:p-4">
              <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto py-0.5">
                {['Aap kaisi ho?', 'Tell me something romantic', 'Let’s talk about today', 'Surprise me ✨'].map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      disabled={typing}
                      className="chip flex-shrink-0 whitespace-nowrap px-3 py-1 text-xs text-blush transition hover:bg-plum active:scale-95"
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
                className="flex items-center gap-2 rounded-full border border-white/15 bg-charcoal/95 px-3.5 py-1 shadow-inner transition focus-within:border-rose/70 focus-within:ring-1 focus-within:ring-rose/30"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={token ? 'Message Shanaya…' : 'Sign in to message Shanaya…'}
                  aria-label="Message Shanaya"
                  className="min-w-0 flex-1 bg-transparent py-1.5 text-base sm:text-sm text-ivory outline-none placeholder:text-[#99899c] focus:outline-none focus:ring-0 focus-visible:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || typing}
                  aria-label="Send message"
                  className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-rose text-midnight shadow transition hover:scale-105 active:scale-95 disabled:opacity-35"
                >
                  <ArrowUp size={16} />
                </button>
              </form>

              <div className="mt-1.5 flex items-center justify-between px-2 text-[11px] text-[#99899c]">
                <span>
                  {token && user ? (
                    <span className="font-medium text-amber-300">Your Balance: {user.credits ?? 0} Credits</span>
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
          <div className="mx-auto max-w-4xl space-y-8 pb-12 pt-2">
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
                  const postUserIdentifier = String(user?.email || (user as any)?._id || (user as any)?.id || '').trim();
                  const postIsLiked = likesState[post._id]?.isLiked ?? Boolean(postUserIdentifier && Array.isArray(post.likedByUsers) && post.likedByUsers.includes(postUserIdentifier));
                  const postLikesCount = likesState[post._id]?.count ?? (typeof post.likesCount === 'number' ? post.likesCount : 0);
                  const postCommentsCount = typeof post.commentsCount === 'number' ? post.commentsCount : (Array.isArray(post.comments) ? post.comments.length : 0);

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
                                  postIsLiked
                                    ? 'text-rose font-semibold'
                                    : 'text-ivory hover:text-rose'
                                }`}
                                aria-label="Like moment"
                              >
                                <Heart size={16} fill={postIsLiked ? 'currentColor' : 'none'} />
                                <span>{postLikesCount}</span>
                              </button>
                              <button
                                onClick={() => handleOpenComments(post)}
                                className="flex items-center gap-1 text-xs text-ivory hover:text-rose transition"
                                aria-label="Comment on moment"
                              >
                                <MessageCircle size={16} />
                                <span>{postCommentsCount}</span>
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

        {/* DISCOVER / REELS FEED PAGE (FULLSCREEN INSTAGRAM REELS EXPERIENCE) */}
        {page === 'discover' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {feedLoading ? (
              <div className="flex flex-col items-center justify-center h-full w-full py-20 text-center">
                <Loader2 size={36} className="animate-spin text-rose" />
                <p className="mt-3 text-sm text-[#bdb0bf]">Loading Shanaya’s Reels…</p>
              </div>
            ) : (
              <>
                {/* Floating Category Filter Pill (All / Reels / Photos) */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-1 backdrop-blur-md shadow-lg">
                  {(['all', 'video', 'photo'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setFeedFilter(cat);
                        setActiveReelIndex(0);
                        if (feedContainerRef.current) feedContainerRef.current.scrollTop = 0;
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        feedFilter === cat
                          ? 'bg-rose text-midnight shadow'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat === 'video' ? 'Reels' : 'Photos'}
                    </button>
                  ))}
                </div>

                {/* Desktop Up/Down Navigation Controls */}
                <div className="hidden lg:flex flex-col gap-3 absolute right-4 top-1/2 -translate-y-1/2 z-30">
                  <button
                    disabled={activeReelIndex === 0}
                    onClick={() => scrollToReel(activeReelIndex - 1)}
                    className="grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 transition hover:bg-black/90 active:scale-95 disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                    title="Previous Reel (Up Arrow / K)"
                  >
                    <ChevronUp size={24} />
                  </button>
                  <button
                    disabled={
                      activeReelIndex >=
                      (feedPosts.length > 0 ? feedPosts : []).filter(
                        (p) => feedFilter === 'all' || p.type === feedFilter
                      ).length - 1
                    }
                    onClick={() => scrollToReel(activeReelIndex + 1)}
                    className="grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 transition hover:bg-black/90 active:scale-95 disabled:opacity-20 disabled:pointer-events-none shadow-xl"
                    title="Next Reel (Down Arrow / J)"
                  >
                    <ChevronDown size={24} />
                  </button>
                </div>

                {/* Fullscreen Snap-Scroll Container */}
                <div
                  ref={feedContainerRef}
                  onScroll={handleFeedScroll}
                  className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar select-none bg-black lg:max-w-[420px] lg:h-[720px] lg:rounded-3xl lg:border lg:border-white/10 lg:shadow-2xl relative"
                >
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
                      ]
                  )
                    .filter((p) => feedFilter === 'all' || p.type === feedFilter)
                    .map((post, idx) => {
                      const mediaList = getPostMediaList(post);
                      const isCarousel = mediaList.length > 1;
                      const activeIdx = (carouselIndices[post._id] || 0) % (mediaList.length || 1);
                      const currentMedia = mediaList[activeIdx] || post.mediaUrl;
                      const isCurrentVideo =
                        post.type === 'video' ||
                        (typeof currentMedia === 'string' &&
                          (currentMedia.endsWith('.mp4') ||
                            currentMedia.endsWith('.mov') ||
                            currentMedia.endsWith('.webm')));
                      const postUserIdentifier = String(
                        user?.email || (user as any)?._id || (user as any)?.id || ''
                      ).trim();
                      const postIsLiked =
                        likesState[post._id]?.isLiked ??
                        Boolean(
                          postUserIdentifier &&
                            Array.isArray(post.likedByUsers) &&
                            post.likedByUsers.includes(postUserIdentifier)
                        );
                      const postLikesCount =
                        likesState[post._id]?.count ??
                        (typeof post.likesCount === 'number' ? post.likesCount : 0);
                      const postCommentsCount =
                        typeof post.commentsCount === 'number'
                          ? post.commentsCount
                          : Array.isArray(post.comments)
                          ? post.comments.length
                          : 0;
                      const isCurrentSlide = idx === activeReelIndex;

                      return (
                        <div
                          key={post._id}
                          className="relative w-full h-full snap-start snap-always shrink-0 flex items-center justify-center bg-black overflow-hidden select-none"
                          onClick={() => handleMediaClick(post)}
                          onTouchStart={handleTouchStart}
                          onTouchEnd={(e) => handleTouchEnd(e, post._id, mediaList.length, activeIdx)}
                        >
                          {/* Blurred background copy for cinematic padding */}
                          {isCurrentVideo ? (
                            <>
                              <video
                                src={resolvePostMedia(currentMedia)}
                                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                                muted
                                playsInline
                                loop
                              />
                              <video
                                ref={(el) => {
                                  videoRefs.current[post._id] = el;
                                }}
                                src={resolvePostMedia(currentMedia)}
                                playsInline
                                loop
                                muted={isMuted}
                                onTimeUpdate={(e) => handleVideoTimeUpdate(post._id, e)}
                                className="relative z-10 w-full h-full object-contain pointer-events-none"
                              />
                            </>
                          ) : (
                            <>
                              <img
                                src={resolvePostMedia(currentMedia)}
                                alt={post.title}
                                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                              />
                              <img
                                src={resolvePostMedia(currentMedia)}
                                alt={post.title}
                                className="relative z-10 w-full h-full object-contain pointer-events-none"
                              />
                            </>
                          )}

                          {/* Double Tap Heart Burst Animation */}
                          {heartBurst === post._id && (
                            <div className="absolute inset-0 z-40 grid place-items-center pointer-events-none animate-in zoom-in-50 fade-in duration-200">
                              <Heart
                                size={96}
                                className="text-[#ff2d55] fill-[#ff2d55] drop-shadow-2xl animate-pulse"
                              />
                            </div>
                          )}

                          {/* Play / Pause Tap Overlay Indicator */}
                          {overlayIndicator?.postId === post._id && (
                            <div className="absolute inset-0 z-40 grid place-items-center pointer-events-none animate-in fade-in zoom-in duration-150">
                              <div className="grid h-16 w-16 place-items-center rounded-full bg-black/60 backdrop-blur-md text-white shadow-2xl">
                                {overlayIndicator.type === 'play' ? (
                                  <Play size={32} className="ml-1" />
                                ) : (
                                  <Pause size={32} />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tap to Unmute Pill if Video is Muted on Active Slide */}
                          {isCurrentVideo && isMuted && isCurrentSlide && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(false);
                              }}
                              className="absolute top-14 left-4 z-30 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-lg border border-white/10 hover:bg-black/85 transition active:scale-95"
                            >
                              <VolumeX size={14} className="text-rose" />
                              <span>Tap for sound 🔊</span>
                            </button>
                          )}

                          {/* Carousel Horizontal Navigation Buttons */}
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
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80 active:scale-95"
                                aria-label="Previous image"
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
                                className="absolute right-14 top-1/2 -translate-y-1/2 z-20 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80 active:scale-95"
                                aria-label="Next image"
                              >
                                <ChevronRight size={18} />
                              </button>
                            </>
                          )}

                          {/* Dark Bottom Gradient for Text Legibility */}
                          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-10" />

                          {/* RIGHT ACTION COLUMN (Authentic Instagram Reels Floating Icons) */}
                          <div className="absolute right-3 bottom-14 z-20 flex flex-col items-center gap-5 pointer-events-auto">
                            {/* Like Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLike(post);
                              }}
                              className="flex flex-col items-center gap-1 group active:scale-125 transition-transform"
                              aria-label="Like post"
                            >
                              <Heart
                                size={28}
                                className={`transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                                  postIsLiked ? 'text-[#ff2d55] fill-[#ff2d55]' : 'text-white'
                                }`}
                              />
                              <span className="text-[11px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                {postLikesCount > 0 ? postLikesCount.toLocaleString() : '0'}
                              </span>
                            </button>

                            {/* Comment Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenComments(post);
                              }}
                              className="flex flex-col items-center gap-1 group active:scale-125 transition-transform"
                              aria-label="Comments"
                            >
                              <MessageCircle
                                size={28}
                                className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                              />
                              <span className="text-[11px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                {postCommentsCount > 0 ? postCommentsCount.toLocaleString() : '0'}
                              </span>
                            </button>

                            {/* Save / Bookmark Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setToast('Reel saved to your collection 🔖');
                              }}
                              className="flex flex-col items-center gap-1 group active:scale-125 transition-transform"
                              aria-label="Save reel"
                            >
                              <Bookmark
                                size={26}
                                className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                              />
                              <span className="text-[10px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                Save
                              </span>
                            </button>

                            {/* Sound Mute/Unmute Toggle */}
                            {isCurrentVideo && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsMuted(!isMuted);
                                }}
                                className="flex flex-col items-center gap-1 group active:scale-125 transition-transform"
                                aria-label="Toggle Sound"
                              >
                                {isMuted ? (
                                  <VolumeX
                                    size={24}
                                    className="text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                  />
                                ) : (
                                  <Volume2
                                    size={24}
                                    className="text-rose drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                  />
                                )}
                                <span className="text-[10px] font-semibold text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                  {isMuted ? 'Muted' : 'Sound'}
                                </span>
                              </button>
                            )}
                          </div>

                          {/* BOTTOM INFO OVERLAY */}
                          <div className="absolute left-4 right-16 bottom-5 z-20 text-left pointer-events-auto">
                            {/* Creator Profile & Action */}
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <img
                                  src={SHANAYA_AVATAR}
                                  alt="Shanaya Joshi"
                                  className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-lg"
                                />
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black bg-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white text-sm drop-shadow-md tracking-wide">
                                  Shanaya Joshi
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDraft(`Hey Shanaya! Watching your reel "${post.title}" 💖`);
                                    setPage('chat');
                                  }}
                                  className="rounded-full bg-rose px-3 py-1 text-[11px] font-bold text-midnight shadow transition hover:bg-rose/90 active:scale-95"
                                >
                                  Message
                                </button>
                              </div>
                            </div>

                            {/* Caption: Title & Description */}
                            <div className="mt-2.5">
                              <h3 className="text-sm font-bold text-white drop-shadow-md line-clamp-1">
                                {post.title}
                              </h3>
                              {post.description && (
                                <p className="mt-1 text-xs text-white/90 leading-relaxed drop-shadow-md">
                                  {expandedCaptions[post._id]
                                    ? post.description
                                    : post.description.slice(0, 85) +
                                      (post.description.length > 85 ? '...' : '')}
                                  {post.description.length > 85 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedCaptions((prev) => ({
                                          ...prev,
                                          [post._id]: !prev[post._id],
                                        }));
                                      }}
                                      className="text-rose font-bold ml-1.5 underline"
                                    >
                                      {expandedCaptions[post._id] ? 'less' : 'more'}
                                    </button>
                                  )}
                                </p>
                              )}
                            </div>

                            {/* Music / Audio Tag */}
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-white/80 font-medium">
                              <Music2 size={12} className="text-rose animate-pulse" />
                              <span className="drop-shadow-sm">Original audio · Shanaya Joshi</span>
                              <span className="text-white/40">•</span>
                              <span className="text-white/60">
                                {new Date(post.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </div>

                            {/* Carousel Dots */}
                            {isCarousel && (
                              <div className="mt-2.5 flex items-center gap-1.5">
                                {mediaList.map((_, i) => (
                                  <span
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      i === activeIdx ? 'w-4 bg-rose' : 'w-1.5 bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Thin Bottom Video Progress Bar */}
                          {isCurrentVideo && (
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 z-20 pointer-events-none">
                              <div
                                className="h-full bg-rose transition-all duration-150"
                                style={{ width: `${videoProgress[post._id] || 0}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
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
                    <span>{token && user ? (user.credits ?? 0) : 0}</span>
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
                          {token && user ? (user.credits ?? 0) : 0}
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
            {!token || !user ? (
              <div className="border-t border-white/10 p-3.5 bg-[#17121c] flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs text-[#baaabf]">
                  <LockKeyhole size={15} className="text-rose flex-shrink-0" />
                  <span>Log in to join the conversation and comment</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="rounded-full bg-rose px-4 py-1.5 text-xs font-semibold text-midnight hover:opacity-90 active:scale-95 transition shadow-sm flex-shrink-0"
                >
                  Log In / Sign Up
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddComment} className="border-t border-white/10 p-3 bg-[#17121c] flex items-center gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add a sweet comment for Shanaya..."
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
            )}
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
