import dotenv from 'dotenv';
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
