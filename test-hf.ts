import { HfInference } from '@huggingface/inference';
const hf = new HfInference("hf_odzLqNlK"); // fake key, we will just see if we get Auth error
hf.textToImage({
  model: 'black-forest-labs/FLUX.1-schnell',
  inputs: 'A cute cat'
}).then(console.log).catch(console.error);
