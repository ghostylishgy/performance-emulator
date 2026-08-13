Component({
  properties: { transition: { type: Object, value: {} } },
  methods: {
    continueNext(this: any) { this.triggerEvent('continue') },
  },
})
