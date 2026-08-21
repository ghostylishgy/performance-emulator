import type { PairResultSnapshot } from '../config/v3-types'
import { normalizePairCode } from '../domain/v3-pairing'

interface CloudResponse<T> { result?: T }

export async function createPairCode(snapshot: PairResultSnapshot): Promise<{ code: string; expiresAt: number }> {
  if (!wx.cloud) throw new Error('云开发尚未初始化')
  const response = await wx.cloud.callFunction({ name: 'pairing', data: { action: 'create', snapshot } }) as CloudResponse<{ ok: boolean; code?: string; expiresAt?: number; error?: string }>
  if (!response.result?.ok || !response.result.code || !response.result.expiresAt) throw new Error(response.result?.error || '生成失败')
  return { code: response.result.code, expiresAt: response.result.expiresAt }
}

export async function resolvePairCode(code: string): Promise<PairResultSnapshot> {
  if (!wx.cloud) throw new Error('云开发尚未初始化')
  const normalized = normalizePairCode(code)
  const response = await wx.cloud.callFunction({ name: 'pairing', data: { action: 'resolve', code: normalized } }) as CloudResponse<{ ok: boolean; status?: string; result?: PairResultSnapshot; error?: string }>
  if (!response.result?.ok || !response.result.result) {
    const message = response.result?.status === 'expired' ? '这个对口径码已经失效' : response.result?.error || '没有找到这个对口径码'
    throw new Error(message)
  }
  return response.result.result
}
