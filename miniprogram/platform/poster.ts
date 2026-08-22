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

export function drawPoster(canvas: any, model: PosterModel, pixelRatio: number): { width: number; height: number } {
  const width = 375
  const height = 600
  const dpr = Math.max(1, Math.min(4, Number(pixelRatio) || 1))
  canvas.width = width * dpr
  canvas.height = height * dpr
  const context = canvas.getContext('2d')
  context.scale(dpr, dpr)
  context.fillStyle = '#f8f3f8'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#ff4d8d'
  context.fillRect(0, 0, width, 9)
  context.textBaseline = 'top'
  context.fillStyle = '#6e5d73'
  context.font = '600 12px sans-serif'
  context.fillText(model.brand, 28, 28)
  context.fillStyle = '#9a55b7'
  context.font = '700 11px sans-serif'
  context.fillText(model.eyebrow, 28, 61)

  let y = 92
  if (model.score) {
    context.fillStyle = '#ff4d8d'
    context.font = '900 66px sans-serif'
    context.fillText(model.score, 28, y)
    y += 79
  }
  context.fillStyle = '#2f2733'
  context.font = '900 30px sans-serif'
  y = drawLines(context, wrapCanvasText(context, model.title, 319, 2), 28, y, 38) + 12
  if (model.subtitle) {
    context.fillStyle = '#7a5d16'
    context.font = '700 16px sans-serif'
    y = drawLines(context, wrapCanvasText(context, model.subtitle, 319, 1), 28, y, 24) + 18
  }

  roundedRect(context, 24, y, 327, model.kind === 'single' ? 236 : 210, 18)
  context.fillStyle = '#ffffff'
  context.fill()
  context.fillStyle = '#403746'
  context.font = '600 16px sans-serif'
  let cardY = drawLines(context, wrapCanvasText(context, `“${model.quote}”`, 283, model.kind === 'single' ? 3 : 4), 46, y + 24, 25) + 14
  if (model.participants?.length) {
    context.fillStyle = '#8b6a93'
    context.font = '600 13px sans-serif'
    cardY = drawLines(context, model.participants.map((name, index) => `${index === 0 ? 'A' : 'B'}：${name}`), 46, cardY, 23)
  } else {
    context.fillStyle = '#77657d'
    context.font = '500 13px sans-serif'
    for (const item of model.evidence.slice(0, 2)) {
      cardY = drawLines(context, wrapCanvasText(context, `· ${item}`, 283, 2), 46, cardY, 21) + 6
    }
  }

  context.fillStyle = '#756a79'
  context.font = '600 12px sans-serif'
  drawLines(context, String(model.footer).split('\n'), 28, 548, 19)
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
