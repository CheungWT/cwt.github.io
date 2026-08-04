const fs = require('fs');
const path = require('path');

// 1. 建立輸出的 dist 資料夾
if (!fs.existsSync('./dist')) fs.mkdirSync('./dist', { recursive: true });

// 2. 處理模板與 Wikitext 轉 HTML 的邏輯
function parseWikitext(text) {
  return text
    // 處理簡單超連結 [[頁面|顯示名稱]] -> <a href="...">
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '<a href="./$1.html">$2</a>')
    .replace(/\[\[([^\]]+)\]\]/g, '<a href="./$1.html">$1</a>')
    // 處理外部連結 [https://url 顯示名稱]
    .replace(/\[(https?:\/\/[^\s]+)\s+([^\]]+)\]/g, '<a href="$1" target="_blank">$2</a>')
    // 處理自訂模板 {{Note|提示內容}}
    .replace(/\{\{Note\|(.*?)\}\}/gi, '<div class="note-box" style="background:#eef;padding:10px;border-left:4px solid #33f;margin:10px 0;">💡 $1</div>')
    // 處理自訂模板 {{Warning|警告內容}}
    .replace(/\{\{Warning\|(.*?)\}\}/gi, '<div class="warning-box" style="background:#fee;padding:10px;border-left:4px solid #f33;margin:10px 0;">⚠️ $1</div>');
}

// 遞迴掃描目錄尋找 .wikitext 檔案
function getAllWikitextFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    // 排除 node_modules, .git, dist 和 .github 資料夾
    if (file.startsWith('.') || file === 'node_modules' || file === 'dist') return;

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllWikitextFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.wikitext') || file.endsWith('.wiki')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// 3. 讀取並轉換所有 .wikitext 檔案
const allFiles = getAllWikitextFiles('.');

allFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const htmlContent = parseWikitext(content);
  
  // 計算輸出檔名與路徑
  const relativePath = path.relative('.', filePath);
  const targetHtmlPath = relativePath.replace(/\.(wikitext|wiki)$/, '.html');
  const distPath = path.join('./dist', targetHtmlPath);

  // 確保子資料夾存在
  fs.mkdirSync(path.dirname(distPath), { recursive: true });

  fs.writeFileSync(distPath, `<!DOCTYPE html>
<html lang="zh-HK">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${path.basename(filePath, path.extname(filePath))}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; color: #333; }
    a { color: #0969da; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`);
});
