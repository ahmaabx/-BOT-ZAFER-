const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "تخيل",
    aliases: ["ارسم", "توليد"],
    version: "1.0",
    author: "حسين يعقوبي",
    role: 0,
    countDown: 10,
    longDescription: {
      en: "Generates an anime-style image based on the provided description."
    },
    category: "متعة",
    guide: {
      en: "{pn} <وصف الصورة>\nمثال: {pn} فتاة لطيفة"
    }
  },

  onStart: async function ({ args, api, event }) {
    if (args.length === 0) {
      api.sendMessage("⚠️ | يرجى إدخال وصف لتوليد الصورة.", event.threadID, event.messageID);
      return;
    }

    api.setMessageReaction("🕐", event.messageID, (err) => {}, true);

    try {
      const prompt = args.join(" ");

      // Translate text from Arabic to English if needed
      const translationResponse = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(prompt)}`);
      const translatedPrompt = translationResponse?.data?.[0]?.[0]?.[0] || prompt;

      // Use the new API URL to generate an image
      const apiUrl = `https://api.kenliejugarap.com/flux-anime/?width=140&height=200&prompt=${encodeURIComponent(translatedPrompt)}`;
      const startTime = Date.now();

      const apiResponse = await axios.get(apiUrl);
      const imageUrl = apiResponse?.data?.images?.[0];

      if (!imageUrl) {
        api.sendMessage("❌ | لم يتم العثور على أي صور بناءً على الوصف.", event.threadID, event.messageID);
        return;
      }

      // Download the image from the URL
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

      // Define cache folder path and save image
      const cacheFolderPath = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }

      const imagePath = path.join(cacheFolderPath, `${Date.now()}_generated_image.png`);
      fs.writeFileSync(imagePath, Buffer.from(imageResponse.data, "binary"));

      const stream = fs.createReadStream(imagePath);

      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;
      const timeString = moment.tz(endTime, "Africa/Casablanca").format("hh:mm:ss A");
      const dateString = moment.tz(endTime, "Africa/Casablanca").format("YYYY-MM-DD");

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      await api.sendMessage({
        body: `✅❪𝒈𝒆𝒏𝒆𝒓𝒂𝒕𝒆𝒅 𝒔𝒖𝒄𝒄𝒆𝒔𝒔𝒇𝒖𝒍𝒍𝒚❫✅\n\n⌬︙𝒆𝒙𝒆𝒄𝒖𝒕𝒊𝒐𝒏 𝒕𝒊𝒎𝒆 ➭『${executionTime}』s\n⌬︙𝖙𝖎𝖒𝖊 ➭『${timeString}』\n⌬︙𝖉𝖆𝖙𝖊 ➭『${dateString}』`,
        attachment: stream
      }, event.threadID, event.messageID);

      // Clean up the cache
      fs.removeSync(imagePath);

    } catch (error) {
      console.error("Error:", error);
      api.sendMessage("❌ | حدث خطأ. يرجى المحاولة لاحقاً.", event.threadID, event.messageID);
    }
  }
};
