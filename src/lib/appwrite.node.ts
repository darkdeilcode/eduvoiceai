import { Client, Databases, Users, Storage, Avatars, ID, Permission, Role, Query, AppwriteException } from 'node-appwrite';

// Use environment variable instead of hardcoded value
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

let clientInitialized = false;
let initializationError: string | null = null;

// Debug logging
console.log('🔧 Appwrite Node.js Configuration:', {
  endpoint,
  projectId,
  apiKeyPresent: !!apiKey,
  environment: process.env.NODE_ENV
});

if (!endpoint || !projectId || !apiKey) {
  let missingVars = [];
  if (!endpoint) missingVars.push("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  if (!projectId) missingVars.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  if (!apiKey) missingVars.push("APPWRITE_API_KEY");
  initializationError = `Appwrite Node SDK: Missing environment variables: ${missingVars.join(", ")}`;
  console.error('❌', initializationError);
}

const client = new Client();

if (!initializationError) {
  try {
    client
      .setEndpoint(endpoint!)
      .setProject(projectId!)
      .setKey(apiKey!);
    clientInitialized = true;
    console.log("✅ Appwrite Node.js client initialized successfully");
  } catch (e: any) {
    initializationError = `Failed to initialize Appwrite Node.js client: ${e.message}`;
    console.error('❌', initializationError, e);
  }
}

const databases = new Databases(client);
const users = new Users(client);
const storage = new Storage(client);
const avatars = new Avatars(client);

export { client, databases, users, storage, avatars, ID, Permission, Role, Query, AppwriteException, clientInitialized, initializationError };

// Use environment variables consistently
export const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
export const LECTURES_COLLECTION_ID = "683b410f00019daca347";
export const INTERVIEWS_COLLECTION_ID = "683b4b0300073d4d422d";
export const VOUCHERS_COLLECTION_ID = "683b7afb0005412f9f72";
export const TRANSACTIONS_COLLECTION_ID = "683c0ac00011de2eaee0";
export const QA_REPORTS_COLLECTION_ID = "683c8de60036a02e5a17";
export const LANGUAGE_TESTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_LANGUAGE_TESTS_COLLECTION_ID!;
export const PROFILE_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_IMAGES_BUCKET_ID!;
export const AUDIO_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_AUDIO_BUCKET_ID!;

// Validation
if (!APPWRITE_DATABASE_ID) {
    console.error("❌ APPWRITE_DATABASE_ID missing from environment");
}
if (!USERS_COLLECTION_ID) {
    console.error("❌ USERS_COLLECTION_ID missing from environment");
}