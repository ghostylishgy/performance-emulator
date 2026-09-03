import { TEXTBOOK_SCHOOL_SYSTEM, type TextbookRecord, type TextbookSubjectId, type TextbookTargetId } from './types'
import { getTextbookTarget } from './targets'

const VERIFIED_AT = '2026-09-03'

export const textbookCatalog: readonly TextbookRecord[] = [
  { id: '1211001601261', title: '义务教育教科书语文六年级上册', stage: 'primary', grade: 'primary_6', term: 'upper', subject: 'chinese', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1211001601261/', verifiedAt: VERIFIED_AT },
  { id: '1221001601261', title: '义务教育教科书数学六年级上册', stage: 'primary', grade: 'primary_6', term: 'upper', subject: 'mathematics', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1221001601261/', verifiedAt: VERIFIED_AT },
  { id: '1212001601264', title: '义务教育教科书 英语 （精通）（三年级起点）六年级上册', stage: 'primary', grade: 'primary_6', term: 'upper', subject: 'english', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, variant: { id: 'english_jing_tong_start_3', label: '精通（三年级起点）' }, officialReaderUrl: 'https://book.pep.com.cn/1212001601264/', verifiedAt: VERIFIED_AT },
  { id: '1212001601143', title: '义务教育教科书英语（一年级起点）六年级上册', stage: 'primary', grade: 'primary_6', term: 'upper', subject: 'english', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, variant: { id: 'english_start_1', label: '一年级起点' }, officialReaderUrl: 'https://book.pep.com.cn/1212001601143/', verifiedAt: VERIFIED_AT },
  { id: '1212001601265', title: '义务教育教科书英语（PEP）（三年级起点）六年级上册', stage: 'primary', grade: 'primary_6', term: 'upper', subject: 'english', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, variant: { id: 'english_pep_start_3', label: 'PEP（三年级起点）' }, officialReaderUrl: 'https://book.pep.com.cn/1212001601265/', verifiedAt: VERIFIED_AT },
  { id: '1211001602191', title: '义务教育教科书 语文 六年级下册', stage: 'primary', grade: 'primary_6', term: 'lower', subject: 'chinese', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1211001602191/', verifiedAt: VERIFIED_AT },
  { id: '1221001602141', title: '义务教育教科书 数学 六年级下册', stage: 'primary', grade: 'primary_6', term: 'lower', subject: 'mathematics', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1221001602141/', verifiedAt: VERIFIED_AT },
  { id: '1212001602144', title: '义务教育教科书 英语 （精通）（三年级起点）六年级下册', stage: 'primary', grade: 'primary_6', term: 'lower', subject: 'english', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, variant: { id: 'english_jing_tong_start_3', label: '精通（三年级起点）' }, officialReaderUrl: 'https://book.pep.com.cn/1212001602144/', verifiedAt: VERIFIED_AT },
  { id: '1212001602143', title: '义务教育教科书 英语（一年级起点）六年级下册', stage: 'primary', grade: 'primary_6', term: 'lower', subject: 'english', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, variant: { id: 'english_start_1', label: '一年级起点' }, officialReaderUrl: 'https://book.pep.com.cn/1212001602143/', verifiedAt: VERIFIED_AT },
  { id: '1212001602145', title: '义务教育教科书 英语 （PEP）（三年级起点）六年级下册', stage: 'primary', grade: 'primary_6', term: 'lower', subject: 'english', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, variant: { id: 'english_pep_start_3', label: 'PEP（三年级起点）' }, officialReaderUrl: 'https://book.pep.com.cn/1212001602145/', verifiedAt: VERIFIED_AT },
  { id: '1311001101241', title: '义务教育教科书语文七年级上册', stage: 'junior', grade: 'junior_7', term: 'upper', subject: 'chinese', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1311001101241/', verifiedAt: VERIFIED_AT },
  { id: '1321001101241', title: '义务教育教科书数学七年级上册', stage: 'junior', grade: 'junior_7', term: 'upper', subject: 'mathematics', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1321001101241/', verifiedAt: VERIFIED_AT },
  { id: '1312001101241', title: '义务教育教科书英语七年级上册', stage: 'junior', grade: 'junior_7', term: 'upper', subject: 'english', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1312001101241/', verifiedAt: VERIFIED_AT },
  { id: '1384001101241', title: '义务教育教科书道德与法治七年级上册', stage: 'junior', grade: 'junior_7', term: 'upper', subject: 'morality_law', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1384001101241/', verifiedAt: VERIFIED_AT },
  { id: '1337001101241', title: '义务教育教科书 中国历史 七年级 上册', stage: 'junior', grade: 'junior_7', term: 'upper', subject: 'history', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1337001101241/', verifiedAt: VERIFIED_AT },
  { id: '1338001101241', title: '义务教育教科书地理七年级上册', stage: 'junior', grade: 'junior_7', term: 'upper', subject: 'geography', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1338001101241/', verifiedAt: VERIFIED_AT },
  { id: '1343001101241', title: '义务教育教科书生物学七年级上册', stage: 'junior', grade: 'junior_7', term: 'upper', subject: 'biology', schoolSystem: TEXTBOOK_SCHOOL_SYSTEM, officialReaderUrl: 'https://book.pep.com.cn/1343001101241/', verifiedAt: VERIFIED_AT },
]

export interface TextbookSubjectGroup {
  subject: TextbookSubjectId
  books: readonly TextbookRecord[]
}

export function getBooksForTarget(targetId: TextbookTargetId): readonly TextbookRecord[] {
  const target = getTextbookTarget(targetId)
  return textbookCatalog.filter((book) => book.grade === target.grade && book.term === target.term)
}

export function groupBooksBySubject(books: readonly TextbookRecord[]): readonly TextbookSubjectGroup[] {
  const groups = new Map<TextbookSubjectId, TextbookRecord[]>()
  for (const book of books) {
    const group = groups.get(book.subject) ?? []
    group.push(book)
    groups.set(book.subject, group)
  }
  return [...groups].map(([subject, groupedBooks]) => ({ subject, books: groupedBooks }))
}
