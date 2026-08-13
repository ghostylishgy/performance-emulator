Component({
  properties: { checkpoint: { type: Object, value: {} }, outcome: String, note: String },
  methods: {
    back(this: any) { this.triggerEvent('back') },
    confirm(this: any) { this.triggerEvent('confirm') },
  },
})
