import { HfInference } from '@huggingface/inference';
console.log(Object.keys(new HfInference("fake").textToVideo ? {textToVideo: true} : {}));
