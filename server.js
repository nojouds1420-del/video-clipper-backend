const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
app.use(cors());
app.use(express.json());

const episodeUrls = {
    "1": "https://pub-be8f46dfd2c64ae98fa1fd88caf49532.r2.dev/episodes/videoplayback%20(1).mp4",
    "2": "https://pub-be8f46dfd2c64ae98fa1fd88caf49532.r2.dev/episodes/videoplayback%20(1).mp4",
    "3": "https://your-cloudflare-link.com/ep3.mp4",
    "4": "https://your-cloudflare-link.com/ep4.mp4",
    "5": "https://your-cloudflare-link.com/ep5.mp4"
};
// بصمة للتأكد من أن الكود الجديد تم تحميله في السيرفر
console.log("🔥 تم تحميل الكود الجديد بنجاح! رابط الحلقة 2 هو:", episodeUrls["2"]);
app.post('/clip', (req, res) => {
    const { episode, startTime, endTime } = req.body;
    const videoUrl = episodeUrls[episode];

    if (!videoUrl) return res.status(400).send("رقم الحلقة غير موجود");

    const startSec = timeToSeconds(startTime);
    const endSec = timeToSeconds(endTime);
    const duration = endSec - startSec;

    if (duration > 120) return res.status(400).send("المدة تتجاوز دقيقتين");
    if (duration <= 0) return res.status(400).send("وقت خاطئ");

    res.setHeader('Content-Disposition', `attachment; filename="clip_ep${episode}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    ffmpeg(videoUrl)
        .inputOptions([
            '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ])
        .seekInput(startTime)
        .duration(duration)
        .outputOptions('-c copy')
        .format('mp4')
        .outputOptions('-movflags frag_keyframe+empty_moov')
        .on('error', (err) => {
            console.error('FFmpeg Error:', err.message);
            if (!res.headersSent) res.status(500).send('حدث خطأ أثناء القص');
        })
        .pipe(res, { end: true });
});

function timeToSeconds(timeStr) {
    const parts = timeStr.split(':').map(Number);
    return parts.length === 3 
        ? (parts[0] * 3600) + (parts[1] * 60) + parts[2]
        : (parts[0] * 60) + parts[1];
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
