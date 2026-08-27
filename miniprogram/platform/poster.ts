import type { PairRelationship, ResultViewModel } from '../config/v3-types'

export interface PosterModel {
  kind: 'single' | 'relationship'
  brand: string
  eyebrow: string
  score?: string
  title: string
  subtitle: string
  quote: string
  evidence: string[]
  participants?: string[]
  footer: string
}

export interface RelationshipPosterInput {
  relationship: Pick<PairRelationship, 'title' | 'copy'>
  ownPersonaName: string
  peerPersonaName: string
}

export function createSinglePosterModel(result: Partial<ResultViewModel>): PosterModel {
  const available = (result.evidence ?? []).filter((item) => Boolean(item?.text))
  const evidence = [
    ...available.filter((item) => item.source === 'synthesis'),
    ...available.filter((item) => item.source !== 'synthesis'),
  ].map((item) => item.text).slice(0, 2)
  return {
    kind: 'single', brand: '烛龙实验室｜绩效内测会', eyebrow: '职场鉴定结果',
    score: result.outcome ?? '—', title: result.personaName ?? '待识别职场本体',
    subtitle: `主要死因：${result.deathCauseLabel ?? '暂无明显死因'}`,
    quote: result.personaCopy ?? '系统暂时没有形成稳定判断。', evidence,
    footer: '同样是3.5，死法各不相同。\n大厂绩效模拟器',
  }
}

export function createRelationshipPosterModel(input: Partial<RelationshipPosterInput>): PosterModel {
  return {
    kind: 'relationship', brand: '烛龙实验室｜绩效内测会', eyebrow: '你们的职场关系',
    title: input.relationship?.title ?? '关系暂未识别', subtitle: '',
    quote: input.relationship?.copy ?? '系统暂时没能读懂这组关系。', evidence: [],
    participants: [input.peerPersonaName ?? '对方人格', input.ownPersonaName ?? '我的人格'],
    footer: '你俩凑一起，系统是这么看的。\n大厂绩效模拟器',
  }
}

export function wrapCanvasText(context: any, text: string, maxWidth: number, maxLines = 20): string[] {
  const lines: string[] = []
  const measuredWidth = (value: string): number => {
    const rawWidth = context.measureText(value).width
    const pixelRatio = Math.max(1, Number(context.__posterPixelRatio) || 1)
    const fontSize = Number((String(context.font ?? '').match(/([\d.]+)px/) ?? [])[1] ?? 0)
    if (pixelRatio <= 1 || !fontSize) return rawWidth
    const probeWidth = context.measureText('测').width
    return probeWidth > fontSize * 1.65 ? rawWidth / pixelRatio : rawWidth
  }
  for (const paragraph of String(text ?? '').split('\n')) {
    if (!paragraph) { lines.push(''); continue }
    let line = ''
    for (const char of [...paragraph]) {
      const candidate = `${line}${char}`
      if (line && measuredWidth(candidate) > maxWidth) {
        lines.push(line)
        line = char
        if (lines.length >= maxLines) return lines
      } else line = candidate
    }
    if (line) lines.push(line)
    if (lines.length >= maxLines) return lines
  }
  return lines
}

function roundedRect(context: any, x: number, y: number, width: number, height: number, radius: number): void {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function drawLines(context: any, lines: string[], x: number, startY: number, lineHeight: number): number {
  lines.forEach((line, index) => context.fillText(line, x, startY + index * lineHeight))
  return startY + lines.length * lineHeight
}

export const POSTER_COLORS = {
  page: '#f6f1ea', card: '#fffdf9', ink: '#2b2628', inkSecondary: '#6b6266', muted: '#6e686d',
  primary: '#e94f87', primaryStrong: '#c9366f', primaryPale: '#fbe4ed',
  secondary: '#89658e', secondaryStrong: '#704f75', secondaryPale: '#f0e7f1',
  accent: '#f0ca6a', accentSoft: '#fff3ca', border: '#e4dad4',
  paperEdge: '#8d3857', paperLayer: '#eadfce', paperFiber: '#eadfd5', tape: '#f2a7bf', causeInk: '#725819',
} as const

function fillRoundedRect(context: any, x: number, y: number, width: number, height: number, radius: number, color: string): void {
  roundedRect(context, x, y, width, height, radius)
  context.fillStyle = color
  context.fill()
}

function withRotation(context: any, x: number, y: number, angle: number, draw: () => void): void {
  if (typeof context.save !== 'function' || typeof context.restore !== 'function') {
    draw()
    return
  }
  context.save()
  context.translate(x, y)
  context.rotate(angle)
  context.translate(-x, -y)
  draw()
  context.restore()
}

function drawSinglePaper(context: any): void {
  context.fillStyle = POSTER_COLORS.paperLayer
  context.fillRect(0, 0, 375, 600)
  context.fillStyle = POSTER_COLORS.paperEdge
  context.fillRect(0, 0, 375, 16)
  fillRoundedRect(context, 7, 5, 361, 592, 15, POSTER_COLORS.paperLayer)
  fillRoundedRect(context, 10, 10, 355, 584, 13, POSTER_COLORS.page)
  context.fillStyle = POSTER_COLORS.primary
  context.fillRect(10, 20, 4, 550)

  context.fillStyle = POSTER_COLORS.paperFiber
  for (let index = 0; index < 86; index += 1) {
    const x = 17 + ((index * 71) % 338)
    const y = 17 + ((index * 97) % 566)
    context.fillRect(x, y, index % 4 === 0 ? 3 : 1, 1)
  }
}

function drawPosterHeader(context: any, model: PosterModel, spineColor: string): void {
  if (model.kind === 'single') {
    fillRoundedRect(context, 24, 20, 228, 32, 3, POSTER_COLORS.card)
    fillRoundedRect(context, 31, 27, 18, 18, 9, POSTER_COLORS.primaryPale)
    context.fillStyle = POSTER_COLORS.primaryStrong
    context.font = '900 9px sans-serif'
    context.fillText('烛', 35, 31)
    context.fillStyle = POSTER_COLORS.ink
    context.font = '800 11px sans-serif'
    context.fillText(model.brand, 56, 30)

    withRotation(context, 320, 35, 0.025, () => {
      fillRoundedRect(context, 284, 18, 72, 34, 2, POSTER_COLORS.primaryPale)
      context.fillStyle = POSTER_COLORS.primaryStrong
      context.font = '900 10px sans-serif'
      context.fillText('INTERNAL', 294, 29)
      context.fillStyle = POSTER_COLORS.primary
      context.fillRect(294, 43, 50, 1)
    })

    context.fillStyle = POSTER_COLORS.secondaryStrong
    context.font = '800 11px sans-serif'
    context.fillText('PERFORMANCE RECORD · V3', 28, 67)
    return
  }

  context.fillStyle = spineColor
  context.fillRect(0, 0, 9, 600)
  context.fillStyle = POSTER_COLORS.inkSecondary
  context.font = '700 12px sans-serif'
  context.fillText(model.brand, 28, 25)
  context.fillStyle = POSTER_COLORS.secondaryStrong
  context.font = '800 11px sans-serif'
  context.fillText('RELATIONSHIP REVIEW · V3', 28, 54)
  fillRoundedRect(context, 296, 23, 52, 24, 5, POSTER_COLORS.secondaryPale)
  context.fillStyle = POSTER_COLORS.secondaryStrong
  context.font = '900 10px sans-serif'
  context.fillText('INTERNAL', 304, 30)
}

const SINGLE_POSTER_LAYOUT = {
  titleX: 28,
  titleY: 91,
  titleWidth: 228,
  titleLineHeight: 39,
  quoteX: 22,
  quoteWidth: 331,
  quoteMinY: 158,
  quotePaddingX: 34,
  quoteTopPadding: 24,
  quoteLineHeight: 18,
  quoteMaxLines: 4,
  factsGap: 16,
  scoreX: 26,
  scoreWidth: 158,
  scoreHeight: 74,
  causeX: 200,
  causeWidth: 151,
  causeHeight: 82,
  evidenceGap: 96,
} as const

interface PosterDrawAssets {
  mascot?: any
}

function drawSingleUnderline(context: any, y: number): void {
  context.fillStyle = POSTER_COLORS.primary
  context.fillRect(29, y, 196, 2)
  context.fillRect(221, y - 1, 14, 3)
}

function drawSingleMascot(context: any, mascot: any): void {
  if (!mascot || typeof context.drawImage !== 'function') return
  try {
    context.drawImage(mascot, 45, 0, 422, 350, 248, 75, 127, 106)
  } catch {
    // The poster remains complete if a device cannot decode the optional local asset.
  }
}

function drawQuotePaper(context: any, x: number, y: number, width: number, height: number): void {
  context.beginPath()
  context.moveTo(x + 8, y)
  context.lineTo(x + width - 8, y + 2)
  context.lineTo(x + width, y + 12)
  context.lineTo(x + width - 2, y + height - 9)
  context.lineTo(x + width - 13, y + height)
  context.lineTo(x + 17, y + height - 2)
  context.lineTo(x, y + height - 12)
  context.lineTo(x + 3, y + 10)
  context.closePath()
  context.fillStyle = POSTER_COLORS.primaryPale
  context.fill()

  for (const offset of [21, 43, 65]) fillRoundedRect(context, x - 1, y + offset, 9, 9, 5, POSTER_COLORS.page)
  withRotation(context, x + width - 35, y + 10, -0.13, () => {
    context.fillStyle = POSTER_COLORS.tape
    context.fillRect(x + width - 58, y + 1, 48, 12)
  })
}

function drawScoreStamp(context: any, model: PosterModel, y: number): void {
  const { scoreX, scoreWidth, scoreHeight } = SINGLE_POSTER_LAYOUT
  withRotation(context, scoreX + scoreWidth / 2, y + scoreHeight / 2, -0.012, () => {
    fillRoundedRect(context, scoreX, y, scoreWidth, scoreHeight, 7, POSTER_COLORS.primaryStrong)
    fillRoundedRect(context, scoreX + 4, y + 4, scoreWidth - 8, scoreHeight - 8, 5, POSTER_COLORS.page)
    context.fillStyle = POSTER_COLORS.primaryStrong
    context.font = '900 34px sans-serif'
    context.fillText(model.score ?? '—', scoreX + 14, y + 12)
    context.fillStyle = POSTER_COLORS.secondaryStrong
    context.font = '800 8px sans-serif'
    context.fillText('PERFORMANCE SCORE', scoreX + 14, y + 58)
  })

  fillRoundedRect(context, scoreX + scoreWidth - 30, y + scoreHeight - 25, 37, 37, 19, POSTER_COLORS.primaryStrong)
  fillRoundedRect(context, scoreX + scoreWidth - 26, y + scoreHeight - 21, 29, 29, 15, POSTER_COLORS.primaryPale)
  context.fillStyle = POSTER_COLORS.primaryStrong
  context.font = '900 9px sans-serif'
  context.fillText('核准', scoreX + scoreWidth - 21, y + scoreHeight - 11)
}

function drawCauseMemo(context: any, model: PosterModel, y: number): void {
  const { causeX, causeWidth, causeHeight } = SINGLE_POSTER_LAYOUT
  const cause = model.subtitle.replace(/^主要死因：/, '') || '暂无明显死因'
  withRotation(context, causeX + causeWidth / 2, y + causeHeight / 2, 0.014, () => {
    context.fillStyle = POSTER_COLORS.paperLayer
    context.fillRect(causeX + 4, y + 5, causeWidth, causeHeight)
    fillRoundedRect(context, causeX, y, causeWidth, causeHeight, 2, POSTER_COLORS.accentSoft)
    fillRoundedRect(context, causeX + causeWidth / 2 - 6, y - 5, 12, 12, 6, POSTER_COLORS.accent)
    context.fillStyle = POSTER_COLORS.causeInk
    context.font = '800 13px sans-serif'
    drawLines(context, wrapCanvasText(context, cause, causeWidth - 28, 3), causeX + 14, y + 20, 17)
    context.fillStyle = POSTER_COLORS.accent
    context.fillRect(causeX + 14, y + causeHeight - 12, 42, 2)
  })
}

function drawEvidenceMemo(context: any, model: PosterModel, y: number): void {
  const evidence = model.evidence.slice(0, 2)
  const wrapped = evidence.map((item) => wrapCanvasText(context, item, 251, 2))
  const itemHeight = wrapped.reduce((total, lines) => total + Math.max(1, lines.length) * 16 + 7, 0)
  const cardHeight = Math.max(74, 35 + itemHeight)

  fillRoundedRect(context, 22, y, 331, cardHeight, 7, POSTER_COLORS.card)
  context.fillStyle = POSTER_COLORS.secondaryStrong
  context.fillRect(22, y, 331, 4)
  context.fillStyle = POSTER_COLORS.secondaryStrong
  context.font = '800 11px sans-serif'
  context.fillText('SYSTEM CAPTURE / 系统抓包', 36, y + 14)

  let itemY = y + 35
  for (const [index, lines] of wrapped.entries()) {
    fillRoundedRect(context, 36, itemY, 22, 22, 3, POSTER_COLORS.secondaryStrong)
    context.fillStyle = POSTER_COLORS.card
    context.font = '900 10px sans-serif'
    context.fillText(String(index + 1).padStart(2, '0'), 40, itemY + 6)
    context.fillStyle = POSTER_COLORS.inkSecondary
    context.font = '600 11px sans-serif'
    itemY = drawLines(context, lines.length ? lines : ['暂无抓包证据'], 68, itemY + 2, 16) + 7
    if (index === 0 && wrapped.length > 1) {
      context.fillStyle = POSTER_COLORS.border
      context.fillRect(68, itemY - 4, 253, 1)
    }
  }
}

function drawSingleFooter(context: any, model: PosterModel): void {
  const y = 535
  context.beginPath()
  context.moveTo(10, y + 5)
  context.lineTo(62, y)
  context.lineTo(124, y + 4)
  context.lineTo(187, y + 1)
  context.lineTo(248, y + 5)
  context.lineTo(311, y + 2)
  context.lineTo(365, y + 6)
  context.lineTo(365, 594)
  context.lineTo(10, 594)
  context.closePath()
  context.fillStyle = POSTER_COLORS.paperLayer
  context.fill()

  context.fillStyle = POSTER_COLORS.primaryStrong
  context.fillRect(25, y + 1, 18, 39)
  context.fillStyle = POSTER_COLORS.page
  context.beginPath()
  context.moveTo(25, y + 40)
  context.lineTo(34, y + 32)
  context.lineTo(43, y + 40)
  context.closePath()
  context.fill()

  const footerLines = String(model.footer).split('\n')
  context.fillStyle = POSTER_COLORS.ink
  context.font = '700 11px sans-serif'
  context.fillText(footerLines[0] ?? '', 56, y + 12)
  context.fillStyle = POSTER_COLORS.primaryStrong
  context.font = '900 13px sans-serif'
  context.fillText(footerLines[1] ?? '', 56, y + 31)

  fillRoundedRect(context, 311, y + 5, 38, 38, 19, POSTER_COLORS.primaryStrong)
  fillRoundedRect(context, 316, y + 10, 28, 28, 14, POSTER_COLORS.primary)
  context.fillStyle = POSTER_COLORS.primaryPale
  context.font = '900 12px sans-serif'
  context.fillText('烛', 324, y + 17)
}

function drawSinglePoster(context: any, model: PosterModel, assets: PosterDrawAssets): void {
  context.fillStyle = POSTER_COLORS.primaryStrong
  context.font = '900 36px sans-serif'
  const titleLines = wrapCanvasText(context, model.title, SINGLE_POSTER_LAYOUT.titleWidth, 2)
  const titleEnd = drawLines(
    context,
    titleLines,
    SINGLE_POSTER_LAYOUT.titleX,
    SINGLE_POSTER_LAYOUT.titleY,
    SINGLE_POSTER_LAYOUT.titleLineHeight,
  )
  const underlineY = titleEnd + 7
  drawSingleUnderline(context, underlineY)
  drawSingleMascot(context, assets.mascot)

  const quote = `“${model.quote}”`
  context.font = '700 13px sans-serif'
  let quoteLines = wrapCanvasText(context, quote, SINGLE_POSTER_LAYOUT.quoteWidth - SINGLE_POSTER_LAYOUT.quotePaddingX * 2, 20)
  if (quoteLines.length > SINGLE_POSTER_LAYOUT.quoteMaxLines) {
    context.font = '700 12px sans-serif'
    quoteLines = wrapCanvasText(context, quote, SINGLE_POSTER_LAYOUT.quoteWidth - SINGLE_POSTER_LAYOUT.quotePaddingX * 2, 20)
  }
  quoteLines = quoteLines.slice(0, SINGLE_POSTER_LAYOUT.quoteMaxLines)
  const quoteY = Math.max(SINGLE_POSTER_LAYOUT.quoteMinY, underlineY + 13)
  const quoteHeight = Math.max(96, SINGLE_POSTER_LAYOUT.quoteTopPadding + quoteLines.length * SINGLE_POSTER_LAYOUT.quoteLineHeight + 18)
  drawQuotePaper(context, SINGLE_POSTER_LAYOUT.quoteX, quoteY, SINGLE_POSTER_LAYOUT.quoteWidth, quoteHeight)
  context.fillStyle = POSTER_COLORS.secondary
  context.font = '900 27px sans-serif'
  context.fillText('“', 38, quoteY + 9)
  context.fillText('”', 316, quoteY + quoteHeight - 34)
  context.fillStyle = POSTER_COLORS.ink
  drawLines(
    context,
    quoteLines,
    SINGLE_POSTER_LAYOUT.quoteX + SINGLE_POSTER_LAYOUT.quotePaddingX,
    quoteY + SINGLE_POSTER_LAYOUT.quoteTopPadding,
    SINGLE_POSTER_LAYOUT.quoteLineHeight,
  )

  const factY = quoteY + quoteHeight + SINGLE_POSTER_LAYOUT.factsGap
  context.fillStyle = POSTER_COLORS.muted
  context.font = '800 11px sans-serif'
  context.fillText('FINAL RESULT', 28, factY)
  context.fillStyle = POSTER_COLORS.accent
  context.fillRect(105, factY + 5, 53, 1)
  context.fillStyle = POSTER_COLORS.secondaryStrong
  context.font = '800 11px sans-serif'
  context.fillText('PRIMARY CAUSE', 200, factY)
  context.fillStyle = POSTER_COLORS.accent
  context.fillRect(295, factY + 5, 47, 1)

  const scoreY = factY + 18
  drawScoreStamp(context, model, scoreY)
  drawCauseMemo(context, model, scoreY)

  const evidenceY = scoreY + SINGLE_POSTER_LAYOUT.evidenceGap
  drawEvidenceMemo(context, model, evidenceY)
  drawSingleFooter(context, model)
}

function drawRelationshipPoster(context: any, model: PosterModel): void {
  context.fillStyle = POSTER_COLORS.secondaryStrong
  context.font = '900 38px sans-serif'
  const titleEnd = drawLines(context, wrapCanvasText(context, model.title, 319, 2), 28, 86, 45)
  const quoteY = Math.max(182, titleEnd + 14)
  fillRoundedRect(context, 24, quoteY, 327, 166, 18, POSTER_COLORS.secondaryPale)
  context.fillStyle = POSTER_COLORS.ink
  context.font = '700 16px sans-serif'
  drawLines(context, wrapCanvasText(context, `“${model.quote}”`, 283, 5), 46, quoteY + 24, 25)

  const participantsY = quoteY + 188
  const participants = model.participants ?? ['对方人格', '我的人格']
  for (const [index, name] of participants.slice(0, 2).entries()) {
    const x = index === 0 ? 28 : 193
    fillRoundedRect(context, x, participantsY, 154, 66, 13, POSTER_COLORS.card)
    context.fillStyle = POSTER_COLORS.secondaryStrong
    context.font = '900 11px sans-serif'
    context.fillText(index === 0 ? 'A / 对方' : 'B / 我', x + 14, participantsY + 12)
    context.fillStyle = POSTER_COLORS.ink
    context.font = '800 15px sans-serif'
    drawLines(context, wrapCanvasText(context, name, 126, 2), x + 14, participantsY + 31, 18)
  }
}

export function drawPoster(
  canvas: any,
  model: PosterModel,
  pixelRatio: number,
  assets: PosterDrawAssets = {},
): { width: number; height: number } {
  const width = 375
  const height = 600
  const dpr = Math.max(1, Math.min(4, Number(pixelRatio) || 1))
  canvas.width = width * dpr
  canvas.height = height * dpr
  const context = canvas.getContext('2d')
  context.scale(dpr, dpr)
  context.__posterPixelRatio = dpr
  context.fillStyle = POSTER_COLORS.page
  context.fillRect(0, 0, width, height)
  context.textBaseline = 'top'
  if (model.kind === 'single') drawSinglePaper(context)
  drawPosterHeader(context, model, model.kind === 'single' ? POSTER_COLORS.primary : POSTER_COLORS.secondary)
  if (model.kind === 'single') drawSinglePoster(context, model, assets)
  else drawRelationshipPoster(context, model)

  if (model.kind === 'relationship') {
    context.fillStyle = POSTER_COLORS.inkSecondary
    context.font = '700 12px sans-serif'
    drawLines(context, String(model.footer).split('\n'), 28, 554, 17)
  }
  return { width, height }
}

function loadLocalCanvasImage(canvas: any, source: string): Promise<any | null> {
  if (typeof canvas?.createImage !== 'function') return Promise.resolve(null)
  return new Promise((resolve) => {
    const image = canvas.createImage()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = source
  })
}

export function createPosterImage(page: any, model: PosterModel): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery().in(page).select('#posterCanvas').fields({ node: true, size: true }).exec(async (result: any[]) => {
      const canvas = result?.[0]?.node
      if (!canvas) return reject(new Error('本地画布初始化失败'))
      try {
        const rawPixelRatio = wx.getWindowInfo?.().pixelRatio ?? wx.getSystemInfoSync?.().pixelRatio ?? 2
        const pixelRatio = Math.max(1, Math.min(4, Number(rawPixelRatio) || 1))
        const mascot = model.kind === 'single'
          ? await loadLocalCanvasImage(canvas, '/assets/mascot/result.png')
          : null
        const size = drawPoster(canvas, model, pixelRatio, { mascot })
        wx.canvasToTempFilePath({
          canvas, x: 0, y: 0, width: size.width, height: size.height,
          destWidth: size.width * pixelRatio, destHeight: size.height * pixelRatio,
          fileType: 'png', quality: 1,
          success: (response: { tempFilePath: string }) => resolve(response.tempFilePath),
          fail: (error: unknown) => reject(error),
        })
      } catch (error) {
        reject(error)
      }
    })
  })
}

function callWx(method: string, options: Record<string, unknown> = {}): Promise<any> {
  return new Promise((resolve, reject) => wx[method]({ ...options, success: resolve, fail: reject }))
}

const isAlbumPermissionError = (error: unknown): boolean => /auth|authorize|permission|deny/i.test(String((error as { errMsg?: string })?.errMsg ?? error))

export async function savePosterToAlbum(tempFilePath: string): Promise<'saved' | 'cancelled' | 'failed'> {
  try {
    await callWx('saveImageToPhotosAlbum', { filePath: tempFilePath })
    return 'saved'
  } catch (error) {
    if (!isAlbumPermissionError(error)) return 'failed'
  }
  const decision = await callWx('showModal', {
    title: '需要相册权限', content: '结果卡只保存在你的手机相册，不会上传。可以在设置里重新授权。',
    confirmText: '去设置', cancelText: '暂不保存',
  }).catch(() => ({ confirm: false }))
  if (!decision.confirm) return 'cancelled'
  const setting = await callWx('openSetting').catch(() => null)
  if (!setting?.authSetting?.['scope.writePhotosAlbum']) return 'cancelled'
  try {
    await callWx('saveImageToPhotosAlbum', { filePath: tempFilePath })
    return 'saved'
  } catch {
    return 'failed'
  }
}
