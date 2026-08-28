import type {
  LoveAnswers,
  LoveCombinationRule,
  LoveAnswerId,
  LovePersonaDefinition,
  LovePersonaId,
  LoveScores,
} from './types'
import { loveResultCards } from './result-cards'

export const lovePersonas: LovePersonaDefinition[] = [
  { id: 'MOON', name: '白月光拨款主任', baseline: 7, priority: 0, resultCard: loveResultCards.MOON ?? null },
  { id: 'AUDIT', name: '分手审计合伙人', baseline: 10, priority: 1, resultCard: loveResultCards.AUDIT ?? null },
  { id: 'REFUND', name: '仅退款终身战神', baseline: 10, priority: 2, resultCard: loveResultCards.REFUND ?? null },
  { id: 'AI', name: 'AI劝退钉子户', baseline: 9, priority: 3, resultCard: loveResultCards.AI ?? null },
  { id: 'PRIVATE', name: '被窝叫妈体验官', baseline: 7, priority: 4, resultCard: loveResultCards.PRIVATE ?? null },
  { id: 'EVIDENCE', name: '宝宝变被告标兵', baseline: 10, priority: 5, resultCard: loveResultCards.EVIDENCE ?? null },
  { id: 'DD', name: '四十页尽调情种', baseline: 11, priority: 6, resultCard: loveResultCards.DD ?? null },
  { id: 'DOUBLE', name: '双标套利艺术家', baseline: 12, priority: 7, resultCard: loveResultCards.DOUBLE ?? null },
  { id: 'POMP', name: '排场买单冤种王', baseline: 7, priority: 8, resultCard: loveResultCards.POMP ?? null },
  { id: 'CARD3', name: '第三张卡肉痛症', baseline: 7, priority: 9, resultCard: loveResultCards.CARD3 ?? null },
  { id: 'FUTURE', name: '过期未来守墓人', baseline: 11, priority: 10, resultCard: loveResultCards.FUTURE ?? null },
  { id: 'DIGNITY', name: '体面破产成年人', baseline: 12, priority: 11, resultCard: loveResultCards.DIGNITY ?? null },
]

export const loveCombinationRules: LoveCombinationRule[] = [
  { id: 'double_due_diligence_c', label: '尽调双标', conditions: [{ questionId: 'Q5', answers: ['B', 'C', 'D'] }, { questionId: 'Q11', answers: ['C'] }], bonuses: { DOUBLE: 5 } },
  { id: 'double_due_diligence_d', label: '尽调双标', conditions: [{ questionId: 'Q5', answers: ['B', 'C', 'D'] }, { questionId: 'Q11', answers: ['D'] }], bonuses: { DOUBLE: 3 } },
  { id: 'double_gift', label: '礼物双标', conditions: [{ questionId: 'Q7', answers: ['B', 'C', 'D'] }, { questionId: 'Q10', answers: ['B', 'D'] }], bonuses: { DOUBLE: 6 } },
  { id: 'refund_consistent_clearance', label: '一致清仓', conditions: [{ questionId: 'Q7', answers: ['B', 'C'] }, { questionId: 'Q10', answers: ['A'] }], bonuses: { REFUND: 3 } },
  { id: 'dd_consistent_risk', label: '一致风控', conditions: [{ questionId: 'Q5', answers: ['B', 'C', 'D'] }, { questionId: 'Q11', answers: ['A', 'B'] }], bonuses: { DD: 3 } },
  { id: 'dd_consistent_risk_deep', label: '一致风控额外项', conditions: [{ questionId: 'Q5', answers: ['B', 'C', 'D'] }, { questionId: 'Q11', answers: ['A', 'B'] }, { questionId: 'Q6', answers: ['D'] }, { questionId: 'Q8', answers: ['C', 'D'] }], bonuses: { DD: 2 } },
  { id: 'evidence_early_trace', label: '热恋期就留痕', conditions: [{ questionId: 'Q8', answers: ['C', 'D'] }, { questionId: 'Q13', answers: ['C', 'D'] }], bonuses: { EVIDENCE: 4 } },
  { id: 'audit_closed_loop', label: '审计闭环', conditions: [{ questionId: 'Q7', answers: ['C', 'D'] }, { questionId: 'Q9', answers: ['B'] }], bonuses: { AUDIT: 4 } },
  { id: 'future_residue', label: '残留未来', conditions: [{ questionId: 'Q14', answers: ['B', 'C'] }, { questionId: 'Q15', answers: ['B', 'C', 'D'] }], bonuses: { FUTURE: 4 } },
  { id: 'private_habit_residue', label: '私人习惯残留', conditions: [{ questionId: 'Q3', answers: ['B', 'C', 'D'] }, { questionId: 'Q15', answers: ['B', 'C', 'D'] }], bonuses: { PRIVATE: 2 } },
  { id: 'pomp_private_cinema_card', label: '霸总充值', conditions: [{ questionId: 'Q2', answers: ['C'] }, { questionId: 'Q4', answers: ['A'] }], bonuses: { POMP: 3 } },
  { id: 'pomp_private_cinema_moon', label: '霸总充值', conditions: [{ questionId: 'Q2', answers: ['C'] }, { questionId: 'Q1', answers: ['B'] }], bonuses: { POMP: 2 } },
  { id: 'moon_special_budget', label: '白月光专项预算', conditions: [{ questionId: 'Q1', answers: ['B'] }, { questionId: 'Q4', answers: ['A'] }], bonuses: { MOON: 4 } },
  { id: 'ai_resistance', label: '执念抗药性', conditions: [{ questionId: 'Q6', answers: ['B', 'C'] }, { questionId: 'Q12', answers: ['C'] }], bonuses: { AI: 4 } },
  { id: 'dignity_gift_consistency', label: '礼物一致性', conditions: [{ questionId: 'Q7', answers: ['A'] }, { questionId: 'Q10', answers: ['A'] }], bonuses: { DIGNITY: 3 } },
  { id: 'dignity_red_light', label: '隐藏红灯组合', conditions: [{ questionId: 'Q14', answers: ['A'] }, { questionId: 'Q16', answers: ['B'] }], bonuses: { DIGNITY: 5 }, hiddenBadge: 'red_light_still_waiting' },
]

const oneOf = (answers: LoveAnswers, questionId: `Q${number}`, expected: LoveAnswerId[]): boolean => {
  const answer = answers[questionId]
  return answer !== undefined && expected.includes(answer)
}

export const loveActivationGates: Record<LovePersonaId, (answers: LoveAnswers, rawScores: LoveScores) => boolean> = {
  MOON: (answers) => answers.Q1 === 'B' || (answers.Q1 === 'D' && answers.Q4 === 'A'),
  POMP: (answers) => oneOf(answers, 'Q2', ['B', 'C']),
  PRIVATE: (answers) => oneOf(answers, 'Q3', ['B', 'C', 'D']),
  CARD3: (answers) => oneOf(answers, 'Q4', ['B', 'C', 'D']),
  DD: (answers) => oneOf(answers, 'Q5', ['B', 'C', 'D']) || answers.Q6 === 'D',
  AI: (answers) => oneOf(answers, 'Q6', ['B', 'C']),
  REFUND: (answers) => oneOf(answers, 'Q7', ['B', 'C']) || answers.Q12 === 'B',
  AUDIT: (answers, rawScores) => answers.Q9 === 'B'
    || (rawScores.AUDIT >= 6 && (oneOf(answers, 'Q7', ['C', 'D']) || oneOf(answers, 'Q13', ['C', 'D']))),
  EVIDENCE: (answers) => oneOf(answers, 'Q8', ['C', 'D']) || oneOf(answers, 'Q13', ['C', 'D']),
  DOUBLE: (answers) => (
    oneOf(answers, 'Q7', ['B', 'C', 'D']) && oneOf(answers, 'Q10', ['B', 'D'])
  ) || (
    oneOf(answers, 'Q5', ['B', 'C', 'D']) && oneOf(answers, 'Q11', ['C', 'D'])
  ),
  FUTURE: (answers) => oneOf(answers, 'Q14', ['B', 'C']) || oneOf(answers, 'Q15', ['B', 'C', 'D']),
  DIGNITY: (answers) => oneOf(answers, 'Q16', ['B', 'C', 'D'])
    && (answers.Q7 === 'A' || answers.Q10 === 'A' || answers.Q14 === 'A'),
}
