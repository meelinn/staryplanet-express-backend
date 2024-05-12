
-----------------------------------
RESTful API HTTP methods    (CRUD)
    GET             : read data
      / products          取得列表資料
      / products/:pid     取得單項商品的資料
    POST            : create item
      / products          新增商品  
    PUT (PATCH)     : update data
      / products/:pid     修改資料  
    DELETE          : delete data
      / products/:pid     刪除資料
-----------------------------------
==================================================
response 輸出給前端的方式
-----------------------------------
    res.end()       # 預設 Content-Type: text/plain
    res.send()      # 預設依內容決定
    res.render()    # 預設 Content-Type: text/html
    res.json()      # 預設 Content-Type: application/json
    res.redirect()  # 轉向
===================================================
掛在 request 身上的資料
-----------------------------------
    res.query       # 取得 query string 參數
    res.params      # 取得路徑的參數
    req.body        # 表單的資料
    req.file        # 上傳檔案 (單一檔案)
    req.files       # 上傳檔案 (多個檔案)
    req.session     # session 資料    
===================================================
什麼叫同源
-----------------------------------
  協定， 主機名稱， 通訊埠: 這三個東西要一樣

  http://localhost:3001
  http://(這部分叫協定)
  localhost:(稱為主機名稱)
  3001 (通訊埠) 

  其中一項不同， 稱為跨來源 cross-origin
===================================================
子網域
-----------------------------------  
註冊的網域 (租用) abcd.com
    www.abcd.com
    ftp.abcd.com
    mail.abcd.com

cookie 設定給子網域使用時， domain 的位置設定成 . abcd.com
==================================================
購物車的資料存放位置
-----------------------------------
  1. 資料庫 (標準的作法)
  2. session
  3. localStorage (前端)
  4. 前端的記憶體
==================================================