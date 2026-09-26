const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
app.use(cors());
app.use(express.json());

// روابط حلقاتك المرفوعة على Cloudflare (R2 أو الروابط المباشرة)
const episodeUrls = {
    "1": "https://your-cloudflare-link.com/ep1.mp4",
    "2": "https://pub-be8f46dfd2c64ae98fa1fd88caf49532.r2.dev/episodes/videoplayback%20(1).mp4",
    "3": "https://your-cloudflare-link.com/ep3.mp4",
    "4": "https://your-cloudflare-link.com/ep4.mp4",
    "5": "https://your-cloudflare-link.com/ep5.mp4"
};

app.post('/clip', (req, res) => {
    const { episode, startTime, endTime } = req.body;
    const videoUrl = episodeUrls[episode];

    if (!videoUrl) return res.status(400).send("رقم الحلقة غير موجود");

    // تحويل الأوقات إلى ثواني لحساب مدة القص
    const startSec = timeToSeconds(startTime);
    const endSec = timeToSeconds(endTime);
    const duration = endSec - startSec;

    if (duration > 120) return res.status(400).send("المدة تتجاوز دقيقتين");
    if (duration <= 0) return res.status(400).send("وقت خاطئ");

    res.setHeader('Content-Disposition', `attachment; filename="clip_ep${episode}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    // المعالجة السريعة باستخدام Range Requests
    ffmpeg(videoUrl)
        .seekInput(startTime) // السر هنا: يطلب تحميل المقطع من هذه النقطة فقط
        .duration(duration)   // يحدد طول المقطع المطلوب
        .outputOptions('-c copy') // قص مباشر بدون إعادة ترميز (سريع ولا يستهلك معالج)
        .format('mp4')
        .outputOptions('-movflags frag_keyframe+empty_moov') // لدعم الإرسال كـ Stream
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

// استخدام المنفذ الخاص بـ Cloud Run أو 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
