@echo off
echo 正在查找监听端口3001的进程...

REM 查找所有监听端口3000的PID
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo 终止 PID %%a ...
    taskkill /PID %%a /F
)

echo 完成。
pause
