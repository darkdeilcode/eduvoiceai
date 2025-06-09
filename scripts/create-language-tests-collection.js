/**
 * Script to create the Language Tests collection in Appwrite
 * Run with: node scripts/create-language-tests-collection.js
 */

const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

// Configuration
const client = new Client()
    .setEndpoint('https://aibackend.cloud/v1')
    .setProject('683e101200213e14d7f2')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = '683e107b001be60857c2';
const COLLECTION_ID = '6845a8b90027b53f1f80';

async function createLanguageTestsCollection() {
    try {
        console.log('🏗️ Creating Language Tests collection...');
        
        // Check if collection already exists
        try {
            const existingCollection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
            console.log('✅ Collection already exists:', existingCollection.name);
            return;
        } catch (error) {
            // Collection doesn't exist, proceed with creation
            console.log('📝 Collection not found, creating new one...');
        }
        
        // Create the collection
        const collection = await databases.createCollection(
            DATABASE_ID,
            COLLECTION_ID,
            'Language Tests',
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        );
        
        console.log('✅ Collection created:', collection.name);
        
        // Define attributes
        const attributes = [
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'language', type: 'string', size: 100, required: true },
            { key: 'languageCode', type: 'string', size: 10, required: true },
            { key: 'difficulty', type: 'string', size: 50, required: true },
            { key: 'duration', type: 'integer', required: true },
            { key: 'status', type: 'string', size: 50, required: true },
            { key: 'startTime', type: 'integer', required: true },
            { key: 'endTime', type: 'integer', required: false },
            { key: 'prompts', type: 'string', size: 65535, required: false },
            { key: 'responses', type: 'string', size: 65535, required: false },
            { key: 'conversationHistory', type: 'string', size: 65535, required: false },
            { key: 'tavusConfig', type: 'string', size: 4096, required: false },
            { key: 'testMode', type: 'string', size: 50, required: false },
            { key: 'cviConfig', type: 'string', size: 4096, required: false },
            { key: 'cviResponse', type: 'string', size: 4096, required: false },
            { key: 'conversationId', type: 'string', size: 255, required: false },
            { key: 'conversationUrl', type: 'string', size: 1024, required: false },
            { key: 'dailyRoomUrl', type: 'string', size: 1024, required: false }
        ];
        
        console.log('📝 Creating attributes...');
        
        for (const attr of attributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(
                        DATABASE_ID,
                        COLLECTION_ID,
                        attr.key,
                        attr.size,
                        attr.required
                    );
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(
                        DATABASE_ID,
                        COLLECTION_ID,
                        attr.key,
                        attr.required
                    );
                }
                console.log(`✅ Created attribute: ${attr.key}`);
                
                // Wait a bit between attribute creations
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`❌ Failed to create attribute ${attr.key}:`, error.message);
            }
        }
        
        console.log('🎯 Creating indexes...');
        
        // Create indexes
        const indexes = [
            { key: 'userId_index', type: 'key', attributes: ['userId'] },
            { key: 'language_index', type: 'key', attributes: ['language'] },
            { key: 'status_index', type: 'key', attributes: ['status'] },
            { key: 'startTime_index', type: 'key', attributes: ['startTime'] }
        ];
        
        for (const index of indexes) {
            try {
                await databases.createIndex(
                    DATABASE_ID,
                    COLLECTION_ID,
                    index.key,
                    index.type,
                    index.attributes
                );
                console.log(`✅ Created index: ${index.key}`);
                
                // Wait between index creations
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`❌ Failed to create index ${index.key}:`, error.message);
            }
        }
        
        console.log('🎉 Language Tests collection setup complete!');
        
    } catch (error) {
        console.error('❌ Failed to create collection:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    createLanguageTestsCollection()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { createLanguageTestsCollection };
