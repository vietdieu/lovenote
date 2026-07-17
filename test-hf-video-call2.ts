import { HfInference } from '@huggingface/inference';
const hf = new HfInference(process.env.hugging_API_KEY || process.env.HUGGING_API_KEY || "hf_your_key_here");
hf.textToVideo({
  model: 'ali-vilab/text-to-video-ms-1.7b', // or some other text to video model
  inputs: 'A cute cat'
}).then(console.log).catch(console.error);
