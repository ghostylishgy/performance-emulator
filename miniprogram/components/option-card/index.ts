Component({
  properties: {
    option: { type: Object, value: {} },
    selected: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
  },
  methods: {
    choose(this: any) {
      if (this.data.disabled) return
      this.triggerEvent('choose', { optionId: this.data.option.id })
    },
  },
})
