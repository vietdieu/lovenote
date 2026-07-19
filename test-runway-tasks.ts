import RunwayML from '@runwayml/sdk';
console.log(Object.keys(new RunwayML({ apiKey: "fake" }).tasks));
