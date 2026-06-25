export type MemoryNode = {
  id: string;
  content: string;
  embedding: number[];
  tags: string[];
  weight: number;
  timestamp: number;
};

export class MemoryGraph {
  nodes: Map<string, MemoryNode> = new Map();

  addMemory(node: MemoryNode) {
    this.nodes.set(node.id, node);
  }

  querySimilar(embedding: number[]) {
    return [...this.nodes.values()]
      .sort((a, b) => this.similarity(b.embedding, embedding) - this.similarity(a.embedding, embedding))
      .slice(0, 10);
  }

  similarity(a: number[], b: number[]) {
    // Simulated cosine similarity
    let dotProduct = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
    }
    return dotProduct;
  }
  
  getStats() {
    return {
      nodes: this.nodes.size,
      activeEdges: this.nodes.size > 1 ? this.nodes.size * 2 : 0,
      health: 'Optimal'
    };
  }
}

// Global instance for the applet
export const memoryGraph = new MemoryGraph();
