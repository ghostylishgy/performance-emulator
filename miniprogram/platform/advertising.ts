import { getProduct, type ProductId } from '../config/products'

export interface AdSlotConfig {
  slotId: string
  unitId: string
  enabled: boolean
}

// No ad unit IDs are configured in this phase. Empty means no request and no layout.
export const adSlots: AdSlotConfig[] = []

export function getActiveAdSlot(productId: ProductId, slotId: string): AdSlotConfig | null {
  const product = getProduct(productId)
  if (!product?.enabled || !product.adsEnabled) return null
  return adSlots.find((slot) => slot.slotId === slotId && slot.enabled && Boolean(slot.unitId)) ?? null
}
