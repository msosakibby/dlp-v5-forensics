
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
