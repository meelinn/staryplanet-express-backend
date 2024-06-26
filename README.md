## 毛毛星球-後端介紹

後端負責處理功能邏輯和資料管理，為前端提供必要的資料，我們使用 SQL 語法來執行各種操作，包括獲取、新增、刪除和修改資料，從而實現後端服務對資料庫的有效管理。

## 使用技術

- **後端框架**：
  - [Express.js](https://expressjs.com/) 
  
- **資料庫**：
  - [MySQL](https://www.mongodb.com/)

- **其他工具**：
  - [JWT (JSON Web Tokens)](https://www.npmjs.com/package/jsonwebtoken)
  - [Cors](https://www.npmjs.com/package/cors)
  - [Dotenv](https://www.npmjs.com/package/dotenv)


## 安裝指南

需搭配前端使用 [https://github.com/meelinn/staryplanet-next-frontend](https://github.com/meelinn/staryplanet-next-frontend)

1. clone the project:
```bash
git clone https://github.com/meelinn/staryplanet-express-backend.git
```

2. Navigate to the project directory:
```bash
cd staryplanet-express-backend
```

3. Install the required dependencies:
```bash
npm install
```

4. run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3005](http://localhost:3005) with your browser to see the result.

## API 路由

- **帶我回家**

  - 流浪動物列表
  [http://localhost:3005/pet-info/api](http://localhost:3005/pet-info/api)
  > 此 API 用於會獲取資料庫的流浪動物列表，加入以下 query 來進行搜尋：  
  > 搜尋：`?keyword=狗`  
  > 篩選：`?pet_type=狗&pet_color=黑`  

  - 流浪動物動態路由
  [http://localhost:3005/pet-info/api/[pet_id]](http://localhost:3005/pet-info/api/1)
  > 此動態路由用於獲取特定流浪動物的資訊  
  > 替換 `[pet_id]` 部分為資料庫的流浪動物 ID 來獲取相應的資料  

  - 推薦相似流浪動物
  [http://localhost:3005/pet-info/smiler](http://localhost:3005/pet-info/smiler)
  > 此 API 用於執行相似搜尋，加入以下 query 來進行相似推薦：  
  > `?pet_color=灰&pet_type=貓`  

  - 將流浪動物加入我的最愛
  [http://localhost:3005/pet-info/jwt-pet-like/[pet_id]](http://localhost:3005/pet-info/jwt-pet-like/[pet_id])
  > 此 API 用於將相應的流浪動物加入我的最愛，使用前需要先進行會員登入，以獲取相應的會員ID  
  > 在路由最後加入 `[pet_id]` 以指定要加入我的最愛的流浪動物  
  > 此 API 使用 `add` 和 `delete`方法，第一次進入API會執行新增；若 `[pet_id]` 重複，則會執行刪除動作  

- **我的最愛**

  - 我的最愛列表 - 流浪動物 
  [http://localhost:3005/favorite/pet](http://localhost:3005/favorite/pet)
  > 使用前需要先進行會員登入，此 API 會獲取相應會員的我的最愛列表資料

  - 我的最愛列表 - 商品
  [http://localhost:3005/favorite/product](http://localhost:3005/favorite/product)
  > 使用前需要先進行會員登入，此 API 會獲取相應會員的我的最愛列表資料

- **優惠券**

  -優惠券列表 [http://localhost:3005/coupon/api](http://localhost:3005/coupon/api)
  > 使用前需要先進行會員登入，此 API 會獲取相應會員的優惠券列表資料

  -新增優惠券 [http://localhost:3005/coupon/add](http://localhost:3005/coupon/add)
  > 此 API 使用 `POST` 方法，會員在前端輸入表單內容後，經過驗證通過，才會將相應優惠券加入資料庫

## 資料庫匯入

1. 請至 `data` 資料夾中找到 `team3` SQL 文件。

2. 使用 MySQL 或其他資料庫管理工具，將 SQL 文件導入您的資料庫中執行，建立相應的資料表結構。

3. 請確認 `.env` 文件中設定資料庫連接相關的環境變數，確保資料庫連接設定正確。