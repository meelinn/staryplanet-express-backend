import express from "express";
import db from "./../utils/mysql2-connect.js";
import upload from "./../utils/upload-imgs.js";
import dayjs from "dayjs";
import z from "zod";

const router = express.Router();

// 這是路由

// 取得多筆資料的 API
router.get("/", async (req, res) => {
  // id從token過來
  const member_id = +req.query.member_id || 0;
  if (!member_id) {
    return res.json({ success: false });
  }
  const sql = `SELECT * FROM contact WHERE member_id=${member_id}`;
  const [rows] = await db.query(sql);
  if (!rows.length) {
    return res.json({ success: false });
  }
  const r = rows[0];
  const d = dayjs(r.birthday);
  r.birthday = d.isValid() ? d.format("YYYY-MM-DD") : "";
  res.json({ success: true, data: rows });
});

router.get("/api", async (req, res) => {
  const data = await getListData(req, res);
  res.json(data);
});

router.delete("/:id", async (req, res) => {
  const id = +req.params.id || 0;
  if (id === 0) {
    return res.json({
      success: false,
      info: "無效的參數",
    });
  }

  const sql = `DELETE FROM member WHERE id=?`;
  const [result] = await db.query(sql, [id]);
  res.json(result);
  /*
  {
    "fieldCount": 0,
    "affectedRows": 1,
    "insertId": 0,
    "info": "",
    "serverStatus": 2,
    "warningStatus": 0,
    "changedRows": 0
}
*/
});

// 呈現新增資料的表單
router.get("/add", async (req, res) => {
  res.locals.pageName = "contact_add";
  res.locals.title = "聯絡客服 " + res.locals.title;
  res.render("member/contact");
});
// 處理新增資料的表單
router.post("/add", async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: "",
    code: 0,
  };

  // 新增資料的第二種作法
  const sql2 = "INSERT INTO `contact` SET ?"; // 屬性對應到欄位
  req.body.created_at = new Date(); // 新增屬性 created_at (欄位名稱)
  let result;

  const newContact = {
    title: req.body.title,
    question_class: req.body.question_class,
    question_content: req.body.question_content,
    member_id: req.body.member_id,
  };

  try {
    [result] = await db.query(sql2, [newContact]);
    output.success = !!result.affectedRows;
  } catch (ex) {
    output.error = ex.toString();
  }

  res.json(output);
});

export default router;
