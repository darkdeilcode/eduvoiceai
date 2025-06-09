/**
 * Simple test script to test the language test API
 */
const fetch = require('node-fetch');

async function testLanguageTestAPI() {
    const testConfig = {
        config: {
            language: "English",
            languageCode: "en",
            difficulty: "beginner",
            duration: 15,
            testType: "speaking_conversation"
        },
        userId: "test-user-id",
        testMode: "traditional",
        tavusConfig: {}
    };

    try {
        console.log('🧪 Testing language test API...');
        
        const response = await fetch('http://localhost:9003/api/language-test/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'appwrite-session=fake-session-for-testing'
            },
            body: JSON.stringify(testConfig)
        });

        const result = await response.json();
        
        console.log('📊 Response Status:', response.status);
        console.log('📋 Response Body:', JSON.stringify(result, null, 2));
        
        if (!response.ok) {
            console.log('❌ Test failed with error:', result.error);
            console.log('💬 Message:', result.message);
        } else {
            console.log('✅ Test passed!');
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testLanguageTestAPI();
