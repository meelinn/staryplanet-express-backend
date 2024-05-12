import http from "node:http";

const server = http.createServer((req, res) => {

    // 設定檔頭
    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
    });

    res.end(`
  <h2>您好123</h2>
  <p>${req.url}</p>
  `);

});

server.listen(3000);
