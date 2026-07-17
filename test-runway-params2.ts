import RunwayML from '@runwayml/sdk';
const client = new RunwayML({ apiKey: "fake" });
client.textToVideo.create({} as any).catch(e => console.log(e.message));
