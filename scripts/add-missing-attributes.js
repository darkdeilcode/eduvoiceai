/**
 * Script to add missing attributes to the existing Language Tests collection
 * Run with: node scripts/add-missing-attributes.js
 */

const { Client, Databases } = require('node-appwrite');

// Configuration
const client = new Client()
    .setEndpoint('https://aibackend.cloud/v1')
    .setProject('683e101200213e14d7f2')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = '683e107b001be60857c2';
const COLLECTION_ID = '6845a8b90027b53f1f80'; // Your actual collection ID

async function addMissingAttributes() {
    try {
        console.log('🔧 Adding missing attributes to Language Tests collection...');
        
        // Check current collection
        const collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
        console.log('✅ Found collection:', collection.name);
        
        // Define missing attributes that the evaluation API needs
        const missingAttributes = [
            { 
                key: 'conversationTurns', 
                type: 'string', 
                size: 65535, 
                required: false,
                description: 'JSON string storing conversation data from CVI tests'
            },
            { 
                key: 'report', 
                type: 'string', 
                size: 65535, 
                required: false,
                description: 'JSON string storing the evaluation report'
            },
            { 
                key: 'testType', 
                type: 'string', 
                size: 50, 
                required: false,
                description: 'Type of test (speaking, writing, etc.)'
            },
            { 
                key: 'config', 
                type: 'string', 
                size: 4096, 
                required: false,
                description: 'JSON string storing test configuration'
            },
            { 
                key: 'questions', 
                type: 'string', 
                size: 65535, 
                required: false,
                description: 'JSON string storing test questions'
            },
            { 
                key: 'currentQuestionIndex', 
                type: 'integer', 
                required: false,
                description: 'Current question index for tracking progress'
            },
            { 
                key: 'tavusVideoId', 
                type: 'string', 
                size: 255, 
                required: false,
                description: 'Tavus video ID for CVI sessions'
            },
            { 
                key: 'currentPromptIndex', 
                type: 'integer', 
                required: false,
                description: 'Current prompt index for tracking progress'
            }
        ];
        
        console.log('📝 Adding missing attributes...');
        
        for (const attr of missingAttributes) {
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
                console.log(`✅ Added attribute: ${attr.key} - ${attr.description}`);
                
                // Wait between attribute creations to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`⚠️  Attribute ${attr.key} already exists, skipping...`);
                } else {
                    console.error(`❌ Failed to create attribute ${attr.key}:`, error.message);
                }
            }
        }
        
        console.log('🎉 Missing attributes added successfully!');
        console.log('📋 Your collection now supports:');
        console.log('   • Conversation data storage (conversationTurns)');
        console.log('   • Evaluation reports (report)');
        console.log('   • Test configuration (config, questions)');
        console.log('   • Progress tracking (currentQuestionIndex, currentPromptIndex)');
        console.log('   • Tavus integration (tavusVideoId)');
        
    } catch (error) {
        console.error('❌ Failed to add attributes:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    addMissingAttributes()
        .then(() => {
            console.log('✅ Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { addMissingAttributes };
