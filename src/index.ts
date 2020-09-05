type Union<A, B> = any extends A ? B : A | B

export interface Sym<T, S extends string, P extends boolean | null> {
  (a: typeof any): Sym<T, S, null>
  (a: typeof head): P extends null ? Sym<T, S, null> : Sym<T, S, true>
  (a: typeof tail): P extends null ? Sym<T, S, null> : Sym<T, S, true>
  (a: undefined): Sym<Union<T, undefined>, S, P>
  (a: null): Sym<Union<T, null>, S, P>
  (a: RegExp): Sym<Union<T, string>, S, P>
  (a: BooleanConstructor): Sym<Union<T, boolean>, S, P>
  (a: NumberConstructor): Sym<Union<T, number>, S, P>
  (a: StringConstructor): Sym<Union<T, string>, S, P>
  (a: SymbolConstructor): Sym<Union<T, symbol>, S, P>
  (a: ArrayConstructor): Sym<Union<T, any[]>, S, P>
  (a: ObjectConstructor): Sym<Union<T, Record<keyof any, unknown>>, S, P>
  <C>(a: C): C extends new (...args: any) => infer R ? Sym<Union<T, R>, S, P> : never
  filter(fn: (value: T) => boolean): Sym<T, S, P>
  readonly symbol: S
  readonly match: any extends T ? false : ((value: any) => value is T)
  readonly filters: (value: any) => boolean
  readonly any: boolean
  readonly spread?: () => void
}

type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

type SymToRecord<T> =
  T extends Sym<infer A, infer S, infer R>
    ? false extends R
      ? { [K in S]: A }
      : true extends R
        ? { [K in S]: A[] }
        // eslint-disable-next-line @typescript-eslint/ban-types
        : {}
  // eslint-disable-next-line @typescript-eslint/ban-types
    : {}

type Flatten<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  0: {}
  1: SymToRecord<T>
  2: T extends { [K in keyof T]: infer R } ? Flatten<R> : never
}[T extends Sym<any, string, boolean>
  ? 1
  : T extends Record<keyof any, any> | any[]
    ? 2
    : 0
]

export type MatchedType<T> = UnionToIntersection<Flatten<T>>

type UnionMatcher<T, U, P> = P extends Sym<infer R, string, boolean>
  ? any extends R
    ? Matcher<Exclude<T, undefined> | U>
    : Matcher<T | U>
  : Matcher<T | U>

export interface Matcher<T> {
  (): T
  <P, U = MatchedType<P>>(pattern: P, returnValue?: U): UnionMatcher<T, U, P>
  <P, U = MatchedType<P>>(pattern: P, fn?: (x: MatchedType<P>) => U): UnionMatcher<T, U, P>
  case: Matcher<T>
  end: () => T
}

if (!Array.isArray) {
  Array.isArray = function(arg: any): arg is any[] {
    return Object.prototype.toString.call(arg) === "[object Array]"
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function any(): void {}
any.any = true

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function head(): void {}
head.head = true

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function tail(): void {}
tail.tail = true

const undefinedMatcher = (value: any) => value === undefined
const nullMatcher = (value: any) => value === null
const booleanMatcher = (value: any) => typeof value === "boolean" || value instanceof Boolean
const numberMatcher = (value: any) => typeof value === "number" || value instanceof Number
const stringMatcher = (value: any) => typeof value === "string" || value instanceof String
const arrayMatcher = (value: any) => Array.isArray(value)
const objectMatcher = (value: any) => value && typeof value === "object" && !Array.isArray(value)
const symbolMatcher = (value: any) => typeof value === "symbol"

function typeMatcher(c: any): ((value: any) => boolean) | false {
  if (c === undefined) {
    return undefinedMatcher
  } else if (c === null) {
    return nullMatcher
  } else if (c === Boolean) {
    return booleanMatcher
  } else if (c === Number) {
    return numberMatcher
  } else if (c === String) {
    return stringMatcher
  } else if (c === Array) {
    return arrayMatcher
  } else if (c === Object) {
    return objectMatcher
  } else if (typeof Symbol === "function" && c === Symbol) {
    return symbolMatcher
  } else if (c instanceof RegExp) {
    return (value: any) => typeof value === "string" && c.test(value)
  } else if (typeof c === "function") {
    return (value: any) => value instanceof c
  } else {
    return false
  }
}

function cloneSym(obj: any): any {
  const newObj: any = sym(obj.symbol)
  newObj.match = obj.match
  newObj.spread = obj.spread
  newObj.any = obj.any
  newObj.filters = obj.filters
  return newObj
}

export function sym<S extends string>(symbol: S): Sym<any, S, false> {
  const obj = function(a: any) {
    const newObj = cloneSym(obj)
    const match = newObj.match
    if (a === head) {
      newObj.spread = head
      return newObj
    }
    if (a === tail) {
      newObj.spread = tail
      return newObj
    }
    if (a === any) {
      newObj.any = true
      return newObj
    }
    const matcher = typeMatcher(a)
    if (matcher) {
      newObj.match = (value: any) => (match && match(value)) || matcher(value)
    } else {
      throw new Error(`${a} is not a function`)
    }
    return newObj
  }
  obj.filter = (fn: (value: any) => boolean) => {
    const newObj = cloneSym(obj)
    const filters = newObj.filters
    newObj.filters = (value: any) => filters(value) && fn(value)
    return newObj
  }
  obj.symbol = symbol
  obj.match = false as const
  obj.filters = () => true
  obj.any = false
  return obj as Sym<any, S, false>
}

function isSym(value: any): value is Sym<any, string, boolean> {
  return typeof value === "function" && typeof value.symbol === "string"
}

function check(value: unknown, pattern: any, prevMatch: Record<string, any>): Record<string, any> | null {
  if (pattern === any) return {}
  if (isSym(pattern)) {
    const sym = pattern.symbol
    if (!pattern.any && sym in prevMatch) {
      if (prevMatch[sym] !== value) return null
    }
    const match = pattern.match as false | ((value: any) => boolean)
    if (match && !match(value)) return null
    if (!pattern.filters(value)) return null
    const output: any = {}
    if (!pattern.any) {
      output[sym] = value
    }
    return output
  }
  if (pattern === value) return {}
  if (!pattern) return null
  const matcher = typeMatcher(pattern)
  if (matcher && matcher(value)) return {}
  if (typeof pattern !== "object" || typeof value !== "object") return null
  if (Array.isArray(pattern)) {
    if (!Array.isArray(value)) return null
    let n = pattern.length
    if (n === 0) return {}
    const first = pattern[0]
    const isHead = first === head || (isSym(first) && first.spread === head)
    const last = pattern[n - 1]
    const isTail = last === tail || (isSym(last) && last.spread === tail)
    if (isHead && isTail) return null
    if (isHead || isTail) {
      if (value.length + 1 < n) return null
    } else if (value.length < n) {
      return null
    }
    const rs: Record<string, any> = {}
    let i = 0
    let k = 0
    if (isTail) {
      --n
      if (last !== tail) {
        const match = last.match as false | ((value: any) => boolean)
        for (let j = n; j < value.length; ++j) {
          if (match && !match(value[j])) return null
        }
        if (!last.any) {
          rs[(last as any).symbol] = value.slice(n)
        }
      }
    } else if (isHead) {
      i = value.length - n + 1
      k = i - 1
      n = value.length
      if (first !== head) {
        const match = first.match as false | ((value: any) => boolean)
        for (let j = 0; j < i; ++j) {
          if (match && !match(value[j])) return null
        }
        if (!first.any) {
          rs[(first as any).symbol] = value.slice(0, i)
        }
      }
    } else if (value.length !== pattern.length) {
      return null
    }
    for (; i < n; ++i) {
      const v = value[i]
      const p = pattern[i - k]
      const r = check(v, p, rs)
      if (r === null) return null
      Object.assign(rs, r)
    }
    return rs
  } else {
    const rs: Record<string, any> = {}
    for (const key in pattern) {
      const v = (value as any)[key]
      const r = check(v, pattern[key], rs)
      if (r === null) return null
      Object.assign(rs, r)
    }
    return rs
  }
}

export function when(value: unknown): Matcher<undefined> {
  const matcher = (...args: any[]) => {
    if (args.length === 0) return undefined
    const pattern = args[0]
    const fn = args[1]
    const records = check(value, pattern, {})
    if (records) {
      let result: any
      if (fn === undefined) {
        result = records
      } else if (typeof fn !== "function") {
        result = fn
      } else {
        result = fn(records)
      }
      const resolved: any = (...args: any[]) => {
        if (args.length === 0) return result
        return resolved
      }
      resolved.case = resolved
      resolved.end = () => result
      return resolved
    }
    return matcher
  }
  matcher.case = matcher
  matcher.end = () => undefined
  return matcher
}

export function match<P>(value: unknown, pattern: P): MatchedType<P> | undefined {
  return when(value)(pattern)()
}

export const A = sym("A")
export const B = sym("B")
export const C = sym("C")
export const D = sym("D")
export const E = sym("E")
export const F = sym("F")
export const G = sym("G")
export const H = sym("H")
export const I = sym("I")
export const J = sym("J")
export const K = sym("K")
export const L = sym("L")
export const M = sym("M")
export const N = sym("N")
export const O = sym("O")
export const P = sym("P")
export const Q = sym("Q")
export const R = sym("R")
export const S = sym("S")
export const T = sym("T")
export const U = sym("U")
export const V = sym("V")
export const W = sym("W")
export const X = sym("X")
export const Y = sym("Y")
export const Z = sym("Z")

export const a = sym("a")
export const b = sym("b")
export const c = sym("c")
export const d = sym("d")
export const e = sym("e")
export const f = sym("f")
export const g = sym("g")
export const h = sym("h")
export const i = sym("i")
export const j = sym("j")
export const k = sym("k")
export const l = sym("l")
export const m = sym("m")
export const n = sym("n")
export const o = sym("o")
export const p = sym("p")
export const q = sym("q")
export const r = sym("r")
export const s = sym("s")
export const t = sym("t")
export const u = sym("u")
export const v = sym("v")
export const w = sym("w")
export const x = sym("x")
export const y = sym("y")
export const z = sym("z")

export const _ = sym("")(any)
