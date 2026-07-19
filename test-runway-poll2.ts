import RunwayML from '@runwayml/sdk';
console.log(Object.getOwnPropertyNames(new RunwayML({ apiKey: "fake" }).tasks.constructor.prototype));
