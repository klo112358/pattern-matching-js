# pattern-matching-js

A pattern matching library written in Typescript.

## Installing

Using npm:

```bash
$ npm install pattern-matching-js
```

Using yarn:

```bash
$ yarn add pattern-matching-js
```

Using unpkg CDN:

```html
<script src="https://unpkg.com/pattern-matching-js/umd/pattern-matching.min.js"></script>
```

## Usage

### Basic
```js
// A is a placeholder, which will be explained in the next section
const { when, A } = require("pattern-matching-js")

when(3)
    .case(1, () => console.log("no match"))
    .case(2, () => console.log("no match"))
    .case(A, ({ A }) => console.log(`match: ${A} = 3`))
    .case(3, () => console.log("ignored"))
```

Alternatively, you may omit `.case`.
```js
// Alternative syntax
when(3)
    (1, () => console.log("no match"))
    (2, () => console.log("no match"))
    (A, ({ A }) => console.log(`match: ${A} = 3`))
    (3, () => console.log("ignored"))
```

The result of the callback function can be obtained by calling `.end()`.
If there is no match, `undefined` will be returned.

```js
const result = when(3)
    .case(A, ({ A }) => A)
    .end() // result = 3

const result = when(3)
    .case(1, () => 1)
    .case(2, () => 2)
    .end() // result = undefined
```

You may omit `.end` as well.

```js
// Alternative syntax
const result = when(3)
    (1, () => 1)
    (2, () => 2)
    (A, ({ A }) => A)
    () // result = 3
```

If you did not provide a callback function,
the identity function will be used.

```js
const result = when(3)
    .case(1)
    .case(2)
    .case(A)
    .end() // result = { A: 3 }
```

Or if you provide a value instead of a function,
that value will be returned.

```js
const result = when(3)
    .case(1, "1")
    .case(2, "2")
    .case(A, "oops")
    .end() // result = "oops"
```

You may also use the `match` shorthand function
if you only want to match one pattern.

`match(value, pattern)` is the same as `when(value).case(pattern).end()`.

```js
const { match } = require("pattern-matching-js")

const result = match(1, A) // result = { A: 1 }
const result = match(1, 2) // result = undefined
```

### Named Placeholder

To use placeholders, import them first.
```js
const { match, A, B } = require("pattern-matching-js")
```
You may import placeholders from `A` to `Z` and from `a` to `z`.

```js
match(3, A) // { A: 3 }
```

You may add a type constraint to the placeholder
by providing the constructor of the corresponding type.
Note that `Object` will not match arrays.

```js
match(3, A(String))          // undefined
match(3, A(Number))          // { A: 3 }

match([1, 2], A(Array))      // { A: [1, 2] }
match({ foo: 1 }, A(Object)) // { A: { foo: 1 } }
match([1, 2], A(Object))     // undefined

const date = new Date()
match(date, A(Date))         // { A: date }
```

You may also pass null and undefined.
```js
match(undefined, A(undefined)) // { A: undefined }
match(null, A(null))           // { A: null }
```

You may add multiple types to a placeholder.
A value must match one of the types provided.

```js
match(3, A(Number)(String))   // { A: 3 }
match("a", A(Number)(String)) // { A: "a" }
match(true, A(Number)(String)) // undefined
```

All operations on placeholders are commutative.
i.e. Using `A(Number)(String)` is the same as using `A(String)(Number)`.

You may also add custom filter to the placeholder.
Unlike types, a value must match all filters instead of any one of them.
```js
match(3, A(Number).filter(x => x > 5))                    // undefined
match(3, A(Number).filter(x => x < 5).filter(x => x > 1)) // { A: 3 }
```

You may pass patterns to a placeholder.
```js
match([1, 2], A([B, C])) // { A: [1, 2], B: 1, C: 2 }
```

You may also pass regular expression to a placeholder.
```js
match("foo", A(/^w+$/))     // { A: "foo" }
match("foo bar", A(/^w+$/)) // undefined
```

You may use the same placeholder multiple times,
however, it must match against the same value.
```js
match([3, 3], [A, A]) // { A: 3 }
match([3, 4], [A, A]) // undefined
```

You may create custom placeholder as well
```js
const { sym } = require("pattern-matching-js")

const MySymbol = sym("foo")

match(3, MySymbol(Number)) // { foo: 3 }
```

### Unnamed placeholder
If you do not care about obtaining the matched value,
you may import the `_` placeholder.

```js
const { match, _ } = require("pattern-matching-js")

match([1, 2], [_, _]) // {}
```

Unlike named placeholder, these can match different value.
```js
match([3, 4], [_, _]) // {}
match([3, 4], [A, A]) // undefined
```

You may pass a type or a filter to the `_` placeholder.
```js
match(3, _(String))            // undefined
match(3, _(Number))            // {}
match(3, _.filter(x => x > 5)) // undefined
```

If you just want to check for a single type only,
you may pass the constructor of the type without placeholders.
```js
match(3, String)                // undefined
match([1, 2], [Number, Number]) // {}
```

You can pass regular expression without placeholders as well.
```js
match("foo", /^w+$/)     // {}
match("foo bar", /^w+$/) // undefined
```


### Objects

A match happens when the pattern is a subset of the value.

```js
match({ foo: 1, bar: 2 }, { foo: A }) // { A: 1 }
```

Note that you cannot match against a key, only the value.

```js
match({ foo: 1 }, { A: 1 }) // undefined
```

You may match nested objects.
```js
match(
    { foo: { bar: 2 }, baz: { qux: 3 } },
    { foo: A, baz: { qux: B } }
) // { A: { bar: 2 }, B: 3 }
```

### Array
Arrays are matched base on the values and the equality of length.
```js
match([A, B], [1, 2])         // { A: 1, B: 2 }
match([A(Number), _], [1, 2]) // { A: 1 }
match([A, _], [1, 2, 3])      // undefined
```

Use the head/tail flag to specify remaining elements.
Note that you cannot put both head and tail in the same array.
```js
match([A, tail], [1, 2, 3])    // { A: 1 }
match([head, A], [1, 2, 3])    // { A: 3 }
match([head, tail], [1, 2, 3]) // undefined
```

You may pass head/tail to a placeholder to obtain a slice of the array.
```js
match([A(head), 3], [1, 2, 3])          // { A: [1, 2] }
match([A(head), _, _, _], [1, 2, 3])    // { A: [] }
match([A(head), _, _, _, _], [1, 2, 3]) // undefined
```

If you pass a type to a placeholder with head/tail,
it will match the type against each element in the slice.
```js
match([A(head)(Number), 3], [1, 2, 3])           // { A: [1, 2] }
match([A(head)(Number), 3], [1, "2", 3])         // undefined
match([A(head)(Number)(String), 3], [1, "2", 3]) // { A: [1, "2"] }
```

## Typescript
pattern-matching-js includes [TypeScript](http://typescriptlang.org) definitions.

```typescript
import { when, A, B, tail, _ } from 'pattern-matching-js'

when([1, 2, 3])
    .case([A, _, B], (res) => {
        /* typeof res = { A: any, B: any } */
    })
    .case([A, B(Number)(tail)], (res) => {
        /* typeof res = { A: any, B: number[] } */
    })
    .case([A(Number)(null), _, _], (res) => {
        /* typeof res = { A: number | null } */
    })
```
