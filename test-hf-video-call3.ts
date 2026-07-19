import { HfInference } from '@huggingface/inference';
const hf = new HfInference(process.env.hugging_API_KEY || process.env.HUGGING_API_KEY || "hf_your_key_here");
hf.textToVideo({
  model: 'strangerzonehf/Flux-Midjourney-Mix2-LoRA', // not sure if video
  inputs: 'A cute cat'
}).then(console.log).catch(console.error);
