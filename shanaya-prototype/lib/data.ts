export type Plan = 'Free' | 'Premium' | 'Premium Plus';
export type Page = 'home' | 'chat' | 'moments' | 'discover' | 'membership' | 'profile';
export type Media = {
  id: string;
  title: string;
  type: 'photo' | 'video';
  collection: string;
  tier: Plan;
  image: string;
  description: string;
  duration?: string;
  release?: string;
};

export const media: Media[] = [
  {
    id: 'golden',
    title: 'Golden Hour',
    type: 'photo',
    collection: 'Shanaya’s Looks',
    tier: 'Premium',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=85',
    description: 'Warm light and an unhurried afternoon.',
  },
  {
    id: 'midnight',
    title: 'After Dark',
    type: 'video',
    collection: 'Video Diaries',
    tier: 'Premium Plus',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=85',
    description: 'An evening of style and stories.',
    duration: '02:18',
  },
  {
    id: 'rose',
    title: 'Rose Garden',
    type: 'photo',
    collection: 'Daily Moments',
    tier: 'Free',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&q=85',
    description: 'A little softness for your day.',
  },
  {
    id: 'city',
    title: 'City Lights',
    type: 'photo',
    collection: 'Date Night',
    tier: 'Premium',
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900&q=85',
    description: 'A cinematic city evening.',
  },
  {
    id: 'diary',
    title: 'Sunday Diary',
    type: 'video',
    collection: 'Video Diaries',
    tier: 'Premium',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&q=85',
    description: 'A quiet Sunday diary.',
    duration: '01:45',
  },
  {
    id: 'portrait',
    title: 'Soft Focus',
    type: 'photo',
    collection: 'Shanaya’s Looks',
    tier: 'Premium Plus',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&q=85',
    description: 'An editorial portrait collection.',
  },
];

export const releases = [
  {
    id: 'moon',
    title: 'Moonlit Stories',
    type: 'Photo collection',
    date: '2026-11-18T19:00:00+05:30',
    tier: 'Premium',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1100&q=85',
    description: 'A collection of moonlit scenes and little mysteries.',
  },
  {
    id: 'velvet',
    title: 'Velvet Evenings',
    type: 'Video diary',
    date: '2026-11-24T20:00:00+05:30',
    tier: 'Premium Plus',
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1100&q=85',
    description: 'A cinematic evening release.',
  },
  {
    id: 'letters',
    title: 'Letters at Dawn',
    type: 'Photo collection',
    date: '2026-12-02T18:30:00+05:30',
    tier: 'Free',
    image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1100&q=85',
    description: 'A gentle early-morning story.',
  },
];

export const tiers: { name: Plan; price: number; photos: number; videos: number; features: string[] }[] = [
  {
    name: 'Free',
    price: 0,
    photos: 3,
    videos: 1,
    features: ['Private chat preview', '3 photo previews per month', '1 video preview per month', 'Feed updates'],
  },
  {
    name: 'Premium',
    price: 399,
    photos: 20,
    videos: 5,
    features: ['Unlimited conversations', '20 photo unlocks per month', '5 video unlocks per month', 'Premium stories'],
  },
  {
    name: 'Premium Plus',
    price: 799,
    photos: 60,
    videos: 15,
    features: ['Priority direct messaging', '60 photo unlocks per month', '15 video unlocks per month', 'All exclusive stories'],
  },
];
