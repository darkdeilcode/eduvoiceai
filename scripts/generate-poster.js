// Script to generate a Tavus video poster image

const canvas = document.createElement('canvas');
canvas.width = 640;
canvas.height = 360;
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

// Create gradient background
const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
gradient.addColorStop(0, '#3a7bd5');
gradient.addColorStop(1, '#00d2ff');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Draw play button icon
ctx.beginPath();
ctx.arc(canvas.width / 2, canvas.height / 2 - 20, 40, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
ctx.fill();

ctx.beginPath();
ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2 - 40);
ctx.lineTo(canvas.width / 2 - 10, canvas.height / 2);
ctx.lineTo(canvas.width / 2 + 15, canvas.height / 2 - 20);
ctx.fillStyle = 'white';
ctx.fill();

// Add text
ctx.font = 'bold 24px sans-serif';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.fillText('AI Language Tutor', canvas.width / 2, canvas.height / 2 + 40);

ctx.font = '18px sans-serif';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.fillText('Your AI video avatar is preparing to assist', canvas.width / 2, canvas.height / 2 + 80);
ctx.fillText('with your language learning', canvas.width / 2, canvas.height / 2 + 110);

// Download as PNG
const link = document.createElement('a');
link.download = 'tavus-poster.png';
link.href = canvas.toDataURL('image/png');
link.click();
