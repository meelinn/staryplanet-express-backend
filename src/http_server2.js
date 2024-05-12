import http from "node:http";
import fs from "node:fs/promises";

const server = http.createServer(async (req, res) => {
    try {
        await fs.writeFile('./headers.txt', JSON.stringify(req.headers, null, 4));
    } catch (ex) {
        return res.end('寫入檔案時發生錯誤: ' + ex.toString);
    }

    res.end('OK');
});

server.listen(3000);
