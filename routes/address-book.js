import express from "express";
import db from "./../utils/mysql2-connect.js";
import upload from "./../utils/upload-imgs.js";
import dayjs from "dayjs";
import { z } from "zod";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const router = express.Router();

const app = express();

const getListData = async (req) => {
  // SELECT * FROM `members` WHERE `id` LIKE '%5%'

  let keyword = req.query.keyword || "";

  // 日期的格式檢查
  let date_begin = req.query.date_begin || null;
  if (date_begin) {
    // dayjs 物件
    date_begin = dayjs(date_begin, "YYYY-MM-DD", true);

    // 如果是合法的日期格式，就轉換為日期的字串，否則為空值
    date_begin = date_begin.isValid() ? date_begin.format("YYYY-MM-DD") : null;
  }

  let date_end = req.query.date_end || null;
  if (date_end) {
    // dayjs 物件
    date_end = dayjs(date_end, "YYYY-MM-DD", true);

    // 如果是合法的日期格式，就轉換為日期的字串，否則為空值
    date_end = date_end.isValid() ? date_end.format("YYYY-MM-DD") : null;
  }

  let where = "WHERE 1 ";
  if (keyword) {
    // 避免 SQL injection 例如 '; DROP TABLE members;
    where += ` AND (
        \`Username\` LIKE ${db.escape(`%${keyword}%`)} 
        OR
        \`Email\` LIKE ${db.escape(`%${keyword}%`)} 
        )
        `;
  }

  // *** 目前頁面沒有做出來，用網址列測試
  // e.g. http://localhost:3001/address-book?date_begin=2024-01-30&date_end=2024-01-31&page=1
  // 如果用戶有設定篩選的(起始)日期
  if (date_begin) {
    where += ` AND 
            \`RegistrationDate\` >= ${db.escape(date_begin)} `;
  }
  // 如果用戶有設定篩選的(結束)日期
  if (date_end) {
    where += ` AND 
            \`RegistrationDate\` <= '${date_end}' `;
  }

  let redirect = ""; // 作為轉換依據的變數
  const perPage = 5; // 每頁最多幾筆
  const sql = "SELECT COUNT(1) totalRows FROM members";
  let page = +req.query.page || 1;
  if (page < 1) {
    redirect = "?page=1";
    return { success: false, redirect };
  }

  // 多層的展開, totalRows 總筆數
  const [[{ totalRows }]] = await db.query(sql);
  const totalPages = Math.ceil(totalRows / perPage); // 總頁數

  let rows = [];
  if (totalRows > 0) {
    if (page > totalPages) {
      redirect = `?page=${totalPages}`;
      return { success: false, redirect };
    }
    const sql2 = `SELECT * FROM \`members\` ${where} ORDER BY MemberID desc LIMIT ${
      (page - 1) * perPage
    },${perPage}`;
    [rows] = await db.query(sql2);
  }

  rows.forEach((item) => {
    // 把 RegistrationDate 欄位的值轉換成 YYYY-MM-DD 格式的字串
    // 下面設定 item.RegistrationDate = ... 的時候是為了要覆蓋原本的
    // 如果寫成別的變數， 他就會新增新的物件
    item.RegistrationDate = dayjs(item.RegistrationDate).format("YYYY-MM-DD");
  });

  // res.json({ totalRows, perPage, totalPages, rows });

  return {
    success: true,
    totalRows,
    perPage,
    totalPages,
    rows,
    page,
    keyword,
    qs: req.query,
  };
};

router.use((req, res, next) => {
  // const whiteList = ["/", "/api"];
  // let path = req.url.split("?")[0]; // 去掉 query string
  // if (!whiteList.includes(path)) {
  //   // 如果沒有在白名單裡
  //   if (!req.session.admin) {
  //     // 如果不在白名單裡, 必須要有權限
  //     return res.status(403).send("<h1>無權訪問此頁面</h1>");
  //   }
  // }
  next();
});

router.get("/", async (req, res) => {
  res.locals.pageName = "ab_list";
  res.locals.title = "通訊錄列表 - " + res.locals.title;

  const data = await getListData(req);
  if (data.redirect) {
    return res.redirect(data.redirect);
  }
  if (req.session.admin) {
    res.render("address-book/list", data);
  } else {
    res.render("address-book/list-no-admin", data);
  }
});

router.get("/api", async (req, res) => {
  const data = await getListData(req);
  res.json(data);
});

router.delete("/:MemberID", async (req, res) => {
  const MemberID = +req.params.MemberID || 0;
  if (MemberID === 0) {
    return res.json({
      success: false,
      info: "無效的參數",
    });
  }

  // 更新 user_photo 欄位的 SQL 查詢
  const updateSql = `UPDATE members SET user_photo = NULL WHERE MemberID = ?`;

  try {
    // 執行更新 user_photo 欄位的 SQL 查詢
    const [result] = await db.query(updateSql, [MemberID]);

    // 返回結果
    res.json(result);
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({
      success: false,
      info: "刪除照片時出錯",
    });
  }
});

// 呈現新增資料的表單
router.get("/add", async (req, res) => {
  res.locals.pageName = "ab_add";
  res.locals.title = "新增通訊錄 - " + res.locals.title;
  res.render("address-book/add");
});

// 處理新增資料的表單
router.post("/add", async (req, res) => {
  const output = {
    success: false,
    postData: req.query,
    error: "",
    code: 0,
  };

  // TODO: 資料格式檢查

  const formSchema = z.object({
    Username: z.string().min(2, { message: "名子長度請大於 2" }),
    Password: z.string().min(6, { message: "密碼長度請大於 6" }),
    Email: z.string().email({ message: "請填寫正確的信箱" }),
    Phone: z
      .string()
      .regex(/^09\d{2}-?\d{3}-?\d{3}$/, { message: "請寫正確的手機號碼!!" }),
  });

  const parseResult = formSchema.safeParse(req.body);
  if (!parseResult.success) {
    output.issues = parseResult.error.issues;
    return res.json(output);
  }

  // dayjs 物件 ***!! 但好像跟我的資料庫無關?????
  let RegistrationDate = dayjs(req.body.RegistrationDate, "YYYY-MM-DD", true);
  RegistrationDate = RegistrationDate.isValid()
    ? RegistrationDate.format("YYYY-MM-DD")
    : null;
  req.body.RegistrationDate = RegistrationDate; // 置換處理過的值

  /*
    const sql = "INSERT INTO `members` (`Username`, `Email`, `Password`, `Phone`, `RegistrationDate`) VALUES (?, ?, ?, ?, NOW())";
    const [result] = await db.query(sql,[
        req.body.Username,
        req.body.Email,
        req.body.Password,
        req.body.Phone,
    ]);
    */

  const sql2 = "INSERT INTO `members` SET ?";
  /*
    因為使用這個做法他會把所有欄位名稱抓到 req.body 裡，但前台並沒有
    RegistrationDate 可以讓你輸入，他是自動輸入的，所以沒有下面那行他會爆炸
    */

  // 新增屬性 RegistrationDate (欄位名稱)
  req.body.RegistrationDate = new Date();
  let result;
  try {
    const [result] = await db.query(sql2, [req.body]);
    output.success = !!result.affectedRows;
  } catch (ex) {
    output.error = ex.toString();
  }

  res.json(output);
});

// 要處理 multipart/form-data
router.post("/add/multi", upload.none(), async (req, res) => {
  res.json(req.body);
});

router.get("/edit/:MemberID", async (req, res) => {
  const MemberID = +req.params.MemberID || 0;
  if (!MemberID) {
    return res.redirect("/address-book");
  }
  const sql = `SELECT * FROM members WHERE MemberID=${MemberID}`;
  const [rows] = await db.query(sql);
  if (!rows.length) {
    return res.redirect("/address-book");
  }

  //{
  // 這邊有一個與我資料庫無關的，詳見老師檔案
  //}

  res.render("address-book/edit", rows[0]);
});

router.put("/edit/:MemberID", async (req, res) => {
  const output = {
    success: false,
    postData: req.query,
    error: "",
    code: 0,
  };

  const MemberID = req.params.MemberID || 0;

  try {
    let updatedData = { ...req.body };

    // 如果新密码字段存在且不为空，则进行密码哈希处理
    if (updatedData.Password) {
      const hashedPassword = await bcrypt.hash(updatedData.Password, 10);
      updatedData.Password = hashedPassword;
    } else {
      // 如果新密码字段不存在或为空，则从更新数据中删除密码字段
      delete updatedData.Password;
    }

    const sql = "UPDATE `members` SET ? WHERE MemberID=?";

    // 執行 SQL 時最好做錯誤處理
    const [result] = await db.query(sql, [updatedData, MemberID]);

    output.success = !!(result.affectedRows && result.changedRows);
  } catch (ex) {
    output.error = ex.toString();
  }

  res.json(output);
});

router.get("/zod", (req, res) => {
  let v = req.query.v || "";

  const strSchema = z.string().min(4, { message: "規則都不懂??" });

  res.json({
    // 用 parse 如果不符合規則會錯誤
    // result: strSchema.parse("123")
    result: strSchema.safeParse("123"),
  });
});

// 取得單筆資料的 API
router.get("/:MemberID", async (req, res) => {
  const MemberID = +req.params.MemberID || 0;
  if (!MemberID) {
    return res.json({ success: false });
  }
  const sql = `SELECT * FROM members WHERE MemberID=${MemberID}`;
  const [rows] = await db.query(sql);
  if (!rows.length) {
    return res.json({ success: false });
  }
  const r = rows[0];
  res.json({ success: true, data: r });
});

/*忘記密碼 */

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // 檢查郵箱是否存在於資料庫中
  const [user] = await db.query("SELECT * FROM `members` WHERE `Email` = ?", [
    email,
  ]);
  if (!user.length) {
    return res.status(404).json({ message: "User not found" });
  }

  // 生成重設密碼的 token
  const token = bcrypt.hashSync(email + new Date().toISOString(), 10);

  // 更新資料庫中的 token
  await db.query("UPDATE `members` SET `ResetToken` = ? WHERE `Email` = ?", [
    token,
    email,
  ]);

  // 發送包含重設密碼連結的郵件給用戶
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "projectreact0456@gmail.com",
      pass: "wtry rark ggdg ajer",
    },
  });

  

  const mailOptions = {
    from: '"毛毛星球" <projectreact0456@gmail.com>',
    to: email,
    subject: "關於毛毛星球的重設密碼",
    html: `
        <h2 style="color:black;">您在剛剛提出密碼重設要求，請點擊下方連結以進行密碼重設：</h2>

        <a href="http://localhost:3000/resetpass?token=${token}" style="display:block; margin:auto;">
        <h4>點我重設密碼</h4>
        </a>

        <img src="https://png.pngtree.com/png-clipart/20190614/original/pngtree-cartoon-lovely-anime-simple-png-image_3813425.jpg" alt="毛毛星球 Logo" style="display: block; margin: auto; margin-left: 0; margin-top: 50px; width: 130px; border-radius: 50%;"/>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Failed to send reset password email" });
    } else {
      console.log("Email sent: " + info.response);
      return res.status(200).json({ message: "Reset password email sent" });
    }
  });
});

router.get("/reset-password/:token", (req, res) => {
  const token = req.params.token;
  res.render("reset-password", { token });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    // 驗證 token 的有效性
    // 這裡需要從資料庫中檢查 token 是否有效，以確保它是由你的系統生成的
    // 如果 token 有效，則更新用戶的密碼
    // 假設你的資料庫包含名為 'resetToken' 的欄位用於存儲重設密碼的 token
    // 你可以使用類似的 SQL 查詢來檢查 token 的有效性並更新密碼
    const [user] = await db.query(
      "SELECT * FROM `members` WHERE `ResetToken` = ?",
      [token]
    );
    if (user.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // 生成哈希後的新密碼
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 更新用戶的密碼並清除 resetToken
    await db.query(
      "UPDATE `members` SET `Password` = ?, `ResetToken` = NULL WHERE `ResetToken` = ?",
      [hashedPassword, token]
    );

    // 密碼更新成功，返回成功消息
    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});
export default router;