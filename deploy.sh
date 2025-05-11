#!/bin/sh

set -e

echo "1. 建置專案 (npm run build)..."
npm run build

echo "2. 複製 dist/index.html 為 dist/404.html..."
cp dist/index.html dist/404.html

echo "3. 部署到 GitHub Pages (npm run deploy)..."
npm run deploy

echo "✅ 部署完成！"
