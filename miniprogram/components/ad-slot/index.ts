import { getActiveAdSlot } from '../../platform/advertising'
import type { ProductId } from '../../config/products'

Component({
  properties: {
    productId: { type: String, value: '' },
    slotId: { type: String, value: '' },
  },
  data: { visible: false },
  lifetimes: {
    attached(this: any) {
      const productId = String(this.properties.productId) as ProductId
      const slotId = String(this.properties.slotId)
      this.setData({ visible: Boolean(getActiveAdSlot(productId, slotId)) })
    },
  },
})
