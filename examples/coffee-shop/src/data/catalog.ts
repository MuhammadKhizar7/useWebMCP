export type ProductCategory = 'coffee' | 'equipment' | 'accessories'

export interface Product {
  id: string
  slug: string
  name: string
  category: ProductCategory
  description: string
  longDescription: string
  price: number
  unit: string
  accent: string
  tags: string[]
  specifications?: Record<string, string>
}

export const catalog: Product[] = [
  {
    id: 'dark-roast-no-4',
    slug: 'dark-roast-no-4',
    name: 'Dark Roast No. 4',
    category: 'coffee',
    description: 'Cocoa, toasted walnut, and a long finish.',
    longDescription: 'A full-bodied house roast for slow mornings and late conversations.',
    price: 18,
    unit: '12 oz bag',
    accent: '#7d4c32',
    tags: ['bold', 'chocolate', 'whole bean'],
  },
  {
    id: 'quiet-morning',
    slug: 'quiet-morning',
    name: 'Quiet Morning',
    category: 'coffee',
    description: 'Apricot, honey, and a clean floral finish.',
    longDescription: 'A bright seasonal blend that rewards a slower pour-over ritual.',
    price: 21,
    unit: '12 oz bag',
    accent: '#bd8754',
    tags: ['bright', 'honey', 'seasonal'],
  },
  {
    id: 'the-alchemist',
    slug: 'the-alchemist',
    name: 'The Alchemist',
    category: 'equipment',
    description: 'A compact espresso machine for quiet precision.',
    longDescription: 'The control and calm of a professional bar, sized for a considered kitchen.',
    price: 890,
    unit: 'brushed steel',
    accent: '#9b9b90',
    tags: ['espresso', 'thermoblock', 'countertop'],
    specifications: {
      Height: '12 in',
      Width: '8.5 in',
      'Water tank': '2.0 L',
      'Heat-up time': '4 min',
      Finish: 'Brushed steel',
      'Group size': '58 mm',
    },
  },
  {
    id: 'precision-burr',
    slug: 'precision-burr',
    name: 'Precision Burr',
    category: 'equipment',
    description: 'The small upgrade that changes every cup.',
    longDescription: 'A quiet, stepped grinder with the range to meet every morning method.',
    price: 245,
    unit: 'matte black',
    accent: '#4e514f',
    tags: ['grinder', 'quiet', 'steel burrs'],
  },
  {
    id: 'linen-filter-set',
    slug: 'linen-filter-set',
    name: 'Linen Filter Set',
    category: 'accessories',
    description: 'Reusable filters for a softer, clearer pour.',
    longDescription: 'A set of three washable linen filters, finished with a stitched cotton edge.',
    price: 16,
    unit: 'set of 3',
    accent: '#d1bda2',
    tags: ['pour-over', 'reusable', 'linen'],
  },
]

export function getProductById(id: string): Product | undefined {
  return typeof id === 'string' ? catalog.find((product) => product.id === id) : undefined
}

export function getProductBySlug(slug: string): Product | undefined {
  return typeof slug === 'string' ? catalog.find((product) => product.slug === slug) : undefined
}

export function searchCatalog(query: unknown): Product[] {
  if (typeof query !== 'string') return []
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return [...catalog]

  return catalog.filter((product) =>
    [product.name, product.category, product.description, ...product.tags]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery),
  )
}
