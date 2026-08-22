import type { V3TestDefinition } from '../config/v3-types'
import { clearProgress } from './storage'

export function recoverCorruptProgress(definition: V3TestDefinition): void {
  clearProgress(definition.id)
  wx.showModal({
    title: '答题记录有点乱',
    content: '本地记录没能完整恢复。旧记录已经清理，可以从头再来。',
    showCancel: false,
    confirmText: '重新开始',
    complete: () => wx.reLaunch({ url: '/pages/home/index' }),
  })
}

export function showProgressSaveWarning(): void {
  wx.showToast({ title: '本地保存失败，本次仍可继续作答', icon: 'none', duration: 2200 })
}
