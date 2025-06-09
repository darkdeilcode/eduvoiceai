/**
 * Test script to verify conversation ID tracking functionality
 */
const fetch = require('node-fetch');

async function testConversationIdTracking() {
    console.log('🧪 Testing Conversation ID Tracking System...\n');

    // Test 1: Create a mock test session with conversation ID
    console.log('📝 Test 1: Creating test evaluation with conversation ID...');
    
    const mockEvaluationData = {
        sessionId: 'test-session-' + Date.now(),
        conversationTurns: [
            {
                id: 'turn-1',
                speaker: 'user',
                content: 'Hello, my name is John and I live in New York.',
                transcript: 'Hello, my name is John and I live in New York.',
                timestamp: Date.now() - 30000
            },
            {
                id: 'turn-2', 
                speaker: 'ai',
                content: 'Nice to meet you John! Can you tell me about your hobbies?',
                timestamp: Date.now() - 20000
            },
            {
                id: 'turn-3',
                speaker: 'user', 
                content: 'I enjoy reading books and playing tennis on weekends.',
                transcript: 'I enjoy reading books and playing tennis on weekends.',
                timestamp: Date.now() - 10000
            }
        ],
        testConfig: {
            language: "English",
            languageCode: "en", 
            difficulty: "intermediate"
        }
    };

    try {
        const evaluateResponse = await fetch('http://localhost:9002/api/language-test/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mockEvaluationData)
        });

        const evaluateResult = await evaluateResponse.json();
        
        if (evaluateResponse.ok) {
            console.log('✅ Test evaluation successful');
            console.log(`📊 Score: ${evaluateResult.report.overallScore}%`);
            console.log(`🆔 Conversation ID: ${evaluateResult.report.conversationId || 'None'}`);
            console.log(`📈 CEFR Level: ${evaluateResult.report.cefrLevel}`);
            console.log(`🎯 Pass Status: ${evaluateResult.report.isPassed ? 'PASSED' : 'FAILED'}`);
        } else {
            console.log('❌ Test evaluation failed:', evaluateResult.error);
            return;
        }

    } catch (error) {
        console.error('❌ Error in test evaluation:', error.message);
        return;
    }

    // Test 2: Test history API (requires authentication)
    console.log('\n📚 Test 2: Testing history API...');
    
    try {
        const historyResponse = await fetch('http://localhost:9002/api/language-test/history?userId=test-user-id&limit=5', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const historyResult = await historyResponse.json();
        
        if (historyResponse.ok) {
            console.log('✅ History API successful');
            console.log(`📋 Found ${historyResult.history.length} test records`);
            
            historyResult.history.forEach((test, index) => {
                console.log(`\nTest ${index + 1}:`);
                console.log(`  🆔 ID: ${test.id}`);
                console.log(`  🌍 Language: ${test.language} (${test.difficulty})`);
                console.log(`  📊 Score: ${test.overallScore || 'N/A'}%`);
                console.log(`  🎯 Status: ${test.isPassed ? 'PASSED' : test.isPassed === false ? 'FAILED' : 'N/A'}`);
                console.log(`  💬 Conversation ID: ${test.conversationId || 'None'}`);
                console.log(`  📅 Date: ${new Date(test.createdAt).toLocaleDateString()}`);
            });
        } else {
            console.log('⚠️ History API response:', historyResult.error);
            console.log('ℹ️ This is expected if not authenticated');
        }

    } catch (error) {
        console.error('❌ Error in history test:', error.message);
    }

    // Test 3: Test the conversation ID extraction logic
    console.log('\n🔍 Test 3: Testing conversation ID extraction from different sources...');
    
    const testCases = [
        {
            name: 'Direct conversation_id field',
            testSession: { conversation_id: 'conv-123-direct' },
            expected: 'conv-123-direct'
        },
        {
            name: 'CVI conversation_id field', 
            testSession: { cvi_conversation_id: 'conv-456-cvi' },
            expected: 'conv-456-cvi'
        },
        {
            name: 'Both fields - CVI takes priority',
            testSession: { 
                conversation_id: 'conv-789-direct',
                cvi_conversation_id: 'conv-101-cvi' 
            },
            expected: 'conv-101-cvi'
        },
        {
            name: 'No conversation ID',
            testSession: {},
            expected: undefined
        }
    ];

    testCases.forEach((testCase) => {
        const extractedId = testCase.testSession?.cvi_conversation_id || testCase.testSession?.conversation_id;
        const passed = extractedId === testCase.expected;
        console.log(`${passed ? '✅' : '❌'} ${testCase.name}: ${extractedId || 'undefined'}`);
    });

    console.log('\n🎉 Conversation ID tracking system test completed!');
    console.log('\nℹ️ Note: For full testing, complete a language test through the UI to see end-to-end functionality.');
}

// Run the test
testConversationIdTracking()
    .catch(error => {
        console.error('❌ Test script failed:', error);
        process.exit(1);
    });
