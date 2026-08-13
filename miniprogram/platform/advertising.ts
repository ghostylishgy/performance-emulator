import type { AdSlotConfig } from '../config/types'
import { analytics } from './analytics'

export type AdEvent = 'load' | 'error' | 'close' | 'impression'
export type AdEventHandler = (payload?: unknown) => void

export interface AdvertisingAdapter {
  isAvailable(slot: AdSlotConfig): boolean
  load(slot: AdSlotConfig): Promise<void>
  show(slot: AdSlotConfig): Promise<void>
  hide(slot: AdSlotConfig): void
  destroy(slot: AdSlotConfig): void
  on(event: AdEvent, handler: AdEventHandler): () => void
}

export class DisabledAdvertisingAdapter implements AdvertisingAdapter {
  isAvailable(_slot: AdSlotConfig): boolean { return false }
  async load(slot: AdSlotConfig): Promise<void> { analytics.track('ad_request', { slot: slot.key }) }
  async show(_slot: AdSlotConfig): Promise<void> { return undefined }
  hide(_slot: AdSlotConfig): void {}
  destroy(_slot: AdSlotConfig): void {}
  on(_event: AdEvent, _handler: AdEventHandler): () => void { return () => undefined }
}

export const advertising: AdvertisingAdapter = new DisabledAdvertisingAdapter()

