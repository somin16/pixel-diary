@echo off
@chcp 65001 >nul
:: 1. 가상환경 내의 파이썬 실행 파일 경로를 정확히 변수에 담습니다.
set VENV_PYTHON="%~dp0venv_ai\Scripts\python.exe"

:: 2. cloudflared.exe 경로 (배치 파일과 같은 폴더에 있다고 가정)
set CLOUDFLARED="%~dp0cloudflared.exe"

:: 3. ComfyUI를 별도 창에서 먼저 실행합니다.
start "ComfyUI" cmd /k "cd /d "%~dp0ComfyUI" && %VENV_PYTHON% main.py --listen 0.0.0.0 --port 8188"

:: 4. ComfyUI가 완전히 뜰 때까지 5초 기다립니다.
echo ComfyUI 시작 중... 5초 대기
timeout /t 15 /nobreak

:: 5. Cloudflare 터널을 별도 창에서 실행합니다.
start "Cloudflare Tunnel" cmd /k "%CLOUDFLARED% tunnel --url http://localhost:8188"

echo.
echo ✅ ComfyUI + Cloudflare Tunnel 실행 완료!
echo 터널 창에서 URL 확인 후 Render 환경변수에 업데이트하세요.
pause