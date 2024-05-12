import express from "express";
import db from "./../utils/mysql2-connect.js";

const router = express.Router();

const getListData = async (req) => {
  // SELECT * FROM `address_book` WHERE `name` LIKE '%詩涵%'
  let keyword = req.query.keyword || "";

  let redirect = ""; // 作為轉換依據的變數
  const perPage = 1; // 每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM orders`;
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
    const sql2 = `SELECT * FROM \`orders\` ORDER BY orders_id   DESC LIMIT ${
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

router.get("/api", async (req, res) => {
  const data = await getListData(req);

  res.json(data);
  // /data變量中的數據轉換為JSON格式，並發送回客戶端作為響應。
});

router.get("/api/:id", async (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM `orders` WHERE `orders_id` = ?";
  const [rows] = await db.query(sql, [id]);

  if (rows.length > 0) {
    res.json({ success: true, data: rows[0] });
  } else {
    res.status(404).json({ success: false, message: "Not Found" });
  }
});

router.post("/add", async (req, res) => {
  // 获取来自前端的所有订单相关字段
  const {
    fk_member_id,
    total_price,
    payment_method,
    shipment_fee,
    fk_coupon_code,
    orders_state,
    final_total,
    fk_creditcard_id,
    orders_quantity,
    note,
    recipient_name,
    recipient_phone,
    recipient_address,
  } = req.body;

  // 转换整数字段，确保它们不是空字符串
  const preparedData = {
    fk_member_id: fk_member_id || null,
    total_price: total_price || null,
    payment_method: payment_method || null,
    shipment_fee: shipment_fee || null,
    fk_coupon_code: fk_coupon_code || null,
    orders_state: orders_state || "pending", // 默認狀態為'pending'
    final_total: final_total || null,
    fk_creditcard_id: fk_creditcard_id || null,
    orders_quantity: orders_quantity || null,
    note: note || null,
    recipient_name: recipient_name || null,
    recipient_phone: recipient_phone || null,
    recipient_address: recipient_address || null,
  };

  // 构建 SQL 插入语句
  const sql = `
    INSERT INTO orders
    (fk_member_id, total_price, payment_method, shipment_fee, fk_coupon_code, orders_state, final_total, fk_creditcard_id, orders_quantity, note, recipient_name, recipient_phone, recipient_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

// 更新订单详情
router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const { name, mobile, address } = req.body; // 示例字段
  const sql =
    "UPDATE `orders` SET `recipient_name` = ?, `recipient_phone` = ?, `recipient_address` = ? WHERE `orders_id` = ?";
  const [result] = await db.query(sql, [name, mobile, address, id]);

  if (result.affectedRows > 0) {
    res.json({ success: true, data: result });
  } else {
    res.status(400).json({ success: false, message: "Update failed" });
  }
});

// 删除订单详情
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM `orders` WHERE `orders_id` = ?";
  const [result] = await db.query(sql, [id]);

  if (result.affectedRows > 0) {
    res.json({ success: true, data: result });
  } else {
    res.status(400).json({ success: false, message: "Delete failed" });
  }
});

export default router;
