Component({
  properties: {
    bookSet: { type: Object, value: null },
    emphasis: { type: String, value: 'secondary' },
  },
  methods: {
    onCopy(this: any, event: any) {
      this.triggerEvent('copy', { ...event.detail, target: this.data.bookSet.target.id })
    },
    onShare(this: any) {
      this.triggerEvent('selectshare', { target: this.data.bookSet.target.id })
    },
  },
})
