const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

async function searchYoutube(query) {
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=AIzaSyC_CVzKGFtLAqxNdAZ_EyLbL0VRGJ-FaMU&type=video&maxResults=6`);
    return response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high.url
    }));
  } catch (error) {
    throw new Error(`Failed to search YouTube: ${error.message}`);
  }
}

async function downloadAndStreamVideo(videoUrl, message) {
  const apiUrl = `https://samirxpikachuiox.onrender.com/ytb?url=${encodeURIComponent(videoUrl)}`;

  try {
    const response = await axios.get(apiUrl);

    if (response.data && response.data.videos) {
      const videoURL = response.data.videos;
      const videoPath = path.join(__dirname, 'video.mp4');

      const videoResponse = await axios.get(videoURL, { responseType: 'stream' });
      const videoStream = fs.createWriteStream(videoPath);
      videoResponse.data.pipe(videoStream);

      await new Promise((resolve, reject) => {
        videoStream.on('finish', resolve);
        videoStream.on('error', reject);
      });

      await message.reply({
        body: response.data.title || "Here's your video",
        attachment: fs.createReadStream(videoPath)
      });

      fs.unlinkSync(videoPath);
    } else {
      throw new Error('No video data found');
    }
  } catch (error) {
    throw new Error(`Failed to download: ${error.message}`);
  }
}

async function downloadAndStreamAudio(videoUrl, message) {
  const apiUrl = `https://samirxpikachuiox.onrender.com/ytb?url=${encodeURIComponent(videoUrl)}`;

  try {
    const response = await axios.get(apiUrl);

    if (response.data && response.data.audios) {
      const audioURL = response.data.audios;
      const audioPath = path.join(__dirname, 'audio.mp3');

      const audioResponse = await axios.get(audioURL, { responseType: 'stream' });
      const audioStream = fs.createWriteStream(audioPath);
      audioResponse.data.pipe(audioStream);

      await new Promise((resolve, reject) => {
        audioStream.on('finish', resolve);
        audioStream.on('error', reject);
      });

      await message.reply({
        body: response.data.title || "Here's your audio",
        attachment: fs.createReadStream(audioPath)
      });

      fs.unlinkSync(audioPath);
    } else {
      throw new Error('No audio data found');
    }
  } catch (error) {
    throw new Error(`Failed to download: ${error.message}`);
  }
}

async function downloadThumbnail(url, index) {
  try {
    const thumbnailPath = path.join(__dirname, `thumb_${index}.jpg`);
    const response = await axios.get(url, { responseType: 'stream' });
    const writer = fs.createWriteStream(thumbnailPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return thumbnailPath;
  } catch (error) {
    throw new Error(`Failed to download thumbnail: ${error.message}`);
  }
}
//inspired from ntkhangs ytb


module.exports = {
	config: {
		name: "يوتيوب",
		version: "1.16",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: {
			vi: "Tải video, audio hoặc xem thông tin video trên YouTube",
			en: "قم بتنزيل الفيديو أو الأغاني أو عرض معلومات الفيديو على يوتيوب"
		},
		category: "وسائط",
		guide: {
      en: "   {pn} [مقطع|فيديو] [<إسم الفيديو>|<رابط الفيديو>]: إستخدم لتنزيل المقاطع يوتيوب"
				+ "\n   {pn} [أوديو|أغنية] [<إسم الفيديو>|<رابط الفيديو>]: إستخدم من أجل تنزيل الاغاني من يوتيوب"
				+ "\n   {pn} [معلومات|بيانات] [<إسم المقطع>|<رابط المقطع>]: قم بإستخدام لعرض معلومات الفيديو على اليوتيوب"
				+ "\n   Example:"
				+ "\n    {pn} مقطع fifty fifty copied"
				+ "\n    {pn} أغنية fifty fifty copied"
				+ "\n    {pn} معلومات fifty fifty copied"
		}
	},

  en: {
			error: "❌ | حدث خطأ : %1",
			noResult: "⭕ لم يتم إيجاد مفطع بالنسبة للكلمة المعطاة : %1",
			choose: "%1قم بالرد على الرقم بالفيديو الذي تريد تحميله و مشاهدته ",
			video: "المقطع",
			audio: "الأغنية",
			downloading: "⬇️ جاري التحميل %1 \"%2\"",
			downloading2: "⬇️ جاري التحميل %1 \"%2\"\n🔃 السرعة: %3 ميغابايت في الثانية \n⏸️ تم التحميل : %4/%5 ميغابايت (%6%)\n⏳ الوقت المقدر المتبقي : %7 ثانية ",
			noVideo: "⭕ |عذرًا، لم يتم العثور على فيديو بحجم أقل من 83 ميجابايت",
			noAudio: "⭕ |عذرًا، لم يتم العثور على ملف صوتي بحجم أقل من 26 ميجابايت",
			info: "💠 العنوان : %1\n🏪 القناة : %2\n👨‍👩‍👧‍👦 المشتركين : %3\n⏱ مدة الفيديو : %4\n👀 عدد المساهدات : %5\n👍 عدد اللايكات : %6\n🆙 تاريخ الرفع : %7\n🔠 الآيدي : %8\n🔗 الرابط : %9",
			listChapter: "\n📖 قائمة الفصول : %1\n"
		}
	},

  onStart: async function ({ args, message, event, commandName, getLang }) {
		let type;
		switch (args[0]) {
			case "مقطع":
			case "فيديو":
				type = "video";
				break;
			case "غني":
			case "أغنية":
			case "أوديو":
			case "موسيقى":
				type = "audio";
				break;
			case "معلومات":
			case "بيانات":
				type = "info";
				break;
			default:
				return message.SyntaxError();
		}

    const input = args.slice(1).join(" ");
    if (!input) return message.SyntaxError();

    try {
    
      const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
      if (youtubeUrlPattern.test(input)) {
      
        await processYoutubeUrl(input, type, message, getLang);
      } else {
        
        await message.reply(getLang("searching"));
        const searchResults = await searchYoutube(input);
        if (searchResults.length === 0) {
          return message.reply(getLang("noResult", input));
        }

        let msg = "";
        for (let i = 0; i < searchResults.length; i++) {
          msg += `${i + 1}. ${searchResults[i].title} - ${searchResults[i].channel}\n\n`;
        }

      
        const thumbnailPaths = await Promise.all(
          searchResults.map((result, index) => downloadThumbnail(result.thumbnail, index))
        );

        const response = await message.reply({
          body: getLang("choose", msg),
          attachment: thumbnailPaths.map(path => fs.createReadStream(path))
        });

     
        thumbnailPaths.forEach(path => fs.unlinkSync(path));

        global.GoatBot.onReply.set(response.messageID, {
          commandName,
          messageID: response.messageID,
          author: event.senderID,
          type,
          searchResults
        });
      }
    } catch (error) {
      console.error(error);
      return message.reply(getLang("error", error.message));
    }
  },

  onReply: async function ({ message, event, getLang, Reply }) {
    const { type, searchResults, messageID } = Reply;
    const choice = parseInt(event.body);

    if (isNaN(choice) || choice < 1 || choice > searchResults.length) {
      return message.reply(getLang("error", "Invalid choice"));
    }

    await message.unsend(messageID);
    await message.reply(getLang("downloading", type));

    const selectedVideo = searchResults[choice - 1];
    const videoUrl = `https://youtu.be/${selectedVideo.id}`;

    try {
      await processYoutubeUrl(videoUrl, type, message, getLang);
    } catch (error) {
      console.error(error);
      return message.reply(getLang("error", error.message));
    }
  }
};

async function processYoutubeUrl(url, type, message, getLang) {
  try {
    if (type === "video") {
      await downloadAndStreamVideo(url, message);
    } else if (type === "audio") {
      await downloadAndStreamAudio(url, message);
    } else if (type === "info") {
      const apiUrl = `https://www.samirxpikachu.run.place/ytb?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const infoMsg = getLang("info", 
        response.data.title || "N/A",
        response.data.channel || "N/A",
        response.data.duration || "N/A",
        response.data.id || "N/A",
        url
      );
      await message.reply(infoMsg);
    }
  } catch (error) {
    throw new Error(`Failed to process YouTube URL: ${error.message}`);
  }
}
