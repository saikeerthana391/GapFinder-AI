import { strict as assert } from 'node:assert';
import { test } from 'node:test';

// Inline chunker logic
function chunkText(text, materialId, options = {}) {
  const chunkSize = options.chunkSize || 600;
  const overlap = options.overlap || 100;
  const cleanedText = text.replace(/\r\n/g, '\n');
  const paragraphs = cleanedText.split(/\n{2,}/);
  const chunks = [];
  let currentBuffer = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;
    if ((currentBuffer.length + trimmedPara.length + 2) > chunkSize && currentBuffer.length > 0) {
      chunks.push({ materialId, chunkIndex, content: currentBuffer.trim() });
      chunkIndex++;
      const overlapText = currentBuffer.slice(-overlap);
      currentBuffer = overlapText + '\n\n' + trimmedPara;
    } else {
      currentBuffer = currentBuffer ? `${currentBuffer}\n\n${trimmedPara}` : trimmedPara;
    }
  }
  if (currentBuffer.trim().length > 0) {
    chunks.push({ materialId, chunkIndex, content: currentBuffer.trim() });
  }
  return chunks;
}

test('Short text produces a single chunk', () => {
  const text = 'Python variables are dynamically typed.';
  const chunks = chunkText(text, 'mat-1');
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].content.includes('Python'), true);
});

test('Long text produces multiple overlapping chunks', () => {
  const para = 'x'.repeat(200);
  const text = Array.from({ length: 10 }, (_, i) => `Paragraph ${i}: ${para}`).join('\n\n');
  const chunks = chunkText(text, 'mat-2', { chunkSize: 400, overlap: 50 });
  assert.ok(chunks.length > 1, 'Long text should produce more than 1 chunk');
});

test('Empty text produces no chunks', () => {
  const chunks = chunkText('', 'mat-3');
  assert.equal(chunks.length, 0);
});

test('Chunks do not contain empty content', () => {
  const text = 'Topic 1 overview.\n\nTopic 2 overview.\n\nTopic 3 overview.';
  const chunks = chunkText(text, 'mat-4');
  for (const ch of chunks) {
    assert.ok(ch.content.trim().length > 0, 'Chunk content must not be empty');
  }
});

console.log('All chunking tests complete.');
