const { google } = require('googleapis');
const path = require('path');
const { JWT } = require('google-auth-library');

const auth = new JWT({
  keyFile: path.join(__dirname, '../config/google-credentials.json'),
  scopes: ['https://www.googleapis.com/auth/documents'],
});

const docs = google.docs({ version: 'v1', auth });

// ID المستند (ممكن تجده في رابط المستند)
const DOCUMENT_ID = '113870033028502483644

';

// إضافة فقرة نصية جديدة في نهاية المستند
async function appendOrderToDoc(order) {
  // نص الطلب الذي تريد إضافته
  const text = `طلب جديد:
- المنتج: ${order.productName}
- المشتري: ${order.buyerUsername}
- التاريخ: ${new Date(order.createdAt).toLocaleString('ar-EG')}
- الحالة: ${order.status}

--------------------------
`;

  // الحصول على المستند أولاً لجلب موقع النهاية (endIndex)
  const doc = await docs.documents.get({ documentId: DOCUMENT_ID });
  const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex;

  // تنفيذ طلب التعديل على المستند
  await docs.documents.batchUpdate({
    documentId: DOCUMENT_ID,
    requestBody: {
      requests: [
        {
          insertText: {
            location: {
              index: endIndex - 1,
            },
            text: text,
          },
        },
      ],
    },
  });
}

module.exports = appendOrderToDoc;
