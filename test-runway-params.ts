import RunwayML from '@runwayml/sdk';
const client = new RunwayML({ apiKey: "fake" });
client.imageToVideo.create({} as any).catch(e => console.log(e.message));
client.imageToVideo.create({ promptText: "x", model: "gen3a_turbo", promptImage: "data:image/jpeg;base64,x" } as any).catch(e => console.log(e.message));
