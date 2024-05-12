import express, { json } from "express";
import db from "../../utils/mysql2-connect.js";
import dayjs from "dayjs";
import hmacSHA256 from "crypto-js/hmac-sha256.js"; //linepay加密
import Base64 from "crypto-js/enc-base64.js"; //linepay加密
import axios from "axios";
import { v4 } from "uuid";

const router = express.Router();

const {
  LINEPAY_CHANNEL_ID,
  LINEPAY_CHANNEL_SECRET_KEY,
  LINEPAY_VERSION,
  LINEPAY_SITE,
  LINEPAY_RETURN_HOST,
  LINEPAY_RETURN_CONFIRM_URL,
  LINEPAY_RETURN_CANCEL_URL,
  LINEPAY_RETURN_HOME,
} = process.env;

function newSignature(uri, data) {
  //訂單號
  const nonce = v4();
  //LINEPAY要求的格式
  const mykey = `${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(
    data
  )}${nonce}`;
  const newkey = hmacSHA256(mykey, `${LINEPAY_CHANNEL_SECRET_KEY}`);
  const signature = Base64.stringify(newkey);
  // 需求的headers
  const headers = {
    "X-LINE-ChannelId": LINEPAY_CHANNEL_ID,
    "Content-Type": "application/json",
    "X-LINE-Authorization-Nonce": nonce,
    "X-LINE-Authorization": signature,
  };
  return headers;
}

// 讀取所有訂單資訊(此會員)
router.post("/", async (req, res) => {
  try {
    /* 新增訂單 */
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

    /* linepay */

    const userid = req.body.order.user;
    const discount = req.body.order.coupondiscount; //優惠卷折扣金額
    // const fee = req.body.order.fee;
    // const subtotal = req.body.order.subtotal; //物品小計
    const cartitem = req.body.order.item;
    // const total = req.body.order.total;

    // linepay格式
    let product = cartitem.map((v) => ({
      name: v.product_name,
      quantity: v.cart_item_quantity,
      price: v.product_price,
    }));

    // 加入運費+優惠卷
    let products = [
      ...product,
      {
        name: "discount",
        quantity: 1,
        price: Number(fee - discount),
      },
    ];

    // 要給linepay的訊息
    const sendOrder = {
      amount: total,
      currency: "TWD",
      orderId: v4(),
      packages: [
        {
          id: userid.toString(),
          amount: subtotal + fee - discount,
          name: "毛毛寵物",
          products: products,
        },
      ],
      redirectUrls: {
        confirmUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CONFIRM_URL}`,
        cancelUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CANCEL_URL}`,
      },
    };

    const uri = "/payments/request";
    const headers = newSignature(uri, sendOrder);
    const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
    const linePayRes = await axios.post(url, sendOrder, { headers });
    console.log(linePayRes);
    if (linePayRes?.data?.returnMessage === "Success.") {
      const html = linePayRes?.data?.info.paymentUrl.web;
      console.log(linePayRes?.data?.info.paymentUrl);
      res.json(html);
    }
  } catch (error) {
    console.log(error);
  }
});

// 完成訂單
router.get("/confirm", async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const transactionId = req.query.transactionId;

    const orderidsql = `SELECT orders_id,final_total FROM orders ORDER BY orders_id DESC LIMIT 1;`;
    const [[{ orders_id, final_total }]] = await db.query(orderidsql);

    const uri = `/payments/${transactionId}/confirm`;
    const resOrder = {
      amount: final_total,
      currency: "TWD",
    };

    const headers = newSignature(uri, resOrder);
    const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
    await axios.post(url, resOrder, { headers });

    // 請款成功, 整理資料表
    // 訂單狀態改為完成
    const ordersql = `UPDATE orders SET orders_state = ?  WHERE orders_id = ?`;
    await db.query(ordersql, ["付款完成", orders_id]);

    res.redirect(`${LINEPAY_RETURN_HOME}/order-completed`);
  } catch (error) {
    res.status(500);
  }
});

// 未完成訂單
router.get("/cancle", async (req, res) => {
  res.redirect(`${LINEPAY_RETURN_HOME}/order-completed/cancle`);
  try {
  } catch (error) {
    res.status(500);
  }
});

export default router;
