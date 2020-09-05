import { when, A, B, C, any, _, head, tail } from "../dist"
import chai, { expect } from "chai"
import chaiThings from "chai-things"

chai.should()
chai.use(chaiThings)

describe("Test symbol", () => {
  it("should be associative", () => {
    const sym1 = A(Number).filter((a) => a < 3)
    const sym2 = A.filter((a) => a < 3)(Number)
    const res1 = when(1)(sym1)()
    const res2 = when(1)(sym2)()
    expect(res1).to.be.deep.equal(res2)

    const sym3 = A(Number).filter((a) => a > 3)
    const sym4 = A.filter((a) => a > 3)(Number)
    const res3 = when(1)(sym3)()
    const res4 = when(1)(sym4)()
    expect(res3).to.be.deep.equal(res4)
  })
})

describe("Test 'any' symbol", () => {
  it("should return empty", () => {
    const res = [_, any, A(any)].map((s) => when(undefined)(s)())
    expect(res[0]).to.be.deep.equal({})
    expect(res[1]).to.be.deep.equal({})
    expect(res[2]).to.be.deep.equal({})
  })
})

describe("Test regex", () => {
  it("should match #1", () => {
    const res = when("1")(A(/^1$/))()
    expect(res).to.be.deep.equal({ A: "1" })
  })
  it("should match #2", () => {
    const res = when("1")(/^1$/)()
    expect(res).to.be.deep.equal({})
  })
  it("should not match #1", () => {
    const res = when(1)(A(/^1$/))()
    expect(res).to.be.undefined
  })
  it("should not match #2", () => {
    const res = when("2")(A(/^1$/))()
    expect(res).to.be.undefined
  })
})

describe("Test array", () => {
  it("should match #1", () => {
    const res = when([1, 2, 3, 4, 5])([A(Number), 2, _, B, _])()
    expect(res).to.be.deep.equal({ A: 1, B: 4 })
  })
  it("should match #2", () => {
    const res = when([1, 2, 3, 4, 5])([A(head), 3, _, B])()
    expect(res).to.be.deep.equal({ A: [1, 2], B: 5 })
  })
  it("should match #3", () => {
    const res = when([1, 2, 3, 4, 5])([A(head), _, _, _, _, _])()
    expect(res).to.be.deep.equal({ A: [] })
  })
  it("should match #4", () => {
    const res = when([1, 2, 3, 4, 5])([A, 2, _, B(tail)])()
    expect(res).to.be.deep.equal({ A: 1, B: [4, 5] })
  })
  it("should match #5", () => {
    const res = when([1, 2, 3, 4, 5])([_, _, _, _, _, B(tail)])()
    expect(res).to.be.deep.equal({ B: [] })
  })
  it("should not match #1", () => {
    const res = when([1, 2, 3, 4, 5])([A(Number), 2, _, B])()
    expect(res).to.be.undefined
  })
  it("should not match #2", () => {
    const res = when([1, 2, 3, 4, 5])([_, _, _, _, _, _, B(tail)])()
    expect(res).to.be.undefined
  })
  it("should not match #3", () => {
    const res = when([1, 2, 3, 4, 5])([A(head), _, _, _, _, _, _])()
    expect(res).to.be.undefined
  })
  it("should not match #4", () => {
    const res = when([1, "2", 3, 4, 5])([A(head)(Number), _, _, _])()
    expect(res).to.be.undefined
  })
})

describe("Test object", () => {
  it("should match #1", () => {
    const res = when({ a: [1, 2], b: { c: "s" } })({ a: Array, b: A(Object) })()
    expect(res).to.be.deep.equal({ A: { c: "s" } })
  })
  it("should match #2", () => {
    const res = when({ a: [1, 2], b: { c: "s" } })({ b: { c: A(String) } })()
    expect(res).to.be.deep.equal({ A: "s" })
  })
  it("should not match #1", () => {
    const res = when({ a: [1, 2], b: { c: "s" } })({ a: A(Object), b: B(Object) })()
    expect(res).to.be.undefined
  })
  it("should not match #2", () => {
    const res = when({ a: [1, 2], b: { c: "s" } })({ b: { c: A(Number) } })()
    expect(res).to.be.undefined
  })
})

describe("Test constructor", () => {
  it("should match #1", () => {
    const date = new Date()
    const res = when(date)(A(Date))()
    expect(res).to.be.deep.equal({ A: date })
  })
  it("should not match #1", () => {
    const date = new Date()
    const res = when(date)(A(Buffer))()
    expect(res).to.be.undefined
  })
})

describe("Test nested symbol", () => {
  it("should match #1", () => {
    const res = when([1, 2, 3])(A([B(head), C]))()
    expect(res).to.be.deep.equal({ A: [1, 2, 3], B: [1, 2], C: 3 })
  })
  it("should not match #1", () => {
    const res = when([1, 2, 3])(A([B(head), 4]))()
    expect(res).to.be.undefined
  })
})
