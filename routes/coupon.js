import express from "express";
import db from "./../utils/mysql2-connect.js";
import dayjs from "dayjs";
const router = express.Router();

const getListData = async (req) => {

  let keyword = req.query.keyword || "";
  
  let where = " WHERE 1 ";
  if (keyword) {
    // 避免 SQL injection
    where += ` AND (
    \`coupon_name\` LIKE ${db.escape(`%${keyword}%`)} 
    OR
    \`coupon_discount\` LIKE ${db.escape(`%${keyword}%`)}
    OR
    \`coupon_desc\` LIKE ${db.escape(`%${keyword}%`)}
    )
    `;
  }

  let member_id=req.query.member_id || 0;
  
  if (member_id) {
    where += ` AND (
        \`fk_member_id\` = ${db.escape(`${member_id}`)}
    )`;
}else{
  throw new Error("缺少會員 ID" )}
  

  let redirect = ""; // 作為轉換依據的變數
  const perPage =4; // 每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM have_coupon 
  JOIN coupon ON have_coupon.fk_coupon_id=coupon.coupon_id 
  JOIN members ON have_coupon.fk_member_id=members.memberID ${where}`;
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


    //SQL2
    const sql2 = `SELECT * FROM have_coupon JOIN coupon ON have_coupon.fk_coupon_id=coupon.coupon_id 
    JOIN members ON have_coupon.fk_member_id=members.memberID ${where} ORDER BY have_coupon_id DESC LIMIT ${(page - 1) * perPage}, ${perPage}`;
    
    [rows] = await db.query(sql2);
    if (!rows.length) {
      return res.json({ success: false, message: '此會員沒有優惠券' });
    }
    console.log(sql2);
  }

  
  rows.forEach(item => {
    // 把 RegistrationDate 欄位的值轉換成 YYYY-MM-DD 格式的字串
    // 下面設定 item.RegistrationDate = ... 的時候是為了要覆蓋原本的
    // 如果寫成別的變數， 他就會新增新的物件
    item.coupon_start_date = dayjs(item.coupon_start_date).format('YYYY-MM-DD');
    item.coupon_end_date = dayjs(item.coupon_end_date).format('YYYY-MM-DD');
});

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

router.get("/api",async (req,res)=>{
  try {
    const data = await getListData(req);
    res.json(data);
  } catch (error) {
    res.status(400).json({ success: false, info: error.message });
  } 
 
});

router.get("/add", async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: "",
    info: "測試",
    code: 0,
  };
  res.json(output);
});

router.post("/add", async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: "",
    info: "",
    code: 0,
  };

  const member_id = req.query.member_id; // 使用 req.query 來獲取路由中的查詢參數
  const coupon_code = req.body.coupon_code;

  // 先判斷有沒有該項優惠券
  const c_sql = `SELECT  coupon_id,coupon_code FROM coupon WHERE coupon_code=?`;
  const [c_rows] = await db.query(c_sql, [coupon_code]);
  if (!c_rows.length) {
    output.info = "沒有該筆優惠券";
    return res.json(output);
  }

  // const sql = `SELECT * FROM coupon WHERE fk_member_id=? AND fk_coupon_id=?`;
  // const [rows] = await db.query(sql, [coupon_id, fk_member_id]);

  const coupon_id = c_rows[0].coupon_id; // 取得 coupon_id
  console.log(c_rows[0]);

  // 查詢是否已經擁有該優惠券
  const check_sql = `SELECT * FROM have_coupon WHERE fk_member_id=? AND fk_coupon_id=?`;
  const [check_rows] = await db.query(check_sql, [member_id, coupon_id]);
  if (check_rows.length > 0) {
    output.info = "已擁有該優惠券";
    return res.json(output);
  }

  // 如果不存在，則新增優惠券
  const add_sql = "INSERT INTO have_coupon (fk_member_id, fk_coupon_id , use_state) VALUES (?, ?,1)";
  let result;
  try {
    [result] = await db.query(add_sql, [member_id, coupon_id]);
    output.success = !!result.affectedRows;
    output.info = "已新增優惠券成功";
  } catch (ex) {
    output.error = ex.toString();
  }

  res.json(output);
});






export default router;
