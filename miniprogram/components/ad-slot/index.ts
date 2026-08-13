import { advertising } from '../../platform/advertising'

Component({
  properties: { slot: { type: Object, value: null } },
  data: { available: false },
  lifetimes: {
    attached(this: any) {
      const slot = this.data.slot
      this.setData({ available: Boolean(slot?.enabled && advertising.isAvailable(slot)) })
    },
    detached(this: any) {
      if (this.data.slot) advertising.destroy(this.data.slot)
    },
  },
})
