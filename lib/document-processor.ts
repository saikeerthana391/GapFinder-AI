import pdf from 'pdf-parse';

export interface ChunkMetadata {
  materialId: string;
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  sectionHeading?: string;
  tokenCount: number;
}

export interface ProcessedDocument {
  title: string;
  extractedText: string;
  pageCount?: number;
  chunks: ChunkMetadata[];
}

/**
 * Intelligent Document Processor with text extraction, heading detection, and overlapping chunking.
 */
export class DocumentProcessor {
  /**
   * Approximate tokens from characters
   */
  static estimateTokenCount(text: string): number {
    return Math.ceil(text.trim().split(/\s+/).length * 1.3);
  }

  /**
   * Extract text from Buffer (supports TXT and PDF)
   */
  static async extractText(buffer: Buffer, fileName: string): Promise<{ text: string; pageCount?: number }> {
    const lowerName = fileName.toLowerCase();

    if (lowerName.endsWith('.txt')) {
      const text = buffer.toString('utf-8').trim();
      if (!text) {
        throw new Error('The text file is empty.');
      }
      return { text, pageCount: 1 };
    }

    if (lowerName.endsWith('.pdf')) {
      try {
        const data = await pdf(buffer);
        const text = data.text.trim();
        if (!text || text.length < 20) {
          throw new Error(
            'No readable text extracted. Scanned PDFs with image-only pages require an OCR pipeline. Please upload a text-searchable PDF.'
          );
        }
        return {
          text,
          pageCount: data.numpages || 1
        };
      } catch (err: any) {
        if (err.message && err.message.includes('OCR')) {
          throw err;
        }
        throw new Error(`Failed to parse PDF document: ${err.message || 'Corrupted or unsupported format'}`);
      }
    }

    throw new Error(`Unsupported file format. Please upload PDF or TXT documents.`);
  }

  /**
   * Chunk text into structured overlapping segments with section headings preserved
   */
  static chunkText(
    text: string,
    materialId: string,
    options: {
      chunkSize?: number;
      overlap?: number;
    } = {}
  ): ChunkMetadata[] {
    const chunkSize = options.chunkSize || 600; // characters
    const overlap = options.overlap || 100;

    const cleanedText = text.replace(/\r\n/g, '\n');
    const paragraphs = cleanedText.split(/\n{2,}/);

    const chunks: ChunkMetadata[] = [];
    let currentBuffer = '';
    let currentSectionHeading = 'General Content';
    let chunkIndex = 0;
    let estimatedPage = 1;

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;

      // Detect section headings like "[Chapter 1: Section 1.2]", "UNIT 1:", or "## Header"
      const headingMatch = trimmedPara.match(/^(?:\[([^\]]+)\]|(?:UNIT|Topic|Chapter|Section)\s+[^:\n]+:?|#+\s+([^\n]+))/i);
      if (headingMatch) {
        currentSectionHeading = headingMatch[1] || headingMatch[2] || trimmedPara.slice(0, 60);
      }

      // Check if adding this paragraph exceeds chunkSize
      if ((currentBuffer.length + trimmedPara.length + 2) > chunkSize && currentBuffer.length > 0) {
        chunks.push({
          materialId,
          chunkIndex,
          content: currentBuffer.trim(),
          pageNumber: estimatedPage,
          sectionHeading: currentSectionHeading,
          tokenCount: this.estimateTokenCount(currentBuffer)
        });

        chunkIndex++;

        // Increment approximate page every ~2500 characters
        if (chunks.length % 4 === 0) {
          estimatedPage++;
        }

        // Keep trailing characters as overlap
        const overlapText = currentBuffer.slice(-overlap);
        currentBuffer = overlapText + '\n\n' + trimmedPara;
      } else {
        currentBuffer = currentBuffer ? `${currentBuffer}\n\n${trimmedPara}` : trimmedPara;
      }
    }

    // Add any remaining buffered text
    if (currentBuffer.trim().length > 0) {
      chunks.push({
        materialId,
        chunkIndex,
        content: currentBuffer.trim(),
        pageNumber: estimatedPage,
        sectionHeading: currentSectionHeading,
        tokenCount: this.estimateTokenCount(currentBuffer)
      });
    }

    return chunks;
  }
}
