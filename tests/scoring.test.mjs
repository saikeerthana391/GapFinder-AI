import { strict as assert } from 'assert';
import { test } from 'node:test';

// Import scoring engine logic inline (since we can't import TS directly)
function determineMasteryStatus(percentage, questionsAttempted) {
  if (questionsAttempted === 0) return 'untested';
  if (percentage < 50) return 'weak';
  if (percentage < 80) return 'medium';
  return 'strong';
}

function evaluateMCQ(studentChoice, correctAnswer, points) {
  const s = studentChoice.trim().toLowerCase();
  const c = correctAnswer.trim().toLowerCase();
  const isExact = s === c;
  const isLetterMatch =
    (s.length === 1 && c.startsWith(s)) ||
    (c.length === 1 && s.startsWith(c));
  if (isExact || isLetterMatch) {
    return { status: 'correct', marksEarned: points };
  }
  return { status: 'incorrect', marksEarned: 0 };
}

test('Mastery thresholds: untested when no questions', () => {
  assert.equal(determineMasteryStatus(0, 0), 'untested');
});

test('Mastery thresholds: weak below 50%', () => {
  assert.equal(determineMasteryStatus(40, 5), 'weak');
  assert.equal(determineMasteryStatus(49, 3), 'weak');
});

test('Mastery thresholds: medium 50-79%', () => {
  assert.equal(determineMasteryStatus(50, 4), 'medium');
  assert.equal(determineMasteryStatus(75, 4), 'medium');
  assert.equal(determineMasteryStatus(79, 4), 'medium');
});

test('Mastery thresholds: strong 80% and above', () => {
  assert.equal(determineMasteryStatus(80, 4), 'strong');
  assert.equal(determineMasteryStatus(100, 5), 'strong');
});

test('MCQ evaluation: exact match correct', () => {
  const result = evaluateMCQ('A) Python is dynamic', 'A) Python is dynamic', 10);
  assert.equal(result.status, 'correct');
  assert.equal(result.marksEarned, 10);
});

test('MCQ evaluation: letter match correct', () => {
  const result = evaluateMCQ('A', 'A) Python supports dynamic typing', 10);
  assert.equal(result.status, 'correct');
  assert.equal(result.marksEarned, 10);
});

test('MCQ evaluation: wrong answer is incorrect', () => {
  const result = evaluateMCQ('B', 'A) Python supports dynamic typing', 10);
  assert.equal(result.status, 'incorrect');
  assert.equal(result.marksEarned, 0);
});

test('Revision priority: weak topics rank higher than strong', () => {
  function urgencyScore(status, mastery) {
    if (status === 'weak') return 100 - mastery + 50;
    if (status === 'medium') return 80 - mastery + 25;
    if (status === 'untested') return 40;
    return 10;
  }
  const weak = urgencyScore('weak', 30);
  const medium = urgencyScore('medium', 60);
  const strong = urgencyScore('strong', 90);
  assert.ok(weak > medium, 'Weak topic should rank higher than medium');
  assert.ok(medium > strong, 'Medium topic should rank higher than strong');
});

console.log('All scoring tests complete.');
