export type CreatorBadge = 'verified' | 'heart' | 'feather' | 'diamond' | 'rabbit'

export function normalizeCreatorHandle(handle: string): string {
  return handle.replace(/-/g, '')
}

export type CreatorStat = {
  posts: string
  media: string
  live: string
  likes: string
}

export type CreatorSubscription = {
  title: string
  message: string
  priceLabel?: string
  isFree?: boolean
}

export type CreatorProfile = {
  slug: string
  name: string
  handle: string
  coverImage: string
  avatarImage: string
  badges: CreatorBadge[]
  status: string
  bio: string
  expandedBio?: string
  stats: CreatorStat
  subscription: CreatorSubscription
  tabs: {
    postsLabel: string
    mediaLabel: string
  }
}

const image = (id: string) => `https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/${id}/public`

export const creatorProfiles: Record<string, CreatorProfile> = {
  'abigaiil-morris': {
    slug: 'abigaiil-morris',
    name: 'Abigaiil Morris',
    handle: '@abigaiilmorris',
    coverImage: image('8e1e169a-09c9-4e66-f7be-b42f59cff800'),
    avatarImage: image('8e1e169a-09c9-4e66-f7be-b42f59cff800'),
    badges: ['verified'],
    status: 'Available now',
    bio: 'Hey! I’m Abigaiil. Welcome to my exclusive space — come closer and get to know me better.',
    stats: { posts: '128', media: '96', live: '24', likes: '3.2K' },
    subscription: { title: 'Limited offer: 80% off for the first 31 days!', message: '80% OFF — Come see all my new content! 🔥' },
    tabs: { postsLabel: 'Posts', mediaLabel: 'Media' },
  },
  'alex-mucci': {
    slug: 'alex-mucci', name: 'Alex Mucci', handle: '@alexmucci',
    coverImage: image('437fa29e-489c-4a08-3439-38ea8137d700'), avatarImage: image('437fa29e-489c-4a08-3439-38ea8137d700'),
    badges: ['verified'], status: 'Available now', bio: 'Your favorite Italian creator. New photos, videos and behind-the-scenes content every week. Follow my latest looks, personal updates, daily life, and exclusive moments shared here with my subscribers.', expandedBio: 'Your favorite Italian creator. New photos, videos and behind-the-scenes content every week. Follow my latest looks, personal updates, daily life, and exclusive moments shared here with my subscribers. I also share regular behind-the-scenes stories, fresh photo sets, private messages, and special drops that are not available anywhere else.',
    stats: { posts: '214', media: '175', live: '24', likes: '8.7K' },
    subscription: { title: 'Limited offer: 80% off for the first 31 days!', message: 'New content every week — don’t miss this 💋' },
    tabs: { postsLabel: 'Posts', mediaLabel: 'Media' },
  },
  'emma-hix': {
    slug: 'emma-hix', name: 'Emma Hix', handle: '@emmahix',
    coverImage: image('a6184bf9-e8f4-4e3f-2907-02eb2aeff000'), avatarImage: image('a6184bf9-e8f4-4e3f-2907-02eb2aeff000'),
    badges: ['verified'], status: 'Available now', bio: 'Hi babes! This is my little corner for my newest content and daily updates.',
    stats: { posts: '456', media: '312', live: '24', likes: '12.4K' },
    subscription: { title: 'Limited offer: 80% off for the first 31 days!', message: 'Unlock my newest exclusive drops ✨' },
    tabs: { postsLabel: 'Posts', mediaLabel: 'Media' },
  },
  'lily-phillips': {
    slug: 'lily-phillips', name: 'Lily Phillips', handle: '@lilyphillips',
    coverImage: image('d14de298-7e05-4b79-ec24-4b35ccbd4e00'), avatarImage: image('d14de298-7e05-4b79-ec24-4b35ccbd4e00'),
    badges: ['verified'], status: 'Available now', bio: 'Welcome to my page. I’m sharing more of the things I can’t post anywhere else.',
    stats: { posts: '189', media: '142', live: '24', likes: '5.1K' },
    subscription: { title: 'Limited offer: 80% off for the first 31 days!', message: 'See what I can’t post anywhere else 🔥' },
    tabs: { postsLabel: 'Posts', mediaLabel: 'Media' },
  },
  'pleasant-morenaa': {
    slug: 'pleasant-morenaa', name: 'Pleasant Morenaa', handle: '@pleasantmorenaa',
    coverImage: image('924fed1a-5cc0-41fa-3a25-a2ecb3569200'), avatarImage: image('924fed1a-5cc0-41fa-3a25-a2ecb3569200'),
    badges: ['verified'], status: 'Available now', bio: 'Come say hello and enjoy my latest exclusive drops.',
    stats: { posts: '96', media: '74', live: '24', likes: '2.8K' },
    subscription: { title: 'Limited offer: 80% off for the first 31 days!', message: 'Come say hello to my exclusive content 💕' },
    tabs: { postsLabel: 'Posts', mediaLabel: 'Media' },
  },
  'jasmine-jae': {
    slug: 'jasmine-jae', name: 'Jasmine Jae', handle: '@jasminejae',
    coverImage: image('9fb69de6-7225-428b-e1d6-4c19e2d71e00'), avatarImage: image('9fb69de6-7225-428b-e1d6-4c19e2d71e00'),
    badges: ['verified'],     status: 'Available now', bio: 'Welcome to my exclusive profile. Discover my latest posts and updates.', expandedBio: 'Welcome to my exclusive profile. Discover my latest posts and updates. More behind-the-scenes content, messages, and new drops are available for subscribers.',
    stats: { posts: '120', media: '80', live: '24', likes: '429.2K' },
    subscription: { title: 'Limited offer: 80% off for the first 31 days!', message: 'Come see my latest exclusive content 🔥' },
    tabs: { postsLabel: 'Posts', mediaLabel: 'Media' },
  },
}

export function getCreatorProfile(slug: string): CreatorProfile {
  return creatorProfiles[slug] ?? {
    slug,
    name: slug.replace(/-/g, ' '),
    handle: `@${slug.replace(/-/g, '')}`,
    coverImage: creatorProfiles['abigaiil-morris'].coverImage,
    avatarImage: creatorProfiles['abigaiil-morris'].avatarImage,
    badges: ['verified'],
    status: 'Available now',
    bio: 'Welcome to my exclusive profile on Telescope.',
    expandedBio: 'Welcome to my exclusive profile on Telescope. Discover new posts, updates, and behind-the-scenes content shared regularly.',
    stats: { posts: '120', media: '80', live: '24', likes: '1.5K' },
    subscription: { title: 'Limited offer: 80% off for the first 31 days!', message: 'Come see my latest exclusive content 🔥' },
    tabs: { postsLabel: 'Posts', mediaLabel: 'Media' },
  }
}
