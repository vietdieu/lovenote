import RunwayML from '@runwayml/sdk';
const client = new RunwayML({ apiKey: "key_c693b8196cd9b27f20b20b8854d6f725c1f63f840c7a5dd7fc948e55064e49660a3851ee6edc60cbe3616f3329c3f2c7f88fad059793745c74ff48557a57cf3a" });
async function run() {
  try {
    console.log("running...");
    const p = client.imageToVideo.create({
      model: 'gen3a_turbo',
      promptImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/1280px-Image_created_with_a_mobile_phone.png",
      promptText: "test"
    });
    p.catch(() => {});
    await p.waitForTaskOutput();
    console.log("done");
  } catch (e: any) {
    console.log("CAUGHT", e.message);
  }
}
run();
