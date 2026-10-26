import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseAdmin } from './supabase/admin';
import { SourceCitation } from '@/types';

export interface RetrievedChunk {
  id: string;
  materialId: string;
  fileName: string;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  sectionHeading?: string;
  similarity: number;
}

export class RagService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static getGenAI(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY || 'demo-gemini-key';
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  /**
   * Generate 768-dimensional vector embedding using Google Gemini text-embedding-004
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey.startsWith('demo-')) {
      // Deterministic pseudo-embedding for testing/demo mode when API key is not yet set
      return this.generateDeterministicEmbedding(text);
    }

    try {
      const genAI = this.getGenAI();
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (err: any) {
      console.warn('Gemini embedding API call failed, falling back to deterministic vector:', err.message);
      return this.generateDeterministicEmbedding(text);
    }
  }

  /**
   * Deterministic embedding fallback for offline testing
   */
  static generateDeterministicEmbedding(text: string, dimensions = 768): number[] {
    const vector = new Array(dimensions).fill(0);
    const clean = text.toLowerCase();
    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      const idx = (code * 31 + i) % dimensions;
      vector[idx] += 1 / (i + 1);
    }
    // Normalize vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(v => v / norm);
  }

  /**
   * Cosine similarity between two float vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const mag = Math.sqrt(magA) * Math.sqrt(magB);
    return mag === 0 ? 0 : dot / mag;
  }

  /**
   * Retrieve relevant chunks filtered strictly by user_id and optional material_ids
   */
  static async retrieveRelevantChunks(
    userId: string,
    query: string,
    options: {
      materialIds?: string[];
      topK?: number;
      minSimilarity?: number;
      localChunks?: any[]; // optional in-memory fallback
    } = {}
  ): Promise<RetrievedChunk[]> {
    const topK = options.topK || 4;
    const minSimilarity = options.minSimilarity ?? 0.35;

    // 1. Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // 2. If in-memory/local chunks provided (e.g. demo mode or unit test)
    if (options.localChunks && options.localChunks.length > 0) {
      const scored = options.localChunks
        .filter(c => c.userId === userId && (!options.materialIds || options.materialIds.includes(c.materialId)))
        .map(chunk => {
          const sim = chunk.embedding
            ? this.cosineSimilarity(queryEmbedding, chunk.embedding)
            : this.calculateKeywordRelevance(query, chunk.content);

          return {
            id: chunk.id,
            materialId: chunk.materialId,
            fileName: chunk.fileName || 'Document',
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            sectionHeading: chunk.sectionHeading,
            similarity: sim
          };
        })
        .filter(c => c.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      return scored;
    }

    // 3. Query PostgreSQL via Supabase RPC `match_document_chunks`
    try {
      const { data, error } = await supabaseAdmin.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: minSimilarity,
        match_count: topK,
        p_user_id: userId,
        p_material_ids: options.materialIds && options.materialIds.length > 0 ? options.materialIds : null
      });

      if (error) {
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        materialId: row.material_id,
        fileName: row.file_name,
        content: row.content,
        chunkIndex: row.chunk_index,
        pageNumber: row.page_number,
        sectionHeading: row.section_heading,
        similarity: row.similarity
      }));
    } catch (err: any) {
      console.warn('pgvector RPC call failed or Supabase unconfigured:', err.message);
      return [];
    }
  }

  /**
   * Keyword and BM25-like heuristic relevance fallback
   */
  static calculateKeywordRelevance(query: string, content: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (queryTerms.length === 0) return 0.5;
    const contentLower = content.toLowerCase();

    let matched = 0;
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        matched++;
      }
    }
    return Math.min(0.95, (matched / queryTerms.length) * 0.8 + 0.15);
  }

  /**
   * Format retrieved chunks into an unambiguous context block with verifiable citations
   */
  static formatCitations(chunks: RetrievedChunk[]): SourceCitation[] {
    return chunks.map(c => ({
      materialId: c.materialId,
      fileName: c.fileName,
      pageNumber: c.pageNumber,
      sectionHeading: c.sectionHeading,
      excerpt: c.content.slice(0, 200).replace(/\n+/g, ' ') + '...',
      relevanceScore: Math.round(c.similarity * 100) / 100
    }));
  }
}
