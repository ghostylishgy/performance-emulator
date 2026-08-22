import { afterEach, describe, expect, it, vi } from 'vitest'
import { performanceSimulator as definition } from '../../miniprogram/config/tests/performance-simulator'
import { createResultViewModel, evaluateComplete } from '../../miniprogram/domain/v3-evaluation'
import {
  createPosterImage,
  createRelationshipPosterModel,
  createSinglePosterModel,
  drawPoster,
  savePosterToAlbum,
  wrapCanvasText,
} from '../../miniprogram/platform/poster'
import { allA, allB, allC, allD } from '../fixtures'

function fakeContext() {
  return {
    scale: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
    lineTo: vi.fn(), quadraticCurveTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(),
    measureText: (text: string) => ({ width: [...text].length * 8 }),
    fillStyle: '', font: '', textBaseline: '',
  }
}

describe('local Canvas result cards', () => {
  afterEach(() => {
    delete (globalThis as typeof globalThis & { wx?: unknown }).wx
    vi.restoreAllMocks()
  })

  it('builds single and relationship cards without requiring every field', () => {
    const single = createSinglePosterModel({
      outcome: '3.5+', personaName: '单点故障型', deathCauseLabel: '成果后知后觉',
      evidence: [{ id: 'e1', source: 'synthesis', questionIds: ['Q2', 'Q13'], answerKeys: ['Q2A', 'Q13D'], text: '事情出问题时站得靠前，做完后又自然退后。', category: 'expression_org' }],
    })
    expect(single.kind).toBe('single')
    expect(single.score).toBe('3.5+')
    expect(single.evidence).toHaveLength(1)

    const relationship = createRelationshipPosterModel({
      relationship: { title: '工位自救小组', copy: '一个负责接住，另一个负责问凭什么。' },
      ownPersonaName: '工位防火墙', peerPersonaName: '隐形苦劳型',
    })
    expect(relationship.kind).toBe('relationship')
    expect(relationship.participants).toEqual(['隐形苦劳型', '工位防火墙'])
    expect(() => createSinglePosterModel({})).not.toThrow()
    expect(() => createRelationshipPosterModel({})).not.toThrow()
  })

  it('wraps long Chinese copy and renders at high DPR', () => {
    const context = fakeContext()
    const lines = wrapCanvasText(context, '这是一段需要在不同手机宽度下稳定换行的很长中文结果文案', 64)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join('')).toContain('不同手机宽度')

    const canvas = { width: 0, height: 0, getContext: () => context }
    const size = drawPoster(canvas, createSinglePosterModel({ personaName: '单点故障型' }), 3)
    expect(size).toEqual({ width: 375, height: 600 })
    expect(canvas.width).toBe(1125)
    expect(canvas.height).toBe(1800)
    expect(context.scale).toHaveBeenCalledWith(3, 3)
    const drawnText = context.fillText.mock.calls.map((call) => call[0])
    expect(drawnText.indexOf('单点故障型')).toBeLessThan(drawnText.indexOf('—'))
  })

  it('creates a local PNG through the 2D canvas node', async () => {
    const context = fakeContext()
    const canvas = { width: 0, height: 0, getContext: () => context }
    const exportSizes: Array<[number, number]> = []
    ;(globalThis as typeof globalThis & { wx: unknown }).wx = {
      createSelectorQuery: () => ({
        in: () => ({
          select: () => ({
            fields: () => ({ exec: (callback: (items: unknown[]) => void) => callback([{ node: canvas }]) }),
          }),
        }),
      }),
      getWindowInfo: () => ({ pixelRatio: 6 }),
      canvasToTempFilePath: (options: any) => {
        exportSizes.push([options.destWidth, options.destHeight])
        options.success({ tempFilePath: 'local-result.png' })
      },
    }
    await expect(createPosterImage({}, createSinglePosterModel({ outcome: '4.0' }))).resolves.toBe('local-result.png')
    expect(exportSizes).toEqual([[1500, 2400]])
  })

  it('keeps all configured single and relationship copy inside the poster canvas', () => {
    const models = [allA, allB, allC, allD].map((answers) =>
      createSinglePosterModel(createResultViewModel(definition, evaluateComplete(definition, answers))))
    for (const relationship of definition.pairRelationships) {
      models.push(createRelationshipPosterModel({
        relationship, ownPersonaName: '工位防火墙', peerPersonaName: '隐形苦劳型',
      }))
    }
    for (const model of models) {
      const context = fakeContext()
      const canvas = { width: 0, height: 0, getContext: () => context }
      expect(() => drawPoster(canvas, model, 2)).not.toThrow()
      for (const call of context.fillText.mock.calls) {
        expect(Number(call[2])).toBeGreaterThanOrEqual(0)
        expect(Number(call[2])).toBeLessThan(590)
      }
    }
  })

  it('recovers from album denial through settings and reports a refused retry', async () => {
    let saveCalls = 0
    ;(globalThis as typeof globalThis & { wx: unknown }).wx = {
      saveImageToPhotosAlbum: (options: any) => {
        saveCalls += 1
        if (saveCalls === 1) options.fail({ errMsg: 'saveImageToPhotosAlbum:fail auth deny' })
        else options.success({})
      },
      showModal: (options: any) => options.success({ confirm: true }),
      openSetting: (options: any) => options.success({ authSetting: { 'scope.writePhotosAlbum': true } }),
    }
    await expect(savePosterToAlbum('local-result.png')).resolves.toBe('saved')
    expect(saveCalls).toBe(2)

    ;(globalThis as typeof globalThis & { wx: unknown }).wx = {
      saveImageToPhotosAlbum: (options: any) => options.fail({ errMsg: 'fail permission deny' }),
      showModal: (options: any) => options.success({ confirm: false }),
    }
    await expect(savePosterToAlbum('local-result.png')).resolves.toBe('cancelled')
  })
})
