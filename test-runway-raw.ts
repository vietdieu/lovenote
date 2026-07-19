import fetch from 'node-fetch';
const res = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer key_invalid',
    'Content-Type': 'application/json',
    'X-Runway-Version': '2024-11-06'
  },
  body: JSON.stringify({
    model: 'gen3a_turbo',
    promptText: 'A cute cat'
  })
});
console.log(res.status, await res.text());
