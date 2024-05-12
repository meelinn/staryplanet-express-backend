import express from "express";
import db from "../../utils/mysql2-connect.js";

const router = express.Router();

// 讀取購物車的所有資料 (此會員編號)
// get方法只能使用 param/query 方法傳遞資料
router.get("/:userid", async (req, res) => {
  try {
    console.log('?');
    // 因為後端無法接收到會員編號，這是從前端傳過來的會員編號
    const id = req.params.userid;

    const sql = `SELECT *,SUBSTRING_INDEX(p.product_picture,',',1) as product_img FROM shopping_cart c 
  INNER JOIN products p on p.products_id = c.fk_product_id
  WHERE c.fk_member_id = ${id}`;
    const [data] = await db.query(sql);
    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

// post方法可以使用param/body方式接取資料
router.post("/", async (req, res) => {
  try {
    // 從前端接收到的data用req.body接
    // 這個會員的編號
    const userid = req.body.data.userid;
    // 這個商品的編號
    const itemid = req.body.data.itemid;
    // 增加的數量
    const count = req.body.data.count;

    // 重新從資料庫抓新資料出來比對
    const cartsql = `SELECT *,SUBSTRING_INDEX(p.product_picture,',',1) as product_img FROM shopping_cart c 
    INNER JOIN products p on p.products_id = c.fk_product_id
    WHERE c.fk_member_id = ${userid}`;
    const [cartdata] = await db.query(cartsql);

    // 先檢查目前的購物車內有沒有重複的項目
    const checkCart = cartdata.filter(
      (item) => item.fk_product_id == itemid && item.fk_member_id == userid
    );

    // 假如是 checkCart 裡面有東西
    if (checkCart.length > 0) {
      const cartid = checkCart[0].cart_item_id;
      const sql = `UPDATE shopping_cart SET cart_item_quantity = cart_item_quantity + ${count} WHERE cart_item_id = ${cartid}`;
      await db.query(sql);
    } else {
      const sql = `INSERT INTO shopping_cart (fk_member_id,fk_product_id,cart_item_quantity) VALUES (?,?,?)`;
      await db.query(sql, [userid, itemid, count]);
    }

    res.json({ message: "ok" });
  } catch (error) {
    console.log(error);
  }
});

// patch方法可以使用param/body方式接取資料
router.patch("/:userid", async (req, res) => {
  try {
    const userid = Number(req.params.userid);
    const cartid = req.body.data.id;
    const count = req.body.data.count;

    let number = 0;
    if (count == "sub") {
      number = -1;
    } else if (count == "add") {
      number = 1;
    }
    const sql = `UPDATE shopping_cart SET cart_item_quantity = cart_item_quantity + ${number}
    WHERE cart_item_id = ${cartid}`;
    await db.query(sql);

    // 為了讀取出來
    const oksql = `SELECT *,SUBSTRING_INDEX(p.product_picture,',',1) as product_img FROM shopping_cart c 
  INNER JOIN products p on p.products_id = c.fk_product_id
  WHERE c.fk_member_id = ${userid}`;
    const [data] = await db.query(oksql);
    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

// delete方法只能使用 param/query 方法傳遞資料
router.delete("/:cartid", async (req, res) => {
  try {
    const cid = req.params.cartid;

    const sql = `DELETE FROM shopping_cart
    WHERE cart_item_id = ${cid}`;
    await db.query(sql);
    res.json({ message: "ok" });
  } catch (error) {
    console.log(error);
  }
});

export default router;
