export type ExploreCategory = 'Trending' | 'Most Popular' | 'New'

export type ExploreCreator = {
  name: string
  image: string
  slug: string
  trendingScore: number
  popularScore: number
  createdAt: string
}

const image = (id: string) => `https://imagedelivery.net/JbcvhHWGK90wHykvJ8zUXw/${id}/public`
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/**
 * Deterministic Explore metadata. These values are intentionally local until
 * the Explore ranking is connected to persisted creator analytics.
 */
const source = [
  ['Abigaiil Morris', '8e1e169a-09c9-4e66-f7be-b42f59cff800', 86, 78, '2026-07-30'],
  ['Alex Mucci', '437fa29e-489c-4a08-3439-38ea8137d700', 92, 88, '2026-07-25'],
  ['Emma Hix', 'a6184bf9-e8f4-4e3f-2907-02eb2aeff000', 90, 95, '2026-07-18'],
  ['Lily Phillips', 'd14de298-7e05-4b79-ec24-4b35ccbd4e00', 80, 82, '2026-07-08'],
  ['Pleasant Morenaa', '924fed1a-5cc0-41fa-3a25-a2ecb3569200', 72, 68, '2026-07-29'],
  ['Savannah Bond', 'aec21118-9d2e-41dc-0922-d0c4a1d7c700', 76, 73, '2026-07-26'],
  ['Jasmine Jae', '9fb69de6-7225-428b-e1d6-4c19e2d71e00', 98, 99, '2026-07-12'],
  ['Morgan Lane', '3f1ad90e-4945-4508-6fa8-a1a4cbc19600', 74, 77, '2026-07-21'],
  ['Donna', '0a5d05e7-5fa6-4646-b7f1-7e500c915400', 69, 64, '2026-08-03'],
  ['Lauren Blake', 'd7462826-b7fa-4829-be01-e814715cd200', 71, 70, '2026-07-31'],
  ['Claudia Tihan', 'd322dc17-8f9a-4204-a786-25685314e000', 67, 66, '2026-07-27'],
  ['Francety', '3a8b6205-b1ae-415f-cf15-56206c824600', 65, 61, '2026-08-01'],
  ['Amanda Nicole', '512bc0a0-66d3-4e38-b3e7-117726d7a300', 63, 60, '2026-07-19'],
  ['Ava Louise', '4783fcc1-86b6-45b9-7da9-79bf793edc00', 61, 58, '2026-08-05'],
  ['Rebekah Leah', 'c064eaf6-8cb5-48ad-ddec-a719228e2d00', 59, 56, '2026-07-16'],
  ['Elsa Jean', '8529c55d-263e-4e3a-8364-d971aa0cf900', 57, 54, '2026-07-28'],
  ['Yvonne Bar', 'fa7baef1-fd87-4232-9e32-9d576e892700', 55, 52, '2026-08-04'],
  ['Gigi Torres', '9d4d0e65-961b-4c42-9629-4cc766582500', 53, 50, '2026-07-14'],
  ['Sommer Ray', 'fb0a8d2b-30dd-487a-a7bb-1e738cc7e600', 51, 48, '2026-07-23'],
  ['Frances Bentley', '404e7eec-1ce5-4d73-6c21-fddbf856c900', 49, 46, '2026-08-06'],
] as const

export const exploreCreators: ExploreCreator[] = source.map(([name, id, trendingScore, popularScore, createdAt]) => ({
  name,
  image: image(id),
  slug: slugify(name),
  trendingScore,
  popularScore,
  createdAt,
}))

export function rankExploreCreators(category: ExploreCategory) {
  return [...exploreCreators].sort((a, b) => {
    if (category === 'Trending') return b.trendingScore - a.trendingScore
    if (category === 'Most Popular') return b.popularScore - a.popularScore
    return b.createdAt.localeCompare(a.createdAt)
  })
}
