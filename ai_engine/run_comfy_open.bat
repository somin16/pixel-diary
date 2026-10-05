@echo off
@chcp 65001 >nul
:: 1. 가상환경 내의 파이썬 실행 파일 경로를 정확히 변수에 담습니다.
set VENV_PYTHON="%~dp0venv_ai\Scripts\python.exe"

:: 2. cloudflared.exe 경로 (배치 파일과 같은 폴더에 있다고 가정)
set CLOUDFLARED="%~dp0cloudflared.exe"

start "ComfyUI" cmd /k "cd /d "%~dp0ComfyUI" && %VENV_PYTHON% main.py --listen 0.0.0.0 --port 8188"

echo ComfyUI 준비될 때까지 대기 중...
:WAIT_LOOP
timeout /t 3 /nobreak >nul
curl -s -o nul -w "%%{http_code}" http://127.0.0.1:8188/system_stats > "%TEMP%\comfy_status.txt"
set /p STATUS=<"%TEMP%\comfy_status.txt"
if not "%STATUS%"=="200" (
    echo 아직 준비 안 됨... 다시 확인
    goto WAIT_LOOP
)

echo ComfyUI 준비 완료!
start "Cloudflare Tunnel" cmd /k "%CLOUDFLARED% tunnel --url http://localhost:8188"

echo.
echo ✅ ComfyUI + Cloudflare Tunnel 실행 완료!
echo 터널 창에서 URL 확인 후 Render 환경변수에 업데이트하세요.
pause