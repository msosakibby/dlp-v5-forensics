import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { config } from '../config/env';
import { FORENSIC_LANES } from '../domain/lanes.config';

export interface TriageResult {
  lane_id: string;
  path_id: string;
  confidence: number;
  handwriting_density: 'HIGH' | 'LOW' | 'NONE';
}

export class TriageAgent {
  private model: GenerativeModel;

  constructor() {
    const vertexAi = new VertexAI({ project: config.gcp.projectId, location: config.gcp.location });
    this.model = vertexAi.getGenerativeModel({ model: config.ai.triage_model });
  }

  async classify(fileBuffer: Buffer, mimeType: string): Promise<TriageResult> {
    console.log("Zone A.5: Deep Triage - Analyzing against Conservancy Lanes...");
    
    let menu = "";
    FORENSIC_LANES.forEach(lane => {
      lane.paths.forEach(path => {
        menu += `- LANE ${lane.id} / PATH '${path.id}': ${path.name} (${path.description})\n`;
      });
    });

    const prompt = `
      You are a Forensic Document Classifier.
      Classify this document into EXACTLY one of the following Granular Paths:
      
      ${menu}
      
      Rate Handwriting Density (HIGH/LOW/NONE).
      
      Return JSON:
      {
        "lane_id": "09",
        "path_id": "timber_contracts",
        "confidence": 0.95,
        "handwriting_density": "LOW"
      }
    `;

    const imagePart = { inlineData: { data: fileBuffer.toString('base64'), mimeType: mimeType } };
    const result = await this.model.generateContent([prompt, imagePart]);
    const cleanJson = result.response.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    
    return JSON.parse(cleanJson);
  }
}
