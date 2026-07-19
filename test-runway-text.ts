import RunwayML from '@runwayml/sdk';
console.log(Object.getOwnPropertyNames(RunwayML.prototype));
const client = new RunwayML({ apiKey: "fake" });
console.log(Object.getOwnPropertyNames(client.imageToVideo.constructor.prototype));
