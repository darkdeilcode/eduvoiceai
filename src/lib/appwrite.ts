import * as Appwrite from 'appwrite';

// Debug logging
console.log('🔧 Appwrite Client Configuration:', {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  environment: process.env.NODE_ENV
});

// Use environment variables instead of hardcoded values
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (typeof endpoint !== 'string' || endpoint.trim() === '') {
  throw new Error(
    `NEXT_PUBLIC_APPWRITE_ENDPOINT is not a valid string or is empty. Value: "${endpoint}", Type: ${typeof endpoint}. Please check your .env file and ensure your Next.js server has been restarted.`
  );
}
if (typeof projectId !== 'string' || projectId.trim() === '') {
  throw new Error(
    `NEXT_PUBLIC_APPWRITE_PROJECT_ID is not a valid string or is empty. Value: "${projectId}", Type: ${typeof projectId}. Please check your .env file and ensure your Next.js server has been restarted.`
  );
}

const client = new Appwrite.Client();

try {
  client
    .setEndpoint(endpoint.trim())
    .setProject(projectId.trim());
  
  console.log('✅ Appwrite client configured successfully');
} catch (e: any) {
  throw new Error(
    `Failed to configure Appwrite client. Endpoint used: "${endpoint}", Project ID used: "${projectId}". Original error: ${e.message}. Ensure the endpoint is a valid URL.`
  );
}

const account = new Appwrite.Account(client);
const databases = new Appwrite.Databases(client);
const storage = new Appwrite.Storage(client);
const avatars = new Appwrite.Avatars(client);

const ID = Appwrite.ID;
const Permission = Appwrite.Permission;
const Role = Appwrite.Role;
const Query = Appwrite.Query;
const AppwriteException = Appwrite.AppwriteException;

export { client, account, databases, storage, avatars, ID, Permission, Role, Query, AppwriteException };

// Use environment variables consistently
export const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
export const LECTURES_COLLECTION_ID = "683b410f00019daca347";
export const INTERVIEWS_COLLECTION_ID = "683b4b0300073d4d422d";
export const VOUCHERS_COLLECTION_ID = "683b7afb0005412f9f72";
export const TRANSACTIONS_COLLECTION_ID = "683c0ac00011de2eaee0";
export const QA_REPORTS_COLLECTION_ID = "683c8de60036a02e5a17";
export const PROFILE_IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_IMAGES_BUCKET_ID!;

// Validation
if (!APPWRITE_DATABASE_ID) {
    console.error("❌ APPWRITE_DATABASE_ID is missing. Please set NEXT_PUBLIC_APPWRITE_DATABASE_ID in your .env file.");
}
if (!USERS_COLLECTION_ID) {
    console.error("❌ USERS_COLLECTION_ID is missing. Please set NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID in your .env file.");
}

if (typeof PROFILE_IMAGES_BUCKET_ID !== 'string' || PROFILE_IMAGES_BUCKET_ID.trim() === '') {
  console.warn( 
    `⚠️ PROFILE_IMAGES_BUCKET_ID is not a valid string or is empty. Value: "${PROFILE_IMAGES_BUCKET_ID}", Type: ${typeof PROFILE_IMAGES_BUCKET_ID}. Profile image functionality will be affected.`
  );
}

// Ensuring core collection IDs are valid before certain operations
if (!LECTURES_COLLECTION_ID || !INTERVIEWS_COLLECTION_ID || !VOUCHERS_COLLECTION_ID || !TRANSACTIONS_COLLECTION_ID || !USERS_COLLECTION_ID || !QA_REPORTS_COLLECTION_ID) {
    console.error("❌ One or more critical Appwrite Collection IDs are missing. Please check your configuration.");
}

console.log('📋 Collection IDs loaded:', {
  APPWRITE_DATABASE_ID,
  USERS_COLLECTION_ID,
  LECTURES_COLLECTION_ID,
  INTERVIEWS_COLLECTION_ID
});