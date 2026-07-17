import { HfInference } from '@huggingface/inference';
const hf = new HfInference(process.env.hugging_API_KEY || process.env.HUGGING_API_KEY || "hf_your_key_here");
hf.imageToVideo({
  model: 'stabilityai/stable-video-diffusion-img2vid-xt',
  image: await (await fetch('https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png')).blob()
}).then(console.log).catch(console.error);
