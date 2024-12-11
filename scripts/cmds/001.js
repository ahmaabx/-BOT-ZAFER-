const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "شوتي",
    aliases: [],
    author: "Kshitiz",
    version: "1.0",
    cooldowns: 10,
    role: 0,
    shortDescription: "قم بالحصول على مجموعة من مقاطع شوتي",
    longDescription: "قم بالحصول على مجموعة من مقاطع شوتي",
    category: "متعة",
    guide: "{p}شوتي",
  },

  onStart: async function ({ api, event, message }) {
    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);

    try {
      const response = await axios.get(`https://joncll.serv00.net/shotiapi.php`);

      const { videoUrl, title, duration, username, nickname, region } = response.data;

      const tempVideoPath = path.join(__dirname, "cache", `${Date.now()}.mp4`);

      const videoResponse = await axios.get(videoUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(tempVideoPath);
      videoResponse.data.pipe(writer);

      writer.on("finish", async () => {
        const stream = fs.createReadStream(tempVideoPath);

        message.reply({
          body: `✅ | تـم تـحـمـيـل مـقـطـع شـوتـي \n🎬 | الـعـنـوان: ${title || "غير متوفر"}\n⏳ | الـمـدة: ${duration}\n👤 | الـإسـم: ${username}\n💬 | الـلـقـب: ${nickname}\n🌍 | الـمـنـطـقـة: ${region}`,
          attachment: stream,
        });

        api.setMessageReaction("✅", event.messageID, (err) => {}, true);
        fs.unlinkSync(tempVideoPath); // Remove the temporary video file after sending
      });
    } catch (error) {
      console.error(error);
      message.reply("❌ | عذرا، حدث خطأ أثناء معالجة طلبك.");
    }
  }
};
