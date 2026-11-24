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
  Menu,
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
} from 'lucide-react';
import { media, releases, tiers, type Page, type Plan, type Media } from '../lib/data';

// Production API Base (proxied through next.config.ts or direct fallback)
const API_BASE = 'https://admin.quietchat.in';
const HOST_SLUG = 'shanaya-prototype';
const SHANAYA_AVATAR = 'https://admin.quietchat.in/storage/1788543557169.jpg';

interface LivePost {
  _id: string;
  hostSlug: string;
  title: string;
  description: string;
  mediaUrl: string;
  type: 'photo' | 'video';
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
  createdAt?: string;
};

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
  { id: 'moments', label: 'Moments', icon: Images },
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
  const [mobileMenu, setMobileMenu] = useState(false);
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
        params: { hostSlug: HOST_SLUG },
      });
      if (res.data?.status && Array.isArray(res.data.posts)) {
        setFeedPosts(res.data.posts);
      }
    } catch (e) {
      console.warn('Failed to load feed posts:', e);
    } finally {
      setFeedLoading(false);
    }
  };

  // Load saved state, token, and feed posts on mount
  useEffect(() => {
    fetchLivePosts();
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
    setMobileMenu(false);
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
        setToast(`Welcome to Shanaya's world, ${newUser.name}! ✨`);
        fetchHistory(newToken);
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
        setToast(`Welcome back, ${loggedUser.name}! 💗`);
        fetchHistory(newToken);
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
      const errMsg = err.response?.data?.message || 'Could not reach Shanaya right now. Please try again.';
      setToast(`Error: ${errMsg}`);
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

  const unlock = (m: Media) => {
    if (saved.unlocked.includes(m.id)) {
      setToast('Already unlocked — enjoy your Moment.');
      return;
    }
    if (!allowed(m)) {
      setSelected(null);
      navigate('membership');
      setToast(`${m.tier} membership required.`);
      return;
    }
    const remaining = m.type === 'photo' ? tier.photos - photoCount : tier.videos - videoCount;
    if (remaining <= 0) {
      setSelected(null);
      navigate('membership');
      setToast('Your quota is used up.');
      return;
    }
    patch({ unlocked: [...saved.unlocked, m.id] });
    setToast(`Unlocked ${m.title}!`);
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
    home: 'Your world',
    chat: 'Conversation',
    moments: 'Exclusive Moments',
    discover: 'Discover',
    membership: 'Membership',
    profile: 'Your profile',
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
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setMobileMenu(true)}>
            <Menu />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-[.2em] text-lavender">Shanaya / {title[page]}</p>
            <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
              {page === 'home' ? 'Hello, ' + (user?.name || saved.name) + ' ✨' : title[page]}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Mobile Drawer */}
      {mobileMenu && (
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setMobileMenu(false)}>
          <div className="h-full w-72 bg-[#211a29] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between">
              <span className="font-serif text-3xl">Shanaya.</span>
              <button onClick={() => setMobileMenu(false)} aria-label="Close menu">
                <X />
              </button>
            </div>
            {[...nav, { id: 'membership' as Page, label: 'Membership', icon: Crown }].map((n) => (
              <button
                key={n.id}
                onClick={() => navigate(n.id)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-plum"
              >
                <n.icon size={19} />
                {n.label}
              </button>
            ))}
            <div className="mt-8 border-t border-white/10 pt-4">
              {token && user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenu(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-rose hover:bg-white/5"
                >
                  <LogOut size={19} />
                  Log Out ({user.name})
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenu(false);
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-plum p-3 text-left text-blush"
                >
                  <LogIn size={19} />
                  Log In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                detail="Explore Moments"
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


            </div>
          </div>
        )}

        {/* MOMENTS PAGE */}
        {page === 'moments' && (
          <div className="space-y-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs tracking-[.2em] text-rose">THE COLLECTION</p>
                <h2 className="mt-2 font-serif text-5xl">Shanaya's Moments</h2>
                <p className="muted mt-2 text-sm">Stories, looks, and little surprises — curated for you.</p>
              </div>
              <button
                onClick={() => navigate('membership')}
                className="btn btn-outline flex items-center justify-center gap-2"
              >
                <Crown size={17} /> {saved.plan} membership
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Quota label="Photo unlocks" used={photoCount} max={tier.photos} icon={<ImageIcon size={19} />} />
              <Quota label="Video unlocks" used={videoCount} max={tier.videos} icon={<Video size={19} />} />
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {['All', 'Photos', 'Videos'].map((v) => (
                  <button key={v} onClick={() => setFilter(v)} className={`chip ${filter === v ? 'active' : 'text-blush'}`}>
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'unlocked', 'favorites'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setTab(v)}
                    className={`chip capitalize ${tab === v ? 'active' : 'text-blush'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="relative md:w-56">
                <Search size={16} className="absolute left-3 top-3.5 text-lavender" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input !py-2.5 !pl-9 text-sm"
                  placeholder="Search Moments"
                  aria-label="Search Moments"
                />
              </div>
            </div>

            {filtered.length ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((m) => (
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
            ) : (
              <div className="panel py-20 text-center">
                <Bookmark className="mx-auto mb-4 text-lavender" />
                <p>No Moments match your filters.</p>
                <button
                  className="mt-4 text-blush underline"
                  onClick={() => {
                    setTab('all');
                    setFilter('All');
                    setSearch('');
                  }}
                >
                  Reset filters
                </button>
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
                <div className="inline-flex items-center gap-2 rounded-full border border-rose/30 bg-rose/10 px-3 py-1 text-xs font-medium text-rose">
                  <Sparkles size={13} />
                  <span>EXCLUSIVE FEED</span>
                </div>
                <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Shanaya’s Moments</h2>
                <p className="mt-2 text-sm text-[#bdb0bf]">
                  Stories, photo journals, and video diaries directly from Shanaya.
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
                    const isLiked = postLikes[post._id];
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

                          <span className="rounded-full border border-white/10 bg-midnight/50 px-2.5 py-1 text-[10px] uppercase tracking-wider text-champagne">
                            {post.type}
                          </span>
                        </div>

                        {/* Media View (Image or Video) */}
                        <div className="relative bg-black">
                          {post.type === 'video' ? (
                            <video
                              src={resolvePostMedia(post.mediaUrl)}
                              controls
                              playsInline
                              preload="metadata"
                              className="max-h-[600px] w-full object-contain"
                            />
                          ) : (
                            <img
                              src={resolvePostMedia(post.mediaUrl)}
                              alt={post.title}
                              className="max-h-[620px] w-full object-cover"
                            />
                          )}
                        </div>

                        {/* Actions (Like, Comment, Share, Bookmark) */}
                        <div className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => {
                                  setPostLikes((prev) => ({ ...prev, [post._id]: !prev[post._id] }));
                                  setToast(isLiked ? 'Removed from favorites' : 'Saved to favorites ❤️');
                                }}
                                className={`transition transform active:scale-125 ${
                                  isLiked ? 'text-rose' : 'text-ivory hover:text-rose'
                                }`}
                                aria-label="Like post"
                              >
                                <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
                              </button>

                              <button
                                onClick={() => {
                                  setDraft(`Loved your post "${post.title}"! `);
                                  setPage('chat');
                                }}
                                className="text-ivory transition hover:text-rose"
                                title="Reply to Shanaya"
                                aria-label="Reply to Shanaya"
                              >
                                <MessageCircle size={22} />
                              </button>

                              <button
                                onClick={() => {
                                  if (typeof window !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(window.location.href);
                                    setToast('Link copied to clipboard ✨');
                                  }
                                }}
                                className="text-ivory transition hover:text-champagne"
                                title="Share"
                                aria-label="Share"
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

        {/* MEMBERSHIP PAGE */}
        {page === 'membership' && (
          <div className="space-y-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs tracking-[.2em] text-champagne">THE SHANAYA EXPERIENCE</p>
              <h2 className="mt-3 font-serif text-5xl sm:text-6xl">Make more moments yours.</h2>
              <p className="muted mt-4">Choose the experience that suits you.</p>
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
              <div className="panel space-y-4 p-6">
                <h3 className="flex items-center gap-2 font-semibold">
                  <UserRound size={18} className="text-rose" /> Account Details
                </h3>
                {user ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-lavender">Full Name:</span>
                      <p className="font-medium text-ivory">{user.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-lavender">Email:</span>
                      <p className="font-medium text-ivory">{user.email}</p>
                    </div>
                    <div>
                      <span className="text-xs text-lavender">Gender:</span>
                      <p className="font-medium capitalize text-ivory">{user.gender || 'Not specified'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="muted text-xs">
                    Please log in or create an account to view and update your details.
                  </p>
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
