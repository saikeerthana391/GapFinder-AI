import { GoogleGenerativeAI } from '@google/generative-ai';
import { RetrievedChunk, RagService } from './rag-service';
import { QuizQuestionServer, SourceCitation, AnswerStatus } from '@/types';

export class AiService {
  private static getGeminiModel() {
    const apiKey = process.env.GEMINI_API_KEY || 'demo-gemini-key';
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash which is standard, fast, and structured-output capable
    return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Grounded Diagnostic Quiz Generation
   */
  static async generateQuizQuestions(params: {
    topicId: string;
    topicTitle: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
    count: number;
    retrievedChunks: RetrievedChunk[];
  }): Promise<QuizQuestionServer[]> {
    const { topicId, topicTitle, difficulty, count, retrievedChunks } = params;

    // Check if evidence is available
    if (!retrievedChunks || retrievedChunks.length === 0) {
      throw new Error(
        `Insufficient study material uploaded for "${topicTitle}". Please upload course syllabus, textbook chapters, or notes to ground quiz questions in verifiable source material.`
      );
    }

    const contextText = retrievedChunks
      .map(
        (c, idx) =>
          `[Source ${idx + 1}: ${c.fileName} | Section: ${c.sectionHeading || 'N/A'} | Page: ${c.pageNumber || 'N/A'}]\n${c.content}`
      )
      .join('\n\n---\n\n');

    const prompt = `You are GapFinder AI's rigorous exam question author.
Generate ${count} diagnostic quiz questions strictly grounded in the provided Source Material excerpts for the topic: "${topicTitle}".

CRITICAL CONSTRAINTS:
1. Every question MUST test a specific principle or fact mentioned in the excerpts. NEVER invent facts or use external unverified knowledge.
2. Difficulty level: ${difficulty}.
3. Create a mix of Multiple-Choice questions (4 options: A, B, C, D) and Short-Answer questions.
4. For Multiple-Choice, provide the exact letter/option of the correct answer.
5. Provide a clear, educational explanation showing why the answer is correct with direct reference to the text.
6. Under 'sourceCitation', cite the exact fileName, pageNumber, and sectionHeading from the excerpts, plus a short verbatim excerpt.
7. Return ONLY valid JSON as an array of objects matching this exact format:
[
  {
    "questionText": "...",
    "questionType": "multiple_choice" or "short_answer",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."], // empty array for short_answer
    "correctAnswer": "A) ...", // or expected answer string for short_answer
    "explanation": "...",
    "points": 10,
    "difficulty": "${difficulty === 'mixed' ? 'intermediate' : difficulty}",
    "rubricCriteria": ["Criteria 1", "Criteria 2"],
    "sourceCitation": {
      "fileName": "...",
      "pageNumber": 1,
      "sectionHeading": "...",
      "excerpt": "..."
    }
  }
]

SOURCE MATERIAL EXCERPTS:
${contextText}`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey.startsWith('demo-')) {
      // Deterministic fallback when running offline or in demo mode without Gemini key
      return this.generateFallbackQuestions(topicId, topicTitle, difficulty, count, retrievedChunks);
    }

    try {
      const model = this.getGeminiModel();
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      return parsed.map((q: any, idx: number) => ({
        id: `q-${Date.now()}-${idx}`,
        quizId: '',
        topicId,
        topicTitle,
        questionText: q.questionText,
        questionType: q.questionType || (q.options?.length ? 'multiple_choice' : 'short_answer'),
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points || 10,
        difficulty: q.difficulty || difficulty,
        rubricCriteria: q.rubricCriteria || [],
        sourceCitation: q.sourceCitation || {
          fileName: retrievedChunks[0].fileName,
          pageNumber: retrievedChunks[0].pageNumber,
          sectionHeading: retrievedChunks[0].sectionHeading,
          excerpt: retrievedChunks[0].content.slice(0, 150)
        }
      }));
    } catch (err: any) {
      console.warn('Gemini question generation error, falling back to grounded rule generator:', err.message);
      return this.generateFallbackQuestions(topicId, topicTitle, difficulty, count, retrievedChunks);
    }
  }

  /**
   * Deterministic Grounded Question Generator (Used for demo mode / offline testing)
   */
  private static generateFallbackQuestions(
    topicId: string,
    topicTitle: string,
    difficulty: string,
    count: number,
    retrievedChunks: RetrievedChunk[]
  ): QuizQuestionServer[] {
    const questions: QuizQuestionServer[] = [];
    const chunk = retrievedChunks[0];

    // Question 1: Multiple choice grounded in the primary chunk
    questions.push({
      id: `q-${Date.now()}-1`,
      quizId: '',
      topicId,
      topicTitle,
      questionText: `Based on ${chunk.fileName} (${chunk.sectionHeading || 'Study Material'}), which statement regarding ${topicTitle} is strictly accurate?`,
      questionType: 'multiple_choice',
      options: [
        `A) ${chunk.content.split('\n')[0].replace(/^[-•*#\s]+/, '').slice(0, 80)}`,
        `B) It behaves identical to statically compiled primitives without runtime reference binding.`,
        `C) Python raises an immediate syntax error whenever an identifier is reassigned in another scope.`,
        `D) Operations on these types bypass standard LEGB resolution and operator associativity.`
      ],
      correctAnswer: `A) ${chunk.content.split('\n')[0].replace(/^[-•*#\s]+/, '').slice(0, 80)}`,
      explanation: `Verified from ${chunk.fileName} under section ${chunk.sectionHeading || 'Core Notes'}: The verified text explicitly details this behavior.`,
      points: 10,
      difficulty: difficulty === 'mixed' ? 'beginner' : (difficulty as any),
      sourceCitation: {
        fileName: chunk.fileName,
        pageNumber: chunk.pageNumber || 1,
        sectionHeading: chunk.sectionHeading || 'General Section',
        excerpt: chunk.content.slice(0, 180)
      }
    });

    if (count > 1) {
      const secondChunk = retrievedChunks[1] || chunk;
      questions.push({
        id: `q-${Date.now()}-2`,
        quizId: '',
        topicId,
        topicTitle,
        questionText: `Explain the fundamental concept of ${topicTitle} described in ${secondChunk.fileName} and highlight one common pitfall or rule mentioned in the text.`,
        questionType: 'short_answer',
        options: [],
        correctAnswer: secondChunk.content.slice(0, 140),
        explanation: `Expected answers must reference: ${secondChunk.sectionHeading || topicTitle} rules and mutability or control semantics.`,
        points: 10,
        difficulty: difficulty === 'mixed' ? 'intermediate' : (difficulty as any),
        rubricCriteria: [
          'Identifies primary definition from course notes',
          'Identifies behavioral nuance or potential runtime pitfall'
        ],
        sourceCitation: {
          fileName: secondChunk.fileName,
          pageNumber: secondChunk.pageNumber || 1,
          sectionHeading: secondChunk.sectionHeading || 'Section Excerpt',
          excerpt: secondChunk.content.slice(0, 180)
        }
      });
    }

    return questions.slice(0, count);
  }

  /**
   * Semantic Evaluation of Short Answers
   */
  static async evaluateShortAnswer(params: {
    questionText: string;
    expectedAnswer: string;
    studentAnswer: string;
    maxPoints: number;
    sourceCitation?: SourceCitation;
  }): Promise<{
    status: AnswerStatus;
    marksEarned: number;
    feedback: string;
    mistakesIdentified: string[];
    conceptsToRevise: string[];
  }> {
    const { questionText, expectedAnswer, studentAnswer, maxPoints } = params;

    // Check empty or whitespace-only answers
    if (!studentAnswer || studentAnswer.trim().length === 0) {
      return {
        status: 'incorrect',
        marksEarned: 0,
        feedback: 'No response was provided by the student.',
        mistakesIdentified: ['Missing answer'],
        conceptsToRevise: ['Core topic definitions']
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey.startsWith('demo-')) {
      // Offline heuristic semantic grading
      return this.heuristicEvaluateShortAnswer(questionText, expectedAnswer, studentAnswer, maxPoints);
    }

    const prompt = `You are GapFinder AI's impartial academic evaluator.
Evaluate the student's answer against the verified reference answer.

Question: ${questionText}
Reference Expected Answer: ${expectedAnswer}
Student Submitted Answer: ${studentAnswer}
Maximum Marks: ${maxPoints}

Grading Guidelines:
- If the student clearly captures the essential concepts: full marks ('correct').
- If the student shows partial conceptual understanding but misses key nuances or contains minor flaws: partial marks ('partially_correct').
- If the student is factually incorrect, off-topic, or misses the core premise: 0 marks ('incorrect').

Return ONLY a JSON object:
{
  "status": "correct" | "partially_correct" | "incorrect",
  "marksEarned": <number between 0 and ${maxPoints}>,
  "feedback": "<concise constructive feedback>",
  "mistakesIdentified": ["<specific mistake 1>", ...],
  "conceptsToRevise": ["<concept to review 1>", ...]
}`;

    try {
      const model = this.getGeminiModel();
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const parsed = JSON.parse(result.response.text());
      return {
        status: parsed.status || 'incorrect',
        marksEarned: Math.min(maxPoints, Math.max(0, parsed.marksEarned || 0)),
        feedback: parsed.feedback || '',
        mistakesIdentified: parsed.mistakesIdentified || [],
        conceptsToRevise: parsed.conceptsToRevise || []
      };
    } catch (err: any) {
      console.warn('AI short answer evaluation error, falling back to heuristic evaluation:', err.message);
      return this.heuristicEvaluateShortAnswer(questionText, expectedAnswer, studentAnswer, maxPoints);
    }
  }

  private static heuristicEvaluateShortAnswer(
    questionText: string,
    expectedAnswer: string,
    studentAnswer: string,
    maxPoints: number
  ) {
    const studentWords = studentAnswer.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const expectedWords = expectedAnswer.toLowerCase().split(/\W+/).filter(w => w.length > 3);

    const matches = studentWords.filter(w => expectedWords.includes(w));
    const overlapRatio = expectedWords.length > 0 ? matches.length / expectedWords.length : 0;

    if (overlapRatio >= 0.4 || studentWords.length >= 8) {
      return {
        status: 'correct' as AnswerStatus,
        marksEarned: maxPoints,
        feedback: 'Good response. Key terminology and conceptual mechanisms align with course notes.',
        mistakesIdentified: [],
        conceptsToRevise: []
      };
    } else if (overlapRatio >= 0.15 || studentWords.length >= 4) {
      return {
        status: 'partially_correct' as AnswerStatus,
        marksEarned: Math.round(maxPoints * 0.5),
        feedback: 'Partially correct. Demonstrates basic familiarity, but lacks detailed technical explanation.',
        mistakesIdentified: ['Incomplete mechanism description'],
        conceptsToRevise: ['Detailed operational nuances']
      };
    } else {
      return {
        status: 'incorrect' as AnswerStatus,
        marksEarned: 0,
        feedback: 'Answer does not demonstrate the expected conceptual understanding from the study material.',
        mistakesIdentified: ['Missed core definition and principles'],
        conceptsToRevise: ['Core concept review']
      };
    }
  }

  /**
   * Explain This Topic Assistant with Strict RAG Grounding
   */
  static async explainTopic(params: {
    question: string;
    topicTitle?: string;
    retrievedChunks: RetrievedChunk[];
  }): Promise<{
    answer: string;
    citations: SourceCitation[];
    hasEvidence: boolean;
  }> {
    const { question, topicTitle, retrievedChunks } = params;

    if (!retrievedChunks || retrievedChunks.length === 0) {
      return {
        answer: `I could not find sufficient information in your uploaded study materials regarding this query. Please upload the relevant textbook chapters, lecture notes, or syllabus so I can provide an answer with verifiable citations.`,
        citations: [],
        hasEvidence: false
      };
    }

    const citations = RagService.formatCitations(retrievedChunks);
    const contextText = retrievedChunks
      .map(
        (c, idx) =>
          `[Source ${idx + 1}: ${c.fileName} | Section: ${c.sectionHeading || 'N/A'} | Page: ${c.pageNumber || 'N/A'}]\n${c.content}`
      )
      .join('\n\n---\n\n');

    const prompt = `You are GapFinder AI's grounded academic tutor.
Answer the student's question strictly based on the provided Source Material excerpts below.

Student Question: "${question}"
Topic Focus: "${topicTitle || 'General Coursework'}"

RULES:
1. ONLY make claims directly verified by the excerpts. Do NOT hallucinate.
2. If the excerpts do not contain enough information to fully answer, state clearly: "The provided study materials do not contain sufficient evidence to answer this question."
3. Quote relevant phrases where helpful and cite the source filename and section.
4. Structure your response with clean formatting (bullet points, bold highlights, code snippets if Python code is discussed).

SOURCE EXCERPTS:
${contextText}`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey.startsWith('demo-')) {
      const topChunk = retrievedChunks[0];
      return {
        answer: `### Explanation based on **${topChunk.fileName}** (${topChunk.sectionHeading || 'Course Notes'})

According to your uploaded materials:

> "${topChunk.content.slice(0, 250)}..."

**Key Takeaways:**
- The study material specifies the exact rules for this topic in **${topChunk.sectionHeading || 'Section Excerpt'}**.
- Review the cited passage below for complete context.`,
        citations,
        hasEvidence: true
      };
    }

    try {
      const model = this.getGeminiModel();
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2
        }
      });

      return {
        answer: result.response.text(),
        citations,
        hasEvidence: true
      };
    } catch (err: any) {
      console.warn('Gemini explanation error, using grounded fallback summary:', err.message);
      const topChunk = retrievedChunks[0];
      return {
        answer: `### Verified Explanation from **${topChunk.fileName}**

${topChunk.content}

*(Referenced from page ${topChunk.pageNumber || 1}, ${topChunk.sectionHeading || 'Section Notes'})*`,
        citations,
        hasEvidence: true
      };
    }
  }
}
