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
  for (const paragraph of String(text ?? '').split('\n')) {
    if (!paragraph) { lines.push(''); continue }
    let line = ''
    for (const char of [...paragraph]) {
      const candidate = `${line}${char}`
      if (line && context.measureText(candidate).width > maxWidth) {
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
} as const

function fillRoundedRect(context: any, x: number, y: number, width: number, height: number, radius: number, color: string): void {
  roundedRect(context, x, y, width, height, radius)
  context.fillStyle = color
  context.fill()
}

function drawPosterHeader(context: any, model: PosterModel, spineColor: string): void {
  context.fillStyle = spineColor
  context.fillRect(0, 0, 9, 600)
  context.fillStyle = POSTER_COLORS.inkSecondary
  context.font = '700 12px sans-serif'
  context.fillText(model.brand, 28, 25)
  context.fillStyle = POSTER_COLORS.secondaryStrong
  context.font = '800 11px sans-serif'
  context.fillText(model.kind === 'single' ? 'PERFORMANCE RECORD · V3' : 'RELATIONSHIP REVIEW · V3', 28, 54)
  fillRoundedRect(context, 296, 23, 52, 24, 5, model.kind === 'single' ? POSTER_COLORS.primaryPale : POSTER_COLORS.secondaryPale)
  context.fillStyle = model.kind === 'single' ? POSTER_COLORS.primaryStrong : POSTER_COLORS.secondaryStrong
  context.font = '900 10px sans-serif'
  context.fillText('INTERNAL', 304, 30)
}

function drawSinglePoster(context: any, model: PosterModel): void {
  context.fillStyle = POSTER_COLORS.primaryStrong
  context.font = '900 38px sans-serif'
  let y = drawLines(context, wrapCanvasText(context, model.title, 319, 2), 28, 84, 45) + 8

  const quoteY = Math.max(158, y)
  fillRoundedRect(context, 24, quoteY, 327, 112, 17, POSTER_COLORS.primaryPale)
  context.fillStyle = POSTER_COLORS.ink
  context.font = '700 15px sans-serif'
  drawLines(context, wrapCanvasText(context, `“${model.quote}”`, 283, 3), 46, quoteY + 20, 23)

  const factY = quoteY + 130
  context.fillStyle = POSTER_COLORS.muted
  context.font = '800 11px sans-serif'
  context.fillText('FINAL RESULT', 28, factY)
  context.fillText('PRIMARY CAUSE', 142, factY)
  context.fillStyle = POSTER_COLORS.primary
  context.font = '900 36px sans-serif'
  context.fillText(model.score ?? '—', 28, factY + 16)
  fillRoundedRect(context, 138, factY + 14, 213, 48, 10, POSTER_COLORS.accentSoft)
  context.fillStyle = '#725819'
  context.font = '800 13px sans-serif'
  drawLines(context, wrapCanvasText(context, model.subtitle.replace(/^主要死因：/, ''), 185, 2), 152, factY + 25, 18)

  const evidenceY = factY + 82
  context.fillStyle = POSTER_COLORS.secondaryStrong
  context.font = '800 11px sans-serif'
  context.fillText('SYSTEM CAPTURE / 系统抓包', 28, evidenceY)
  let itemY = evidenceY + 23
  for (const [index, item] of model.evidence.slice(0, 2).entries()) {
    fillRoundedRect(context, 28, itemY + 1, 19, 19, 5, POSTER_COLORS.secondaryPale)
    context.fillStyle = POSTER_COLORS.secondaryStrong
    context.font = '900 10px sans-serif'
    context.fillText(String(index + 1).padStart(2, '0'), 32, itemY + 5)
    context.fillStyle = POSTER_COLORS.inkSecondary
    context.font = '600 13px sans-serif'
    const lines = wrapCanvasText(context, item, 280, 2)
    itemY = drawLines(context, lines, 58, itemY + 1, 18) + 8
  }
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

export function drawPoster(canvas: any, model: PosterModel, pixelRatio: number): { width: number; height: number } {
  const width = 375
  const height = 600
  const dpr = Math.max(1, Math.min(4, Number(pixelRatio) || 1))
  canvas.width = width * dpr
  canvas.height = height * dpr
  const context = canvas.getContext('2d')
  context.scale(dpr, dpr)
  context.fillStyle = POSTER_COLORS.page
  context.fillRect(0, 0, width, height)
  context.textBaseline = 'top'
  drawPosterHeader(context, model, model.kind === 'single' ? POSTER_COLORS.primary : POSTER_COLORS.secondary)
  if (model.kind === 'single') drawSinglePoster(context, model)
  else drawRelationshipPoster(context, model)

  context.fillStyle = POSTER_COLORS.inkSecondary
  context.font = '700 12px sans-serif'
  drawLines(context, String(model.footer).split('\n'), 28, 554, 17)
  return { width, height }
}

export function createPosterImage(page: any, model: PosterModel): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery().in(page).select('#posterCanvas').fields({ node: true, size: true }).exec((result: any[]) => {
      const canvas = result?.[0]?.node
      if (!canvas) return reject(new Error('本地画布初始化失败'))
      const rawPixelRatio = wx.getWindowInfo?.().pixelRatio ?? wx.getSystemInfoSync?.().pixelRatio ?? 2
      const pixelRatio = Math.max(1, Math.min(4, Number(rawPixelRatio) || 1))
      const size = drawPoster(canvas, model, pixelRatio)
      wx.canvasToTempFilePath({
        canvas, x: 0, y: 0, width: size.width, height: size.height,
        destWidth: size.width * pixelRatio, destHeight: size.height * pixelRatio,
        fileType: 'png', quality: 1,
        success: (response: { tempFilePath: string }) => resolve(response.tempFilePath),
        fail: (error: unknown) => reject(error),
      })
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
