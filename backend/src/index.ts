import { cloudEvent } from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as path from 'path';

// --- INITIALIZATION ---
const storage = new Storage();
const firestore = new Firestore();
const vision = new ImageAnnotatorClient();

const COLLECTION_CASES = 'forensic_cases';

// --- TYPES ---
interface StorageEventData {
  bucket: string;
  name: string;
  contentType: string;
  timeCreated: string;
}

interface ForensicAnalysis {
  raw_text: string | null;
  detected_entities: {
    currency_references: string[];
    dates: string[];
  };
  ocr_confidence: number;
}

/**
 * CORE LOGIC: processDocument
 * 1. Validates File
 * 2. Extracts Text (OCR) via Cloud Vision
 * 3. Runs Basic Financial Pattern Matching
 * 4. Updates Firestore Fact Base
 */
cloudEvent('processDocument', async (cloudEvent: any) => {
  const fileData = cloudEvent.data as StorageEventData;
  const bucketName = fileData.bucket;
  const fileName = fileData.name;

  console.log(`🚀 START: Processing ${fileName}`);

  if (!fileName || fileName.endsWith('/')) {
    return; // Ignore directories
  }

  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    const gcsUri = `gs://${bucketName}/${fileName}`;

    // 1. Perform OCR (Text Extraction)
    // Note: For PDFs, we use asyncBatchAnnotate. For Images, textDetection.
    // This implementation defaults to 'textDetection' for images/simple docs 
    // to ensure immediate execution without waiting for long-running PDF operations.
    const [result] = await vision.textDetection(gcsUri);
    const detections = result.textAnnotations;

    let analysis: ForensicAnalysis = {
      raw_text: null,
      detected_entities: { currency_references: [], dates: [] },
      ocr_confidence: 0
    };

    if (detections && detections.length > 0) {
      const fullText = detections[0].description || '';
      analysis.raw_text = fullText;
      analysis.ocr_confidence = detections[0].score || 0;

      // 2. Heuristic Extraction (Basic Pattern Matching)
      // Capture standard currency formats ($1,000.00)
      const currencyRegex = /\$\s?(\d{1,3}(,\d{3})*(\.\d{2})?)/g;
      const currencyMatches = fullText.match(currencyRegex) || [];
      analysis.detected_entities.currency_references = currencyMatches;

      // Capture standard date formats (MM/DD/YYYY or YYYY-MM-DD)
      const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\b/g;
      const dateMatches = fullText.match(dateRegex) || [];
      analysis.detected_entities.dates = dateMatches;
    }

    // 3. Update Fact Base (Firestore)
    const caseId = fileName.replace(/\//g, '_'); // Sanitize ID
    const docRef = firestore.collection(COLLECTION_CASES).doc(caseId);

    await docRef.set({
      file_name: fileName,
      bucket: bucketName,
      ingested_at: new Date().toISOString(),
      status: 'PROCESSED',
      metadata: {
        content_type: fileData.contentType,
        size: (await file.getMetadata())[0].size,
      },
      forensic_data: analysis
    }, { merge: true });

    console.log(`✅ Fact Base Updated: ${caseId} | Found ${analysis.detected_entities.currency_references.length} financial references.`);

  } catch (error) {
    console.error(`🔥 FAILURE processing ${fileName}:`, error);
    // Log failure state to DB so it doesn't hang in "Processing"
    const caseId = fileName.replace(/\//g, '_');
    await firestore.collection(COLLECTION_CASES).doc(caseId).set({
      status: 'ERROR',
      error_log: JSON.stringify(error)
    }, { merge: true });
  }
});