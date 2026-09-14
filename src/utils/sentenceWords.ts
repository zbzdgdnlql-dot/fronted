/** 逐词渲染中的一个词：带词后标点，便于把原句标点补回 */
export type SentenceWord = {
  /** 展示用词文本（优先取自原句，保留原大小写与拼写） */
  value: string
  /** 在原始词列表中的下标，用于取分数与发音区间 */
  index: number
  /** 紧贴该词尾的标点，如 "," / "。"（空格交给布局间距，这里已剔除） */
  suffix: string
}

export type SentenceWordLayout = {
  /** 句首词之前的标点（如起始引号），无则为空串 */
  prefix: string
  words: SentenceWord[]
}

/** 撇号/引号常有排版差异，统一成半角再比较；1:1 替换不改变字符下标 */
const normalize = (value: string) => value.replace(/[’‘`´]/g, "'").toLowerCase()

/**
 * 后端只下发词列表（不含标点），逐词渲染会丢掉标点。
 * 这里按顺序在原句文本里定位每个词，词与词之间的字符即该词后的标点，
 * 句首之前与句末剩余的字符分别并入 prefix 与末词 suffix。
 */
export function matchSentenceWords(
  text: string | null | undefined,
  words: string[],
): SentenceWordLayout {
  const source = text ?? ''
  const haystack = normalize(source)
  const matched: SentenceWord[] = []
  let prefix = ''
  let cursor = 0
  // 上一个入列的词是否真的还在原句里：定位失败时句尾残余不能并到它身上
  let lastLocated = false

  words.forEach((word, index) => {
    if (!word) return
    let found = source.indexOf(word, cursor)
    if (found < 0) found = haystack.indexOf(normalize(word), cursor)
    if (found < 0) {
      // 原句里定位不到该词：退化为纯词展示，游标不前进
      matched.push({ value: word, index, suffix: '' })
      lastLocated = false
      return
    }
    const gap = source.slice(cursor, found).replace(/\s+/g, '')
    if (matched.length) matched[matched.length - 1].suffix += gap
    else prefix += gap
    matched.push({ value: source.slice(found, found + word.length), index, suffix: '' })
    cursor = found + word.length
    lastLocated = true
  })

  if (lastLocated) {
    const tail = source.slice(cursor).replace(/\s+/g, '')
    if (tail && matched.length) matched[matched.length - 1].suffix += tail
  }
  return { prefix, words: matched }
}
