import express from "express";
import db from "./../utils/mysql2-connect.js";

const router = express.Router();

const getListData = async (req) => {
  // SELECT * FROM `address_book` WHERE `name` LIKE '%詩涵%'
  let keyword = req.query.keyword || "";

  let redirect = ""; // 作為轉換依據的變數
  const perPage = 8; // 每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM orders_detail`;
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
    const sql2 = `SELECT * FROM orders_detail
    JOIN orders ON orders_detail.fk_orders_id = orders.orders_id DESC LIMIT ${
      (page - 1) * perPage
    }, ${perPage}`;

    [rows] = await db.query(sql2);
  }

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
//
// router.get("/",async(req,res)=>{

// })
// 现有的 GET 请求处理程序，获取分页列表
// /req（請求對象）和res（響應對象）
//req 包含了請求的各種信息，比如URL參數、傳入的數據、HTTP頭部等。
//res 用於構建對客戶端的響應，例如發送數據、設定HTTP狀態碼等。
router.get("/api", async (req, res) => {
  const data = await getListData(req);

  res.json(data);
  // /data變量中的數據轉換為JSON格式，並發送回客戶端作為響應。
});

router.post("/add-orders-detail", async (req, res) => {
  // 获取来自前端的所有订单相关字段
  const {} = req.body;

  const sql = `
  INSERT INTO orders_detail
  (fk_orders_id, fk_product_id, quantity)
  VALUES (?, ?, ?)
`;

  try {
    const [result] = await db.execute(sql, Object.values(preparedData));
    if (result.affectedRows) {
      res.status(201).json({
        success: true,
        message: "Order detail added successfully",
        data: result,
      });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Failed to add order detail" });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error adding order detail",
      error: err.message,
    });
  }
});

export default router;
