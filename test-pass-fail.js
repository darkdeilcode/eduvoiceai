/**
 * Test script to verify pass/fail functionality in the language test evaluation API
 */
const fetch = require('node-fetch');

async function testPassFailFunctionality() {
    console.log('🧪 Testing pass/fail functionality...');

    // Test data for a high score (should pass)
    const passingTestData = {
        conversationTurns: [
            {
                type: 'ai',
                message: 'Hello! How are you today?',
                timestamp: Date.now() - 30000
            },
            {
                type: 'user',
                message: 'I am doing very well, thank you for asking. How about you?',
                transcript: 'I am doing very well, thank you for asking. How about you?',
                timestamp: Date.now() - 25000
            },
            {
                type: 'ai',
                message: 'I\'m great! What did you do yesterday?',
                timestamp: Date.now() - 20000
            },
            {
                type: 'user',
                message: 'Yesterday I went to the park with my family and we had a wonderful picnic. The weather was perfect and we played games together.',
                transcript: 'Yesterday I went to the park with my family and we had a wonderful picnic. The weather was perfect and we played games together.',
                timestamp: Date.now() - 15000
            }
        ],
        testConfig: {
            language: "English",
            languageCode: "en",
            difficulty: "beginner",
            testType: "speaking"
        }
    };

    // Test data for a low score (should fail)
    const failingTestData = {
        conversationTurns: [
            {
                type: 'ai',
                message: 'Hello! How are you today?',
                timestamp: Date.now() - 30000
            },
            {
                type: 'user',
                message: 'Me good',
                transcript: 'Me good',
                timestamp: Date.now() - 25000
            },
            {
                type: 'ai',
                message: 'What did you do yesterday?',
                timestamp: Date.now() - 20000
            },
            {
                type: 'user',
                message: 'Go park',
                transcript: 'Go park',
                timestamp: Date.now() - 15000
            }
        ],
        testConfig: {
            language: "English",
            languageCode: "en",
            difficulty: "beginner",
            testType: "speaking"
        }
    };

    try {
        // Test passing scenario
        console.log('\n🎯 Testing PASSING scenario...');
        const passingResponse = await fetch('http://localhost:3000/api/language-test/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(passingTestData)
        });

        const passingResult = await passingResponse.json();
        
        if (passingResponse.ok) {
            console.log('✅ Passing test API call successful');
            console.log(`📊 Score: ${passingResult.report.overallScore}%`);
            console.log(`🎯 Pass Threshold: ${passingResult.report.passThreshold}%`);
            console.log(`${passingResult.report.isPassed ? '✅ PASSED' : '❌ FAILED'}: ${passingResult.report.resultMessage}`);
        } else {
            console.log('❌ Passing test failed:', passingResult.error);
        }

        // Test failing scenario
        console.log('\n🎯 Testing FAILING scenario...');
        const failingResponse = await fetch('http://localhost:3000/api/language-test/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(failingTestData)
        });

        const failingResult = await failingResponse.json();
        
        if (failingResponse.ok) {
            console.log('✅ Failing test API call successful');
            console.log(`📊 Score: ${failingResult.report.overallScore}%`);
            console.log(`🎯 Pass Threshold: ${failingResult.report.passThreshold}%`);
            console.log(`${failingResult.report.isPassed ? '✅ PASSED' : '❌ FAILED'}: ${failingResult.report.resultMessage}`);
        } else {
            console.log('❌ Failing test failed:', failingResult.error);
        }

        // Test different difficulty levels
        console.log('\n🎯 Testing different difficulty levels...');
        const difficulties = ['beginner', 'intermediate', 'advanced'];
        
        for (const difficulty of difficulties) {
            const testData = {
                ...passingTestData,
                testConfig: {
                    ...passingTestData.testConfig,
                    difficulty: difficulty
                }
            };

            const response = await fetch('http://localhost:3000/api/language-test/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData)
            });

            const result = await response.json();
            
            if (response.ok) {
                console.log(`📚 ${difficulty.toUpperCase()}: ${result.report.passThreshold}% required, ${result.report.overallScore}% scored`);
            }
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testPassFailFunctionality();
