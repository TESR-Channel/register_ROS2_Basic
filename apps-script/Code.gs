/**
 * TESR Academy - ROS 2 Basic Course Registration
 * Google Apps Script Web App
 *
 * ** สำเนาของโค้ดที่ Deploy อยู่จริง **
 * Apps Script project: register_ROS2_Basic (ผูกกับ Sheet "แบบฟอร์มลงทะเบียนเรียน ROS 2 Basic ... (Responses)")
 * https://script.google.com/home/projects/1cBjFLPSy_c6-sVi8IJMnYb48K2YhewBdXKxmauKUSIciKYykSO5FCnHG/edit
 * แก้ที่นี่แล้วต้องไปวางใน Apps Script + Deploy ใหม่ด้วย (ดูข้อ 5)
 *
 * วิธีใช้:
 * 1. สร้าง Google Sheet ใหม่ ตั้งชื่อ row 1 (header) ดังนี้:
 *    Timestamp | ชื่อ-นามสกุล (TH) | ชื่อ-นามสกุล (EN) | เบอร์โทร | Email |
 *    ที่อยู่ออกใบเสร็จ | ความคาดหวัง | แนะนำตัว (Networking) | ลิงก์หลักฐานการจ่าย
 *
 * 2. เปิด Extensions > Apps Script แล้ววางโค้ดนี้ทั้งหมด (แทนที่ของเดิม)
 *
 * 3. แก้ตัวแปร FOLDER_ID ด้านล่าง ให้เป็น Folder ID ของ Google Drive
 *    ที่ต้องการเก็บไฟล์หลักฐานการโอนเงิน (สร้างโฟลเดอร์ใหม่ใน Drive แล้วคัดลอก ID จาก URL)
 *
 * 4. กด Deploy > New deployment > Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    คัดลอก URL ที่ได้ (ลงท้ายด้วย /exec) ไปวางใน index.html ตัวแปร SCRIPT_URL
 *
 * 5. ทุกครั้งที่แก้โค้ดนี้ ต้อง Deploy ใหม่ (Manage deployments > แก้ไข > เวอร์ชันใหม่)
 *    URL จะเปลี่ยนเฉพาะตอนสร้าง deployment ใหม่เท่านั้น ถ้าใช้ "Manage deployments > Edit" URL เดิมจะไม่เปลี่ยน
 */

const FOLDER_ID = "1YVOvqrIaka3qb68EjiCKCBq2lQRvCf2g"; // โฟลเดอร์ "รวมหลักฐานการโอนเงิน" (TN00015 ROS 2 basic for mobile robot)

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    let fileUrl = "";

    // ถ้ามีไฟล์แนบ (หลักฐานการโอนเงิน) ให้บันทึกลง Drive
    if (data.fileBase64 && data.fileName) {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const decoded = Utilities.base64Decode(data.fileBase64);
      // ตั้งชื่อไฟล์: YYYY-MM-DD_HHmm_ชื่อผู้สมัคร_ชื่อไฟล์เดิม  (เรียงตามเวลา + หาง่าย)
      const stamp = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd_HHmm");
      const who = String(data.name_th || data.name_en || "unknown").trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_");
      const safeName = stamp + "_" + who + "_" + data.fileName;
      const blob = Utilities.newBlob(decoded, data.fileMimeType || "application/octet-stream", safeName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
    }

    sheet.appendRow([
      new Date(),
      data.name_th || "",
      data.name_en || "",
      data.phone || "",
      data.email || "",
      fileUrl || "",
      data.receipt_address || "",
      data.expectation || "",
      data.networking_intro || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
