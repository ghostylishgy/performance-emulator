import { TEXTBOOK_DESK_PRODUCT_ID } from '../../config/products'
import { guardProductAccess, type ProductRouteOptions } from '../../platform/product-routing'
import { loadTextbookPreference } from './storage'
import type { TextbookPreference, TextbookTargetId } from './types'
import {
  copyTextbookOfficialUrl,
  defaultTextbookSharePayload,
  openTextbookBookSet,
  resolveTextbookPageState,
  setTextbookHomeGrade,
  shareTextbookBookSet,
} from './ui/actions'
import type { TextbookBookSetViewModel, TextbookDeskViewModel } from './ui/state-adapter'

let activeRoute: ProductRouteOptions = {}
let activePreference: TextbookPreference | null = null
let activeViewModel: TextbookDeskViewModel | null = null
let activeShareSet: TextbookBookSetViewModel | null = null

function allBookSets(viewModel: TextbookDeskViewModel): readonly TextbookBookSetViewModel[] {
  const sets = [viewModel.layout.hero, ...viewModel.layout.secondary, ...viewModel.layout.history]
  return sets.filter((set): set is TextbookBookSetViewModel => Boolean(set))
}

function findBookSet(viewModel: TextbookDeskViewModel, target: unknown): TextbookBookSetViewModel | null {
  if (typeof target !== 'string') return null
  return allBookSets(viewModel).find((set) => set.target.id === target) ?? null
}

Page({
  data: {
    ready: false,
    viewModel: null as TextbookDeskViewModel | null,
  },
  onLoad(options: ProductRouteOptions) {
    activeRoute = options
    activePreference = null
    activeViewModel = null
    activeShareSet = null
    if (!guardProductAccess(TEXTBOOK_DESK_PRODUCT_ID, options)) return

    // A valid share is derived before any local preference read, keeping the
    // receiver's saved grade isolated from the transient shared desk.
    let viewModel = resolveTextbookPageState(options, null, new Date())
    if (viewModel.share.kind === 'normal') {
      const stored = loadTextbookPreference()
      activePreference = stored.status === 'current' ? stored.preference : null
      viewModel = resolveTextbookPageState(options, activePreference, new Date())
    }

    activeViewModel = viewModel
    activeShareSet = viewModel.layout.hero
    this.setData({ ready: true, viewModel })
    if (viewModel.layout.hero) openTextbookBookSet(viewModel.layout.hero, viewModel)
  },
  onUnload() {
    activeRoute = {}
    activePreference = null
    activeViewModel = null
    activeShareSet = null
  },
  onGradeSelect(event: { detail: { gradeId?: unknown } }) {
    const nextPreference = setTextbookHomeGrade(event.detail.gradeId, activePreference)
    if (!nextPreference) {
      wx.showToast({ title: '年级保存失败', icon: 'none' })
      return
    }
    activePreference = nextPreference
    activeRoute = { source: 'normal' }
    const viewModel = resolveTextbookPageState(activeRoute, activePreference, new Date())
    activeViewModel = viewModel
    activeShareSet = viewModel.layout.hero
    this.setData({ viewModel })
    if (viewModel.layout.hero) openTextbookBookSet(viewModel.layout.hero, viewModel)
  },
  onCopyBook(event: { detail: { bookId?: unknown; target?: unknown } }) {
    if (!activeViewModel || typeof event.detail.bookId !== 'string') return
    const set = findBookSet(activeViewModel, event.detail.target)
    if (!set) return
    void copyTextbookOfficialUrl(event.detail.bookId, set, activeViewModel).then((copied) => {
      wx.showToast({ title: copied ? '已复制官方入口' : '暂时无法复制', icon: 'none' })
    })
  },
  onSelectShare(event: { detail: { target?: TextbookTargetId } }) {
    if (!activeViewModel) return
    activeShareSet = findBookSet(activeViewModel, event.detail.target) ?? activeViewModel.layout.hero
  },
  onShareAppMessage() {
    if (!activeViewModel || !activeShareSet) {
      const share = defaultTextbookSharePayload()
      return { title: share.title, path: share.path }
    }
    const share = shareTextbookBookSet(activeShareSet, activeViewModel)
    return { title: share.title, path: share.path }
  },
  onShareTimeline() {
    if (!activeViewModel || !activeShareSet) {
      const share = defaultTextbookSharePayload()
      return { title: share.title, query: share.query }
    }
    const share = shareTextbookBookSet(activeShareSet, activeViewModel)
    return { title: share.title, query: share.query }
  },
})
