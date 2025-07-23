const User = require('./models/User'); // استيراد نموذج الـ User

// تعديل بيانات المستخدم
router.put('/edit/:id', async (req, res) => {
  try {
    const { username, email, avatar } = req.body; // جمع البيانات الجديدة من الطلب

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, // معرف المستخدم الذي سيتم تعديله
      { username, email, avatar }, // البيانات الجديدة التي سيتم تحديثها
      { new: true } // ليُرجع الكائن المحدث بعد التعديل
    );

    if (!updatedUser) {
      return res.status(404).send('المستخدم غير موجود');
    }

    res.json(updatedUser); // إعادة المستخدم المعدل كـ JSON
  } catch (err) {
    console.error(err);
    res.status(500).send('حدث خطأ في التعديل');
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).send('المستخدم غير موجود');
    }

    res.send('تم حذف الحساب بنجاح');
  } catch (err) {
    console.error(err);
    res.status(500).send('حدث خطأ في الحذف');
  }
});
