export type ProductId = 'love_accident' | 'performance' | 'textbook_desk'

export interface ProductRoutes {
  home: string
  test: string | null
  result: string | null
  shareEntry: string
}

export interface ProductDefinition {
  product_id: ProductId
  title: string
  enabled: boolean
  isDefault: boolean
  featured: boolean
  routes: ProductRoutes
  testId?: string
  adsEnabled: boolean
}

export const LOVE_ACCIDENT_PRODUCT_ID: ProductId = 'love_accident'
export const PERFORMANCE_PRODUCT_ID: ProductId = 'performance'
export const TEXTBOOK_DESK_PRODUCT_ID: ProductId = 'textbook_desk'

export const productRegistry: ProductDefinition[] = [
  {
    product_id: LOVE_ACCIDENT_PRODUCT_ID,
    title: '恋爱事故鉴定书',
    enabled: true,
    isDefault: true,
    featured: true,
    routes: {
      home: '/pages/love-accident/index',
      test: '/pages/love-quiz/index',
      result: '/pages/love-result/index',
      shareEntry: '/pages/product-entry/index',
    },
    testId: 'love-accident',
    adsEnabled: false,
  },
  {
    product_id: PERFORMANCE_PRODUCT_ID,
    title: '大厂绩效模拟器',
    enabled: false,
    isDefault: false,
    featured: false,
    routes: {
      home: '/pages/home/index',
      test: '/pages/quiz/index',
      result: '/pages/result/index',
      shareEntry: '/pages/product-entry/index',
    },
    testId: 'performance-simulator',
    adsEnabled: false,
  },
  {
    product_id: TEXTBOOK_DESK_PRODUCT_ID,
    title: '第二书包',
    enabled: false,
    isDefault: false,
    featured: false,
    routes: {
      home: '/pages/textbook-desk/index',
      test: null,
      result: null,
      shareEntry: '/pages/textbook-desk/index',
    },
    adsEnabled: false,
  },
]

export function getProduct(productId: string): ProductDefinition | undefined {
  return productRegistry.find((product) => product.product_id === productId)
}

export function getProductByTestId(testId: string): ProductDefinition | undefined {
  return productRegistry.find((product) => product.testId === testId)
}

export function getDefaultProduct(): ProductDefinition {
  const product = productRegistry.find((item) => item.isDefault && item.enabled)
  if (!product) throw new Error('Product registry must contain one enabled default product')
  return product
}

export function validateProductRegistry(products: ProductDefinition[]): void {
  const errors: string[] = []
  const ids = products.map((product) => product.product_id)
  if (new Set(ids).size !== ids.length) errors.push('product_id must be unique')
  const defaults = products.filter((product) => product.isDefault)
  if (defaults.length !== 1) errors.push(`expected one default product, got ${defaults.length}`)
  if (defaults[0] && !defaults[0].enabled) errors.push('default product must be enabled')
  for (const product of products) {
    if (!product.title.trim()) errors.push(`${product.product_id}: title is required`)
    for (const [name, path] of Object.entries(product.routes)) {
      if (path !== null && !path.startsWith('/pages/')) errors.push(`${product.product_id}: ${name} must be an absolute page path`)
    }
  }
  if (errors.length) throw new Error(`Invalid product registry:\n${errors.map((error) => `- ${error}`).join('\n')}`)
}
