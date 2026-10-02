@echo off
chcp 65001 > nul
title 中学数学科教員ポータル起動
echo ====================================================
echo   中学数学科教員ポータル & 授業工房を起動しています...
echo ====================================================

:: すでにポート3000でサーバーが起動しているか確認
netstat -ano | findstr ":3000" > nul
if %errorlevel% equ 0 (
    echo [OK] ローカルサーバーは既に稼働しています。
) else (
    echo [INFO] ローカルサーバーを起動しています...
    start /b node server.js
    timeout /t 2 /nobreak > nul
)

echo [OK] ブラウザでポータルを開きます: http://localhost:3000/
start http://localhost:3000/

exit
