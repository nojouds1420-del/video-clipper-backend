# استخدام نسخة خفيفة جداً من Node.js
FROM node:20-alpine

# تثبيت برنامج FFmpeg داخل السيرفر
RUN apk add --no-cache ffmpeg

# تحديد مجلد العمل
WORKDIR /usr/src/app

# نسخ ملفات الـ package.json وتثبيت المكتبات
COPY package*.json ./
RUN npm install --production

# نسخ باقي ملفات الكود
COPY . .

# فتح المنفذ 8080
EXPOSE 8080

# أمر تشغيل السيرفر
CMD [ "node", "server.js" ]