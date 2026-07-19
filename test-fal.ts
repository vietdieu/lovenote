import { fal } from '@fal-ai/client';
fal.config({ credentials: 'a87b4da5-0ef5-4d9b-b03f-1d0559296e68:cbc41db89d616f2fd94738fda82fb3be' });
fal.subscribe('fal-ai/pika', { input: { prompt: "test" } })
  .then(console.log)
  .catch(e => console.error(e.message));
