import express from "express";
import db from "../../utils/mysql2-connect.js";
import dayjs from "dayjs";
const router = express.Router();

// 讀取所有訂單資訊(此會員)
router.get("/all/:userid", async (req, res) => {
  try {
    const userid = req.params.userid;
    const sql = `SELECT * FROM orders WHERE fk_member_id = ${userid} ORDER BY orders_id DESC;`;
    const [data] = await db.query(sql);

    // 修改日期格式
    data.forEach((i) => {
      i.created_at = dayjs(i.created_at).format("YYYY-MM-DD");
    });
    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

// 讀取單一張訂單詳情資訊(此會員)
router.get("/detail/:userid", async (req, res) => {
  try {
    const user = Number(req.params.userid);
    console.log(user,'123132132132');
    console.log('');

    const orderidsql = `SELECT orders_id
    FROM orders
    WHERE fk_member_id = ?
    ORDER BY orders_id DESC
    LIMIT 1;`;
    const [[{ orders_id }]] = await db.query(orderidsql, [user]);
    console.log("order,", orders_id);
    const sql = `SELECT *,SUBSTRING_INDEX(p.product_picture,',',1) as product_img FROM orders o
    LEFT JOIN orders_detail od on od.fk_orders_id = o.orders_id
    LEFT JOIN products p on p.products_id = od.fk_product_id
    WHERE fk_member_id = ?
    AND o.orders_id = ?
    ORDER BY o.orders_id DESC`;
    const [data] = await db.query(sql, [user, orders_id]);

    // 修改日期格式
    data.forEach((i) => {
      i.created_at = dayjs(i.created_at).format("YYYY-MM-DD");
    });

    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

// 新增訂單
router.post("/", async (req, res) => {
  try {
    //所有資料
    const user = req.body.order.user;
    const subtotal = req.body.order.subtotal;
    const payment_method = req.body.order.payment_method;
    const fee = req.body.order.fee;
    const couponcode = req.body.order.couponcode;
    const total = req.body.order.total;
    const recipient_name = req.body.order.recipient_name;
    const recipient_phone = req.body.order.recipient_phone;
    const recipient_address = req.body.order.recipient_address;
    const state = payment_method == "貨到付款" ? "待付款" : "付款完成";
    const coupondiscount = req.body.order.coupondiscount;

    // 訂單寫入
    const ordersql = `INSERT INTO orders (fk_member_id,total_price,payment_method,shipment_fee,fk_coupon_code,final_total,recipient_name,recipient_phone,recipient_address,orders_state,coupon_discount) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
    await db.query(ordersql, [
      user,
      subtotal,
      payment_method,
      fee,
      couponcode,
      total,
      recipient_name,
      recipient_phone,
      recipient_address,
      state,
      coupondiscount,
    ]);

    // 訂單明細寫入
    // 抓到新增的訂單
    const check = req.body.order.check;
    const allcartitem = req.body.cartItem;

    // 做比對
    const cartItem = allcartitem.filter((item) =>
      check.includes(item.cart_item_id)
    );

    const orderidsql = `SELECT orders_id FROM orders ORDER BY orders_id DESC LIMIT 1;`;
    const [[{ orders_id }]] = await db.query(orderidsql);
    const detailsql = `INSERT INTO orders_detail (fk_orders_id,	fk_product_id,quantity) VALUES (?,?,?)`;
    for (let value of cartItem) {
      const { fk_product_id, cart_item_quantity } = value;
      await db.query(detailsql, [orders_id, fk_product_id, cart_item_quantity]);
    }

    // 清除已選擇的購物車資訊
    for (let value of cartItem) {
      const { cart_item_id } = value;
      const cartsql = `DELETE FROM shopping_cart WHERE cart_item_id = ${cart_item_id}`;
      await db.query(cartsql);
    }

    res.json({ message: "ok" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "gg" });
  }
});

// 讀取優惠卷資訊
router.get("/coupon", async (req, res) => {
  try {
    const sql = `SELECT * FROM coupon`;
    const [data] = await db.query(sql);
    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

// 明細
router.post("/detail/:userid", async (req, res) => {
  try {
    const user = Number(req.params.userid);
    const orderid = req.body.orderid;

    const sql = `SELECT *,SUBSTRING_INDEX(p.product_picture,',',1) as product_img FROM orders o
    LEFT JOIN orders_detail od on od.fk_orders_id = o.orders_id
    LEFT JOIN products p on p.products_id = od.fk_product_id
    WHERE fk_member_id = ?
    AND o.orders_id = ?
    ORDER BY o.orders_id DESC`;
    const [data] = await db.query(sql, [user, orderid]);

    // 修改日期格式
    data.forEach((i) => {
      i.created_at = dayjs(i.created_at).format("YYYY-MM-DD");
    });

    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

export default router;
