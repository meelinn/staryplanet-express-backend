import express from "express";
import db from "../../utils/mysql2-connect.js";
import dayjs from "dayjs";
const router = express.Router();

const check = async (data, id) => {
  // 檢查是否有元素
  const checksql = `SELECT coupon_id FROM coupon c 
        INNER JOIN have_coupon h on h.fk_coupon_id = c.coupon_id
        WHERE h.fk_member_id = ${id}`;
  const [checkdata] = await db.query(checksql);

  const couponIdsSet = new Set(checkdata.map((item) => item.coupon_id));
  return data.map((item) => ({
    ...item,
    get: couponIdsSet.has(item.coupon_id),
  }));
};

// 會員有領取的優惠卷
router.get("/:userid", async (req, res) => {
  try {
    // 因為後端無法接收到會員編號，這是從前端傳過來的會員編號
    const id = req.params.userid;
    const sql = `SELECT * FROM coupon`;
    const [ndata] = await db.query(sql);
    ndata.forEach((i) => {
      i.coupon_end_date = dayjs(i.coupon_end_date).format("YYYY-MM-DD");
    });

    let data = await check(ndata, id)

    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

// 領取優惠卷
router.post("/:userid", async (req, res) => {
  try {
    const userid = req.params.userid;
    const couponid = req.body.id;
    const sql = `INSERT INTO have_coupon (fk_member_id,fk_coupon_id) VALUES (?,?)`;
    await db.query(sql, [userid, couponid]);

    // 再讀一次傳回去前端
    const csql = `SELECT * FROM coupon`;
    const [ndata] = await db.query(csql);
    ndata.forEach((i) => {
      i.coupon_end_date = dayjs(i.coupon_end_date).format("YYYY-MM-DD");
    });
    let data = await check(ndata,userid);
    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

export default router;
