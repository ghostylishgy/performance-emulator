const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const collection = db.collection('pair_results')
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const expiresInMs = 7 * 24 * 60 * 60 * 1000
const personaIds = new Set(['single_point_failure','invisible_contributor','result_captioner','wild_middleware','reality_patcher','desk_firewall','org_weather_station','stable_worker'])
const outcomes = new Set(['3.25','3.5-','3.5','3.5+','3.75','4.0'])
const deathCauses = new Set(['strategy_faded','credit_unclear','quota_tight','visibility_lag','civilized_boundary','impact_not_enough','none'])

function shortCode() {
  const bytes = crypto.randomBytes(6)
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('')
}

function validSnapshot(value) {
  return value && personaIds.has(value.persona) && outcomes.has(value.score) && deathCauses.has(value.deathCause)
    && typeof value.evaluationVersion === 'string' && value.evaluationVersion.length <= 40
}

async function create(snapshot) {
  if (!validSnapshot(snapshot)) return { ok: false, error: '结果数据无效' }
  const createdAt = Date.now()
  const expiresAt = createdAt + expiresInMs
  const resultId = crypto.randomUUID()
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = shortCode()
    try {
      await collection.add({ data: {
        _id: code, resultId, code, createdAt, expiresAt,
        persona: snapshot.persona, score: snapshot.score,
        deathCause: snapshot.deathCause, evaluationVersion: snapshot.evaluationVersion,
      } })
      return { ok: true, code, expiresAt }
    } catch (error) {
      if (attempt === 5) return { ok: false, error: '短码暂时生成失败' }
    }
  }
  return { ok: false, error: '短码暂时生成失败' }
}

async function resolve(code) {
  if (typeof code !== 'string' || !/^[2-9A-HJ-NP-Z]{6}$/.test(code)) return { ok: false, status: 'invalid' }
  try {
    const response = await collection.doc(code).get()
    const record = response.data
    if (!record || record.expiresAt <= Date.now()) return { ok: false, status: 'expired' }
    return { ok: true, result: {
      resultId: record.resultId, persona: record.persona, score: record.score,
      deathCause: record.deathCause, evaluationVersion: record.evaluationVersion,
    } }
  } catch {
    return { ok: false, status: 'invalid' }
  }
}

exports.main = async (event) => {
  if (event.action === 'create') return create(event.snapshot)
  if (event.action === 'resolve') return resolve(String(event.code || '').toUpperCase())
  return { ok: false, error: '未知操作' }
}
