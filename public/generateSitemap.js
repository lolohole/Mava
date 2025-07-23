const { SitemapStream, streamToPromise } = require('sitemap');
const fs = require('fs');
const path = require('path');

// إعداد تدفق البيانات للسيمات
const smStream = new SitemapStream({ hostname: 'https://www.yoursite.com' });

// بناء ملف XML باستخدام تدفق البيانات
const writeStream = fs.createWriteStream(path.join(__dirname, 'public', 'sitemap.xml'));

// قائمة الصفحات التي تريد إضافتها في الـ Sitemap
const links = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/about', changefreq: 'weekly', priority: 0.8 },
  { url: '/contact', changefreq: 'monthly', priority: 0.7 },
  // أضف الصفحات الأخرى هنا
];

// أضف الصفحات إلى الـ Sitemap
links.forEach(link => smStream.write(link));

// غلق تدفق البيانات
smStream.end();

// حفظ الـ Sitemap إلى ملف
streamToPromise(smStream).then(() => {
  console.log('Sitemap generated successfully!');
});

smStream.pipe(writeStream);
