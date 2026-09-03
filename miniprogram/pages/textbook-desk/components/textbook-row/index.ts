Component({
  properties: {
    book: {
      type: Object,
      value: null,
      observer(this: any, book: { subject?: string } | null) {
        const subject = book?.subject ?? ''
        this.setData({ monogram: subject ? subject.slice(0, 1).toUpperCase() : '' })
      },
    },
  },
  data: {
    monogram: '',
  },
  methods: {
    onCopy(this: any) {
      this.triggerEvent('copy', { bookId: this.data.book.id })
    },
  },
})
