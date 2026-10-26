/**
 * Comprehensive Judge-Ready Sample Educational Materials
 * Subject: Introduction to Computer Science & Python Programming (CS101)
 */

export interface SampleDoc {
  fileName: string;
  title: string;
  fileType: 'syllabus' | 'textbook' | 'notes' | 'exam_paper';
  content: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    fileName: 'CS101_Python_Syllabus.txt',
    title: 'CS101: Introduction to Python Programming Syllabus',
    fileType: 'syllabus',
    content: `COURSE SYLLABUS: CS101 Introduction to Python Programming
Academic Year: 2026-2027
Instructor: Department of Computer Science

UNIT 1: Core Fundamentals & Primitives
Topic 1.1: Variables and Data Types (Code: PY-101)
- Overview of numeric types (int, float), text (str), and boolean (bool).
- Dynamic typing vs static typing in Python.
- Type casting rules and type() introspection.
- Memory referencing and id() function.

Topic 1.2: Operators and Expressions (Code: PY-102)
- Arithmetic operators (+, -, *, /, // floor division, % modulo, ** exponentiation).
- Comparison operators (==, !=, <, >, <=, >=) and identity operators (is, is not).
- Logical operators (and, or, not) and short-circuit evaluation rules.
- Operator precedence and associative binding.

UNIT 2: Control Flow Structures
Topic 2.1: Conditional Statements (Code: PY-201)
- if, elif, and else branching logic.
- Nested conditionals and boolean flag evaluation.
- Truthy and Falsy values in Python (empty containers, 0, None evaluate to False).
- Ternary conditional expressions (value_if_true if condition else value_if_false).

Topic 2.2: Loops and Iteration (Code: PY-202)
- while loops with sentinel values and infinite loop prevention.
- for loops with the range(start, stop, step) generator function.
- Flow controllers: break, continue, and the loop-else clause.
- Iterating over sequences and nested loops.

UNIT 3: Modular Programming & Functions
Topic 3.1: Functions and Scope (Code: PY-301)
- Function definition using def, parameter passing, and return statements.
- Positional, keyword, and default arguments.
- Variable-length arguments (*args, **kwargs).
- LEGB scope hierarchy: Local, Enclosing, Global, and Built-in namespaces.
- Pure functions vs functions with side-effects.

UNIT 4: Composite Data Structures
Topic 4.1: Lists and Tuples (Code: PY-401)
- Ordered sequences: indexing (zero-based, negative indexing) and slicing [start:stop:step].
- Mutability differences: mutable Lists vs immutable Tuples.
- Common list methods: append(), extend(), insert(), pop(), remove(), sort().
- List comprehensions for concise sequence transformation.
- Tuple packing and sequence unpacking.

Topic 4.2: Dictionaries and Sets (Code: PY-402)
- Dictionaries: key-value hash maps, hashability constraints (keys must be immutable).
- Dictionary operations: get(), keys(), values(), items(), and dict comprehensions.
- Sets: unordered collections of unique elements; set theory operations (union |, intersection &, difference -).
- Membership testing performance: O(1) average lookup in sets and dictionaries vs O(n) in lists.

UNIT 5: Algorithmic Problem Solving
Topic 5.1: Basic Problem-Solving & Debugging (Code: PY-501)
- Formulating algorithmic solutions: accumulator pattern, two-pointer search, and linear search.
- Common runtime pitfalls: IndexError, KeyError, TypeError, and UnboundLocalError.
- Defensive programming with assertions and basic try-except exception handling.`
  },
  {
    fileName: 'Chapter_01_Variables_and_Operators.txt',
    title: 'Textbook Chapter 1: Variables, Types, and Expressions',
    fileType: 'textbook',
    content: `[Chapter 1: Section 1.1] Variables and Data Representation
In Python, variables do not store values directly inside rigid memory cells; instead, variables are symbolic names (references) bound to objects stored in the heap.
When executing 'x = 42', Python allocates an integer object with value 42 and binds the identifier 'x' to that memory address.
Python provides primitive types:
- int: arbitrary-precision integers (unbounded size in Python 3).
- float: IEEE 754 double-precision floating-point numbers (approx 53 bits of precision).
- str: immutable sequences of Unicode code points.
- bool: subclass of int with exactly two instances: True (evaluates to 1) and False (evaluates to 0).

[Chapter 1: Section 1.2] Type Conversion and Mutability
Explicit type conversion is performed using constructor functions int(), float(), str(), bool().
Strings and numeric types are strictly immutable. If you execute 's = "hello"; s += " world"', a brand new string object is created, and 's' is rebound.
Attempting item assignment on immutable sequences (such as s[0] = 'H') raises a TypeError: 'str' object does not support item assignment.

[Chapter 1: Section 1.3] Arithmetic and Logical Expressions
The floor division operator '//' computes mathematical floor of the quotient:
- 7 // 2 yields 3
- -7 // 2 yields -4 (because floor rounds toward negative infinity).
The modulo operator '%' yields the remainder: 7 % 2 yields 1, and -7 % 2 yields 1.
Short-circuit evaluation in logical expressions:
- 'expr1 and expr2': If expr1 evaluates to False, expr2 is never executed, and expr1 is returned.
- 'expr1 or expr2': If expr1 evaluates to True, expr2 is skipped, and expr1 is returned.`
  },
  {
    fileName: 'Chapter_02_Control_Flow_and_Functions.txt',
    title: 'Textbook Chapter 2: Control Flow, Loops, and Functions',
    fileType: 'textbook',
    content: `[Chapter 2: Section 2.1] Conditional Branching and Truth Values
Conditional branches in Python rely on indentation blocks (typically 4 spaces).
Every object in Python has an inherent boolean truth value. The following are considered Falsy:
- None and False.
- Numeric zero: 0, 0.0, 0j.
- Empty sequences and collections: '', (), [], {}, set(), range(0).
All other objects evaluate to True.

[Chapter 2: Section 2.2] Loops, Range, and Loop-Else
The range() function produces an immutable sequence of numbers on demand without allocating an entire list in memory:
range(start, stop, step) generates values from start up to (but not including) stop.
Loop-else construct:
Both 'for' and 'while' loops can have an optional 'else:' block. The else block executes ONLY if the loop completes normally without encountering a 'break' statement. If the loop is terminated by 'break', the else clause is skipped.

[Chapter 2: Section 2.3] Functions, Scope, and Parameter Binding
Functions are first-class citizens in Python, meaning they can be passed as arguments, returned from other functions, and assigned to variables.
The LEGB rule governs scope resolution:
1. Local: Names assigned inside the current function body.
2. Enclosing: Names in the local scope of any enclosing functions (closures).
3. Global: Names defined at the module top level.
4. Built-in: Built-in identifiers (e.g., print, len, range).
CRITICAL PITFALL: Default parameter values are evaluated once when the function is defined, NOT each time the function is called.
Using a mutable object (like a list or dict) as a default argument creates a shared persistent container across calls!`
  },
  {
    fileName: 'Chapter_03_Data_Structures.txt',
    title: 'Textbook Chapter 3: Sequences, Dictionaries, and Sets',
    fileType: 'textbook',
    content: `[Chapter 3: Section 3.1] Lists vs Tuples
Lists are dynamic, mutable arrays. When appending elements beyond allocated capacity, Python automatically resizes the internal array buffer with over-allocation to guarantee amortized O(1) append operations.
Tuples are immutable fixed-size sequences. Because tuples are immutable, they are lighter in memory overhead and can be used as dictionary keys (provided all tuple elements are also immutable).

[Chapter 3: Section 3.2] Slicing Semantics
Sequence slicing syntax is 'sequence[start:stop:step]':
- 'start' is inclusive; 'stop' is exclusive.
- A negative step reverses traversal direction. E.g., 'seq[::-1]' produces a reversed copy.
- Slicing does not raise an IndexError if indices exceed sequence boundaries; it cleanly clips at the boundaries.

[Chapter 3: Section 3.3] Dictionaries and Hash Tables
Python dictionaries are implemented using sparse hash tables. Lookups, insertions, and deletions run in average O(1) time complexity.
Keys must be hashable: the type must implement __hash__() and __eq__(), and the hash value must never mutate during the object's lifetime. Mutable types (list, dict, set) are NOT hashable and will raise TypeError: unhashable type.
Methods:
- 'dict.get(key, default)': Retrieves value if key exists; returns default if missing without raising KeyError.
- 'dict.setdefault(key, default)': Retrieves value, or sets key to default if missing and returns it.

[Chapter 3: Section 3.4] Sets and Set Theory
Sets store unordered unique elements. Duplicate additions are silently ignored.
Set operations include union (A | B), intersection (A & B), difference (A - B), and symmetric difference (A ^ B).`
  },
  {
    fileName: 'Midterm_Exam_Review_Notes.txt',
    title: 'Midterm Exam Review & Common Mistakes Notes',
    fileType: 'notes',
    content: `[Review Notes: High-Frequency Exam Traps]
1. Modulo with Negative Numbers:
   In Python, 'a % b' always takes the sign of divisor b. For example, -7 % 3 = 2, because -7 = (-3 * 3) + 2.
2. List Aliasing vs Cloning:
   'list_b = list_a' copies the reference, NOT the list. Modifying list_b modifies list_a. To shallow clone, use 'list_b = list_a.copy()' or 'list_b = list_a[:]'.
3. Unintended Mutable Default Arguments:
   'def add_item(item, lst=[]):' shares lst across calls. Correct idiom: 'def add_item(item, lst=None): if lst is None: lst = []'.
4. Dictionary Key Errors:
   Accessing 'd[k]' directly raises KeyError if k is not present. Always favor 'd.get(k, default)' or check 'if k in d:' first.
5. While loop condition termination:
   Ensure loop increment/decrement actually makes progress toward terminating the predicate, avoiding infinite cycles.`
  }
];

export const INITIAL_TOPICS = [
  {
    code: 'PY-101',
    title: 'Variables and Data Types',
    parentUnit: 'Unit 1: Core Fundamentals',
    orderIndex: 1,
    description: 'Numeric types, dynamic typing, type casting, mutability of primitives, and id referencing.',
    prerequisites: []
  },
  {
    code: 'PY-102',
    title: 'Operators and Expressions',
    parentUnit: 'Unit 1: Core Fundamentals',
    orderIndex: 2,
    description: 'Arithmetic, floor division, modulo, logical operators, short-circuit evaluation, and precedence.',
    prerequisites: ['PY-101']
  },
  {
    code: 'PY-201',
    title: 'Conditional Statements',
    parentUnit: 'Unit 2: Control Flow',
    orderIndex: 3,
    description: 'if-elif-else logic, truthy and falsy values, nested conditions, and ternary operators.',
    prerequisites: ['PY-102']
  },
  {
    code: 'PY-202',
    title: 'Loops and Iteration',
    parentUnit: 'Unit 2: Control Flow',
    orderIndex: 4,
    description: 'for loops with range(), while loops, sentinel values, break, continue, and loop-else clauses.',
    prerequisites: ['PY-201']
  },
  {
    code: 'PY-301',
    title: 'Functions and Scope',
    parentUnit: 'Unit 3: Modular Programming',
    orderIndex: 5,
    description: 'Function definition, parameters, return values, LEGB scoping, and mutable default argument pitfalls.',
    prerequisites: ['PY-202']
  },
  {
    code: 'PY-401',
    title: 'Lists and Tuples',
    parentUnit: 'Unit 4: Composite Data Structures',
    orderIndex: 6,
    description: 'Sequence indexing, slicing semantics, mutability vs immutability, list methods, and aliasing.',
    prerequisites: ['PY-101', 'PY-202']
  },
  {
    code: 'PY-402',
    title: 'Dictionaries and Sets',
    parentUnit: 'Unit 4: Composite Data Structures',
    orderIndex: 7,
    description: 'Hash tables, key hashability requirements, O(1) lookups, dictionary operations, and set theory.',
    prerequisites: ['PY-401']
  },
  {
    code: 'PY-501',
    title: 'Basic Problem-Solving & Debugging',
    parentUnit: 'Unit 5: Algorithmic Problem Solving',
    orderIndex: 8,
    description: 'Accumulator pattern, common runtime exceptions (KeyError, IndexError, TypeError), and defensive coding.',
    prerequisites: ['PY-301', 'PY-402']
  }
];
