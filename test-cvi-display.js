// Test CVI Response Data Display
// This shows how your CVI response data will appear in the history page

const sampleCVIResponse = {
  "conversation_id": "c4d0e683f618a41c",
  "conversation_url": "https://tavus.daily.co/c4d0e683f618a41c",
  "status": "active",
  "created_at": "2025-06-08T21:05:47.180019Z"
};

console.log("🔵 CVI Response Data Display Preview:");
console.log("=====================================");
console.log(`Conversation ID: ${sampleCVIResponse.conversation_id}`);
console.log(`Conversation URL: ${sampleCVIResponse.conversation_url}`);
console.log(`Status: ${sampleCVIResponse.status} ✅`);
console.log(`Created: ${new Date(sampleCVIResponse.created_at).toLocaleString()}`);
console.log("\n📋 Full JSON for copying:");
console.log(JSON.stringify(sampleCVIResponse, null, 2));
console.log("\n✨ This data will appear in a blue-tinted card in your history page!");
