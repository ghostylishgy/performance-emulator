export interface QuestionDurationState {
  accumulatedMs: number
  runningSince: number | null
}

const safeNow = (now: number): number => Number.isFinite(now) && now >= 0 ? now : 0
const safeElapsed = (start: number, end: number): number => Math.max(0, safeNow(end) - safeNow(start))

export function startQuestionDuration(now = Date.now()): QuestionDurationState {
  return { accumulatedMs: 0, runningSince: safeNow(now) }
}

export function pauseQuestionDuration(state: QuestionDurationState, now = Date.now()): QuestionDurationState {
  if (state.runningSince === null) return state
  return {
    accumulatedMs: Math.max(0, state.accumulatedMs) + safeElapsed(state.runningSince, now),
    runningSince: null,
  }
}

export function resumeQuestionDuration(state: QuestionDurationState, now = Date.now()): QuestionDurationState {
  return state.runningSince === null ? { ...state, runningSince: safeNow(now) } : state
}

export function finishQuestionDuration(state: QuestionDurationState, now = Date.now()): number {
  const duration = state.accumulatedMs + (state.runningSince === null ? 0 : safeElapsed(state.runningSince, now))
  return Number.isFinite(duration) ? Math.max(0, Math.round(duration)) : 0
}
