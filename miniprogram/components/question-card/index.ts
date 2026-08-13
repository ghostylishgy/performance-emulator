Component({
  properties: {
    question: { type: Object, value: {} },
    selected: { type: String, value: '' },
    disabled: { type: Boolean, value: false },
  },
  methods: {
    choose(this: any, event: any) { this.triggerEvent('choose', event.detail) },
  },
})
