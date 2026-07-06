import { addVectors } from '../db/vectorStore.js';

/**
 * EmbeddingAgent — Turns cleaned reviews into 384-dimensional vector representations
 * using the all-MiniLM-L6-v2 model via @xenova/transformers (runs locally, free).
 */

let pipeline = null;

async function getEmbeddingPipeline() {
  if (!pipeline) {
    console.log('[Embedding] Loading all-MiniLM-L6-v2 model (first run downloads ~80MB)...');
    const { pipeline: createPipeline } = await import('@xenova/transformers');
    pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[Embedding] Model loaded successfully');
  }
  return pipeline;
}

export class EmbeddingAgent {
  constructor() {
    this.batchSize = 32;
    this.stats = { total: 0, embedded: 0, errors: 0 };
  }

  async embed(reviews) {
    console.log(`[Embedding] Processing ${reviews.length} reviews...`);
    this.stats.total = reviews.length;

    const embeddingPipeline = await getEmbeddingPipeline();
    const results = [];

    // Process in batches
    for (let i = 0; i < reviews.length; i += this.batchSize) {
      const batch = reviews.slice(i, i + this.batchSize);
      const batchNum = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(reviews.length / this.batchSize);
      console.log(`[Embedding] Batch ${batchNum}/${totalBatches} (${batch.length} reviews)`);

      try {
        const texts = batch.map(r => r.cleaned_text || r.text);

        // Process each text individually for stability
        for (let j = 0; j < texts.length; j++) {
          try {
            const output = await embeddingPipeline(texts[j], {
              pooling: 'mean',
              normalize: true,
            });

            const vector = Array.from(output.data);
            results.push({
              reviewId: batch[j].id,
              vector,
            });
            this.stats.embedded++;
          } catch (err) {
            console.error(`[Embedding] Error embedding review ${batch[j].id}: ${err.message}`);
            this.stats.errors++;
          }
        }
      } catch (err) {
        console.error(`[Embedding] Batch error: ${err.message}`);
        this.stats.errors += batch.length;
      }
    }

    // Store all vectors
    if (results.length > 0) {
      await addVectors(results);
      console.log(`[Embedding] Stored ${results.length} vectors`);
    }

    console.log(`[Embedding] Complete: ${this.stats.embedded} embedded, ${this.stats.errors} errors`);
    return results;
  }

  async embedQuery(text) {
    const embeddingPipeline = await getEmbeddingPipeline();
    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }
}
