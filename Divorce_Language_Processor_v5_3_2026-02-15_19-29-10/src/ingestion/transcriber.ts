import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { config } from '../config/env';
import { FORENSIC_LANES } from '../domain/lanes.config';
import { TriageResult } from './triage';

export class Transcriber {
  private geminiModel: GenerativeModel;
  private visionClient: ImageAnnotatorClient;

  constructor() {
    const vertexAi = new VertexAI({ project: config.gcp.projectId, location: config.gcp.location });
    this.geminiModel = vertexAi.getGenerativeModel({ model: config.ai.analyst_model });
    this.visionClient = new ImageAnnotatorClient();
  }

  async transcribe(fileBuffer: Buffer, mimeType: string, triage: TriageResult) {
    const lane = FORENSIC_LANES.find(l => l.id === triage.lane_id);
    const path = lane?.paths.find(p => p.id === triage.path_id);
    
    if (!path) throw new Error(`Invalid Lane/Path: ${triage.lane_id}/${triage.path_id}`);

    const schemaDefinition = JSON.stringify(path.extraction_schema, null, 2);
    
    console.log(`Zone B: Extracting using Granular Schema: ${path.name}`);

    const prompt = `
      You are a Forensic Analyst.
      Document Type: ${path.name}
      
      STRICT REQUIREMENT: Extract data EXACTLY according to this Schema:
      ${schemaDefinition}
      
      - For every field found, return the value AND the bounding_box [ymin, xmin, ymax, xmax].
      - If a field is missing, set to null.
      - Capture ANY other 'marginalia' or handwritten notes in a separate 'fragments' array.
      
      Output JSON:
      {
        "extracted_data": { ... matches schema ... },
        "fragments": [ { "text": "...", "bbox": [...] } ]
      }
    `;

    const imagePart = { inlineData: { data: fileBuffer.toString('base64'), mimeType: mimeType } };
    const result = await this.geminiModel.generateContent([prompt, imagePart]);
    const text = result.response.candidates[0].content.parts[0].text;
    
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  }
}
