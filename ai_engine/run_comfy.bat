@echo off
:: 1. 가상환경 내의 파이썬 실행 파일 경로를 정확히 변수에 담습니다.
set VENV_PYTHON="%~dp0venv_ai\Scripts\python.exe"

:: 2. ComfyUI 폴더로 이동합니다.
cd ComfyUI

:: 3. 시스템 파이썬이 아닌, 위에서 지정한 '가상환경 파이썬'으로 실행합니다.
%VENV_PYTHON% main.py --port 8188

pause