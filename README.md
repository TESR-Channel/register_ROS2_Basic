# ROS 2 Basic for Mobile Robot — Registration

แบบฟอร์มลงทะเบียนเรียน **ROS 2 Basic for Mobile Robot (สอนสด)** by TESR Academy

🔗 **ลงทะเบียนได้ที่:** https://tesr-channel.github.io/register_ROS2_Basic/

## ข้อมูลคอร์ส
- อบรม 2 วัน: WSL2, ROS 2 basic command & network, Python node, Joystick/Keyboard control, SLAM, Navigation, RPLIDAR C1 + IMU, Node-RED IoT Dashboard
- ฝึกกับหุ่นยนต์ Iron-X
- สถานที่: TESR Playground, 838 ถ.รัตนาธิเบศร์ ต.บางกระสอ อ.เมืองนนทบุรี จ.นนทบุรี 11000
- ติดต่อ: 082-983-7768 (สำรอง 090-465-6519) | LINE: https://www.tesrshop.com/line

## Backend (Google Apps Script)
- โค้ดอยู่ที่ [`apps-script/Code.gs`](apps-script/Code.gs) (สำเนาของที่ Deploy ใน Apps Script project `register_ROS2_Basic`)
- สลิปที่ผู้สมัครแนบ จะถูกบันทึกลงโฟลเดอร์ Drive **"รวมหลักฐานการโอนเงิน"** (TN00015) และตั้งชื่อไฟล์เป็น `YYYY-MM-DD_HHmm_ชื่อผู้สมัคร_ชื่อไฟล์เดิม`
- แก้โค้ดแล้วต้อง Deploy > Manage deployments > Edit > New version (URL `/exec` เดิมไม่เปลี่ยน)

## หนังสือเชิญ (PDF)
- ผู้สมัครติ๊ก "ต้องการหนังสือเชิญ" กรอกตำแหน่งผู้รับ หน่วยงาน ชื่อผู้เข้าอบรม และวันที่อบรม แล้วกดสร้าง PDF ได้เอง (หนังสือเชิญ + รายละเอียดหลักสูตร + กำหนดการ)
- โค้ด: `assets/invite.js`, `assets/invite.css` ข้อมูลคอร์สอยู่ใน `window.TESR_COURSE` ท้าย `index.html` กำหนดการดึงจากตารางในหน้าโดยอัตโนมัติ
- ลายเซ็นและตราบริษัท: `assets/signature.png` (ลายเซ็นคุณอานนท์ จาก Drive โฟลเดอร์ ลายเซ็น) และ `assets/seal.png` (ตรายางโลโก้ TESR หมึกน้ำเงิน สร้างด้วยตัวสร้างตรายางของ pdf_tool) แทนไฟล์ได้ตามต้องการ ถ้าลบไฟล์ หนังสือจะเว้นเส้นสำหรับเซ็น
- ปุ่มติดต่อพนักงานลอยมุมขวาล่าง (`assets/contact.js`) กดแล้วกางเป็น LINE www.tesrshop.com/line, Messenger ThaiEmbedded, โทร 082-983-7768, อีเมล tesrshop@gmail.com แบบเดียวกับ tesrshop.com ใช้โค้ดเดียวกับ tesracademy.com และมีปุ่ม "แชทกับพนักงานทาง LINE" ในกล่องสถานที่เรียน

## ลงทะเบียนหลายท่านในฟอร์มเดียว
- ปุ่ม "+ เพิ่มผู้เข้าอบรม" (สูงสุด 20 ท่าน) ผู้เข้าอบรมท่านที่ 2 เป็นต้นไปกรอกชื่อไทย/อังกฤษ ส่วนเบอร์และอีเมลไม่บังคับ (เว้นว่างจะใช้ของผู้ติดต่อหลัก)
- กล่อง "ยอดที่ต้องชำระ" คำนวณให้อัตโนมัติ (จำนวนท่าน × ราคาโปรโมชั่น / ราคาปกติ)
- ตอนส่ง ระบบส่งเข้า Apps Script เดิมท่านละ 1 ครั้ง จึงได้ 1 แถวต่อ 1 ท่านใน Google Sheet เหมือนเดิม (ไม่ต้องแก้หรือ Deploy Apps Script ใหม่) ทุกแถวมีลิงก์สลิป และช่อง "ที่อยู่ออกใบเสร็จ" ขึ้นต้นด้วย `[ลงทะเบียนกลุ่ม N ท่าน: ชื่อทุกท่าน | ผู้ติดต่อหลัก ... | ยอดโปรโมชั่น ... / ปกติ ...]` ความคาดหวังและแนะนำตัวบันทึกเฉพาะแถวผู้ติดต่อหลัก
- โค้ด: `assets/group.js`
