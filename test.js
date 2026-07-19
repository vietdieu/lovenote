fetch("http://localhost:3000/api/generate-video", {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: "Test", scene: "sunset" })
}).then(r => r.text()).then(console.log).catch(console.error);
