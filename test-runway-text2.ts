import RunwayML from '@runwayml/sdk';
const client = new RunwayML({ apiKey: "fake" });
console.log(Object.getOwnPropertyNames(client.textToVideo.constructor.prototype));
