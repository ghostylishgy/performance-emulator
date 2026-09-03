import { describe, expect, it } from 'vitest'
import { FREEPEP_ORDINARY_SIX_THREE, sanitizeFreePepRecord } from '../../scripts/textbook-catalog-source'
import { getBooksForTarget, groupBooksBySubject, textbookCatalog } from '../../miniprogram/pages/textbook-desk/catalog'

const rawBook = {
  id: '1212001601265',
  title: '义务教育教科书英语（PEP）（三年级起点）六年级上册',
  pdfurl: 'https://book.pep.com.cn/1212001601265/',
  xd: '小学',
  xk: '英语',
  nj: '六年级',
  cc: '上册',
  xdtype: FREEPEP_ORDINARY_SIX_THREE,
}

describe('textbook catalog contract', () => {
  it('accepts only exact ordinary six-three records and maps source fields explicitly', () => {
    expect(sanitizeFreePepRecord(rawBook, '2026-09-03')).toMatchObject({
      id: rawBook.id,
      stage: 'primary',
      grade: 'primary_6',
      term: 'upper',
      subject: 'english',
      schoolSystem: 'compulsory_6_3',
      variant: { id: 'english_pep_start_3' },
      officialReaderUrl: rawBook.pdfurl,
    })
    expect(sanitizeFreePepRecord({ ...rawBook, xdtype: '义务教育（五四学制）' }, '2026-09-03')).toBeNull()
    expect(sanitizeFreePepRecord({ ...rawBook, xdtype: '盲校（盲文版）' }, '2026-09-03')).toBeNull()
    expect(sanitizeFreePepRecord({ ...rawBook, nj: '七年级', xd: '小学' }, '2026-09-03')).toBeNull()
  })

  it('rejects arbitrary reader URLs, unsupported terms, and invented verification dates', () => {
    expect(sanitizeFreePepRecord({ ...rawBook, pdfurl: 'https://example.com/book' }, '2026-09-03')).toBeNull()
    expect(sanitizeFreePepRecord({ ...rawBook, cc: '全一册' }, '2026-09-03')).toBeNull()
    expect(sanitizeFreePepRecord(rawBook, 'latest')).toBeNull()
  })

  it('ships only the manually reviewed launch slice and supports missing or multiple subject books', () => {
    expect(textbookCatalog).toHaveLength(17)
    expect(getBooksForTarget('primary_1_upper')).toEqual([])
    expect(getBooksForTarget('primary_6_upper').filter((book) => book.subject === 'english')).toHaveLength(3)
    expect(getBooksForTarget('junior_7_upper')).toHaveLength(7)
    expect(groupBooksBySubject(getBooksForTarget('primary_6_upper')).find((group) => group.subject === 'english')?.books).toHaveLength(3)
  })

  it('keeps every runtime URL on the numeric official reader allowlist', () => {
    expect(new Set(textbookCatalog.map((book) => book.id)).size).toBe(textbookCatalog.length)
    for (const book of textbookCatalog) {
      expect(book.officialReaderUrl).toBe(`https://book.pep.com.cn/${book.id}/`)
      expect(book.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('does not fabricate unsupported edition or official-partnership claims', () => {
    const serialized = JSON.stringify(textbookCatalog)
    for (const forbidden of ['2024版', '最新版', '新课标', '武汉主流版本', '地区统一教材', '官方合作', 'ISBN', '页数', '全套']) {
      expect(serialized).not.toContain(forbidden)
    }
  })
})
