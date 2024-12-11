const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  threadStates: {},
  config: {
    name: 'تلقائي',
    version: '2.0.0',
    author: 'Kaizenji',
    countDown: 5,
    role: 0,
    shortDescription: 'Auto video downloader for multiple platforms',
    longDescription: { en: 'تحميل تلقائي للمقتطع من فيسبوك انستغرام فيسبوك يوتيوب' },
    category: 'وسائط',
    guide: '{p}{n}'
  },
  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    if (!this.threadStates[threadID]) {
      this.threadStates[threadID] = {};
    }
  },
  onChat: async function ({ api, event }) {
    const { body } = event;
    const threadID = event.threadID;

    const link = this.extractLink(body);
    if (link) {
      api.setMessageReaction("📥", event.messageID, (err) => {}, true);
      await this.downLoad(link, api, event);
    }
  },
  extractLink: function (message) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const link = message.match(urlRegex);
    return link ? link[0] : null;
  },
  downLoad: async function (url, api, event) {
    let BASE_URL;

    if (url.includes("facebook.com")) {
      BASE_URL = `https://www.samirxpikachu.run.place/fbdl?vid_url=${encodeURIComponent(url)}`;
    } else if (url.includes("twitter.com")) {
      BASE_URL = `https://www.samirxpikachu.run.place/twitter?url=${encodeURIComponent(url)}`;
    } else if (url.includes("tiktok.com")) {
      BASE_URL = `https://www.samirxpikachu.run.place/tiktok?url=${encodeURIComponent(url)}`;
    } else if (url.includes("open.spotify.com")) {
      BASE_URL = `https://www.samirxpikachu.run.place/spotifydl?url=${encodeURIComponent(url)}`;
    } else if (url.includes("youtu.be") || url.includes("youtube.com")) {
      BASE_URL = `https://www.samirxpikachu.run.place/ytdl?url=${encodeURIComponent(url)}`;
    } else if (url.includes("instagram.com")) {
      BASE_URL = `https://www.samirxpikachu.run.place/igdl?url=${encodeURIComponent(url)}`;
    } else {
      return api.sendMessage("Unsupported source.", event.threadID, event.messageID);
    }

    api.sendMessage("Processing your request... Please wait.", event.threadID, event.messageID);

    try {
      const res = await axios.get(BASE_URL);
      let contentUrl;

      if (url.includes("facebook.com")) {
        contentUrl = res.data.links["Download High Quality"];
      } else if (url.includes("twitter.com")) {
        contentUrl = res.data.HD;
      } else if (url.includes("tiktok.com")) {
        contentUrl = res.data.hdplay;
      } else if (url.includes("instagram.com")) {
        const instagramResponse = res.data;
        if (Array.isArray(instagramResponse.url) && instagramResponse.url.length > 0) {
          const mp4UrlObject = instagramResponse.url.find(obj => obj.type === 'mp4');
          if (mp4UrlObject) {
            contentUrl = mp4UrlObject.url;
          }
        }
      } else if (url.includes("spotify.com")) {
        const metadata = res.data.metadata;
        const audioUrl = res.data.link;
        const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        const filePath = path.join(__dirname, 'tmp', 'spotify.mp3');
        fs.writeFileSync(filePath, Buffer.from(audioResponse.data));
        
        return api.sendMessage({
          body: `• Title: ${metadata.title}\n• Album: ${metadata.album}\n• Artist: ${metadata.artists}\n• Released: ${metadata.releaseDate}`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
      } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const stream = await global.utils.getStreamFromURL(`https://www.samirxpikachu.run.place/ytdl?url=${url}`);
        return api.sendMessage({ attachment: stream }, event.threadID, event.messageID);
      }

      if (contentUrl) {
        const videoResponse = await axios.get(contentUrl, { responseType: "stream" });
        const filePath = path.join(__dirname, "tmp", `${Date.now()}.mp4`);
        const writer = fs.createWriteStream(filePath);
        videoResponse.data.pipe(writer);
        writer.on("finish", () => {
          api.sendMessage({
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
        });
      } else {
        api.sendMessage("Sorry, the content could not be downloaded.", event.threadID, event.messageID);
      }
    } catch (e) {
      console.error(e);
      api.sendMessage("Sorry, an error occurred while processing your request.", event.threadID, event.messageID);
    }
  }
};
