import os
import datetime

def create_project_structure():
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    project_name = f"Divorce_Language_Processor_v5_3_{timestamp}"
    
    directories = [
        f"{project_name}/src",
        f"{project_name}/src/config",
        f"{project_name}/src/core",
        f"{project_name}/src/domain",
        f"{project_name}/src/ingestion",
        f"{project_name}/src/utils"
    ]

    for directory in directories:
        os.makedirs(directory, exist_ok=True)

    files = {}

    # --- Config ---
    files[f"{project_name}/package.json"] = """{
  "name": "dlp-v5-3-conservancy",
  "version": "5.3.0",
  "description": "DLP v5.3: Conservancy & Hobby Loss Forensics",
  "main": "dist/src/ingestion/main.js",
  "scripts": {
    "build": "tsc",
    "start": "functions-framework --target=processDocument"
  },
  "dependencies": {
    "@google-cloud/functions-framework": "^3.3.0",
    "@google-cloud/storage": "^7.7.0",
    "@google-cloud/vertexai": "^0.4.0",
    "@google-cloud/vision": "^4.0.0",
    "@prisma/client": "^5.10.0",
    "zod": "^3.22.4",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.19",
    "prisma": "^5.10.0"
  }
}
"""

    files[f"{project_name}/src/config/env.ts"] = """import dotenv from 'dotenv';
dotenv.config();

export const config = {
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || 'dlp-v4-forensics',
    location: process.env.GCP_LOCATION || 'us-central1',
  },
  ai: {
    triage_model: 'gemini-1.5-flash-preview-0514', 
    analyst_model: 'gemini-1.5-pro-preview-0409',
    embedding_model: 'text-embedding-004',
  }
};
"""

    # --- DOMAIN: The New Lane Configuration ---
    files[f"{project_name}/src/domain/types.ts"] = """
export interface ExtractionSchema {
  target_data_elements: Record<string, any>;
}

export interface LanePath {
  id: string;
  name: string;
  description: string;
  extraction_schema: ExtractionSchema;
}

export interface Lane {
  id: string;
  name: string;
  group: string;
  paths: LanePath[];
}
"""

    files[f"{project_name}/src/domain/lanes.config.ts"] = """
import { Lane } from './types';

export const FORENSIC_LANES: Lane[] = [
  // ============================================================================
  // GROUP A: CORE ASSETS
  // ============================================================================
  {
    id: '01',
    name: 'Property & Real Estate',
    group: 'Core Assets',
    paths: [
      {
        id: 'deeds',
        name: 'Deeds',
        description: 'Ownership deeds for 320-acre properties',
        extraction_schema: {
          target_data_elements: {
            document_type: { type: "string" },
            recording_info: { type: "object", items: { liber: { type: "string" }, record_date: { type: "date" } } },
            parties: { type: "object", items: { grantor: { type: "string" }, grantee: { type: "string" } } },
            property_identifiers: { type: "object", items: { parcel_id: { type: "string" }, legal_desc: { type: "string" } } },
            consideration_amount: { type: "currency", description: "Was it sold for $1?" },
            transfer_tax: { type: "currency", description: "Implies true value" }
          }
        }
      },
      {
        id: 'tax_assessments',
        name: 'Property Tax',
        description: 'Tax bills for woodlands',
        extraction_schema: {
          target_data_elements: {
            tax_year: { type: "string" },
            taxable_value: { type: "currency" },
            state_equalized_value: { type: "currency" },
            millage_rate: { type: "number" },
            total_tax_due: { type: "currency" }
          }
        }
      }
    ]
  },
  // ============================================================================
  // GROUP C: LAND & CONSERVANCY (The "Hobby" Farm)
  // ============================================================================
  {
    id: '09',
    name: 'Timber & Resources',
    group: 'Land & Conservancy',
    paths: [
      {
        id: 'timber_contracts',
        name: 'Timber Harvesting Contracts',
        description: 'Stumpage, thinning, and logging agreements',
        extraction_schema: {
          target_data_elements: {
            logger_name: { type: "string" },
            contract_date: { type: "date" },
            species_harvested: { type: "string" },
            volume_mbf: { type: "number" },
            stumpage_rate: { type: "currency" },
            total_payment: { type: "currency" },
            payment_dest_account: { type: "string", description: "Did this go to Joint or Separate?" }
          }
        }
      },
      {
        id: 'mineral_rights',
        name: 'Mineral/Oil/Gas Leases',
        description: 'Subsurface rights revenue',
        extraction_schema: {
          target_data_elements: {
            lessee: { type: "string" },
            lease_term: { type: "string" },
            royalty_percent: { type: "percentage" },
            signing_bonus: { type: "currency" },
            monthly_royalties: { type: "currency" }
          }
        }
      }
    ]
  },
  {
    id: '10',
    name: 'Government Programs',
    group: 'Land & Conservancy',
    paths: [
      {
        id: 'usda_contracts',
        name: 'USDA/NRCS Contracts',
        description: 'CRP, EQIP, WHIP programs',
        extraction_schema: {
          target_data_elements: {
            program_name: { type: "string" },
            contract_number: { type: "string" },
            practice_code: { type: "string" },
            cost_share_amount: { type: "currency" },
            obligated_completion_date: { type: "date" }
          }
        }
      },
      {
        id: 'dnr_permits',
        name: 'DNR Management Plans',
        description: 'Forest stewardship and wildlife mgmt',
        extraction_schema: {
          target_data_elements: {
            plan_type: { type: "string" },
            enrolled_acres: { type: "number" },
            tax_abatement: { type: "boolean" },
            mandatory_actions: { type: "array" }
          }
        }
      }
    ]
  },
  {
    id: '11',
    name: 'Land Improvements (Hobby Spend)',
    group: 'Land & Conservancy',
    paths: [
      {
        id: 'heavy_equipment',
        name: 'Heavy Equipment',
        description: 'Tractors, Skidders, Dozers',
        extraction_schema: {
          target_data_elements: {
            equipment_type: { type: "string" },
            purchase_price: { type: "currency" },
            funding_source: { type: "string" },
            business_justification: { type: "string" },
            usage_evidence: { type: "string" }
          }
        }
      },
      {
        id: 'conservation_inputs',
        name: 'Conservation Inputs',
        description: 'Seed, Fertilizer, Lime for food plots',
        extraction_schema: {
          target_data_elements: {
            product_type: { type: "string" },
            quantity: { type: "number" },
            cost: { type: "currency" },
            location_applied: { type: "string" }
          }
        }
      }
    ]
  },
  // ============================================================================
  // GROUP D: LIFESTYLE LEAKAGE (Grocery Store Funding)
  // ============================================================================
  {
    id: '13',
    name: 'Subsidy & Third-Party',
    group: 'Lifestyle',
    paths: [
      {
        id: 'gifts',
        name: 'Non-Obligatory Gifts',
        description: 'Discretionary giving',
        extraction_schema: {
          target_data_elements: {
            recipient: { type: "string" },
            date: { type: "date" },
            value: { type: "currency" }
          }
        }
      }
    ]
  },
  {
    id: '17',
    name: 'Sporting & Recreation',
    group: 'Lifestyle',
    paths: [
      {
        id: 'ammo',
        name: 'Ammunition & Gear',
        description: 'Consumable supplies',
        extraction_schema: {
          target_data_elements: {
            retailer: { type: "string" },
            caliber: { type: "string" },
            price: { type: "currency" }
          }
        }
      }
    ]
  }
];
"""

    # --- TRIAGE (Aware of new lanes) ---
    files[f"{project_name}/src/ingestion/triage.ts"] = """import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
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
        menu += `- LANE ${lane.id} / PATH '${path.id}': ${path.name} (${path.description})\\n`;
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
"""

    # --- TRANSCRIBER (Injects Schema) ---
    files[f"{project_name}/src/ingestion/transcriber.ts"] = """import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
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
"""

    # --- DB & Pipeline Stubs ---
    files[f"{project_name}/src/core/schema.prisma"] = """generator client { provider = "prisma-client-js" } datasource db { provider = "postgresql" url = env("DATABASE_URL") } model Document { id String @id @default(uuid()) }"""
    files[f"{project_name}/src/ingestion/main.ts"] = "// Entry Point"
    files[f"{project_name}/src/utils/db.ts"] = "export class DbClient {}"
    files[f"{project_name}/tsconfig.json"] = """{ "compilerOptions": { "target": "ES2022", "module": "commonjs", "strict": true } }"""

    for path, content in files.items():
        with open(path, "w") as f:
            f.write(content)
    print(f"DLP v5.3 (Conservancy Edition) Generated: {project_name}")

if __name__ == "__main__":
    create_project_structure()