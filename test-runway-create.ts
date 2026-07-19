import RunwayML from '@runwayml/sdk';
const client = new RunwayML({ apiKey: "fake" });
console.log(typeof client.imageToVideo.create({} as any).waitForTaskOutput);
