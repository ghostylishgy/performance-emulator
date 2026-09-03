Component({
  properties: {
    options: { type: Array, value: [] },
    selected: { type: String, value: '' },
  },
  methods: {
    onSelect(this: any, event: any) {
      this.triggerEvent('select', { gradeId: event.currentTarget.dataset.gradeId })
    },
  },
})
