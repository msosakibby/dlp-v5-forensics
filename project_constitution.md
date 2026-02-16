# Project Constitution: Legal Forensics v4

## 1. Overview

This document outlines the architecture and design principles of the Legal Forensics v4 project. This is an event-driven forensic engine designed to process and analyze evidence files.

## 2. System Architecture

The system is composed of a frontend web application, a serverless backend, and a suite of Google Cloud services.

### 2.1. Frontend

*   **Technology:** The frontend is a single-page application (SPA).
    *   **Framework:** The presence of `App.jsx` and `main.jsx` suggests a JavaScript framework like React or a similar library that uses JSX.
    *   **Build Tool:** Vite (`vite.config.js`) is used for frontend development and building.
*   **Functionality:** The frontend provides a user interface for uploading files that are to be processed by the forensic engine.

### 2.2. Backend

*   **Technology:** The backend is built on a serverless architecture using Google Cloud Functions.
    *   **Language:** TypeScript (`backend/src/index.ts`)
    *   **Environment:** Node.js
*   **Core Components:**
    *   **Google Cloud Storage:** Used for storing uploaded evidence files.
    *   **Google Cloud Functions:** A function is triggered when a new file is uploaded to the designated Cloud Storage bucket.
    *   **Google Cloud Vision API:** The triggered function uses the Vision API to perform image analysis on the uploaded files.
    *   **Google Cloud Firestore:** The results of the analysis are stored in a Firestore database in the `forensic_cases` collection.

### 2.3. Data Flow

1.  A user uploads an evidence file (e.g., an image) via the frontend application.
2.  The file is uploaded to a specific bucket in Google Cloud Storage.
3.  This upload event triggers the backend Cloud Function.
4.  The Cloud Function (`backend/src/index.ts`) receives the event notification.
5.  The function downloads the file from Cloud Storage.
6.  It then calls the Google Cloud Vision API to analyze the file's contents.
7.  The analysis results are structured and saved as a new document in the `forensic_cases` collection in Firestore.

## 3. Deployment

The `master_deploy.js` script automates the deployment process. It is responsible for:
*   Cleaning the environment.
*   Building the backend (transpiling TypeScript to JavaScript).
*   Deploying the frontend and backend to their respective hosting environments.

## 4. Key Files

*   `frontend/src/App.jsx`: Main React component for the frontend application.
*   `frontend/index.html`: The entry point for the frontend application.
*   `backend/src/index.ts`: The core logic for the backend Cloud Function.
*   `master_deploy.js`: The deployment script.
*   `README.md`: Project overview and setup instructions.
*   `project_constitution.md`: This document.