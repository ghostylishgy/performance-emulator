Component({
  options: { multipleSlots: true },
  properties: {
    open: { type: Boolean, value: false },
    title: { type: String, value: '' },
  },
  methods: {
    onClose(this: any) {
      this.triggerEvent('close')
    },
    stopPropagation() {},
  },
})
