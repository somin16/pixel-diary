# pixel-diary

team.CANVAS가 만드는 생성형AI그림일기앱 개발 프로젝트입니다.

## 🛠️ Tech Stack
* **Frontend:** React (Vite)
* **Backend:** Django (Python)
* **Database:** Supabase (PostgreSQL)
* **Collaboration:** GitHub, Discord, Notion


## 1. 레파지토리 클론 & 브랜치 설정

❗**각자 터미널에서 실행할 명령어:**

```bash
 git clone https://github.com/your-repo/pixel-diary.git
cd pixel-diary
git checkout develop
 ```
## 2. 개발 환경 구성 (백엔드, python/django)

❗ **주의:** 반드시 `backend` 폴더로 이동 후 실행하세요.

1) 가상환경 생성
```bash
cd backend
python -m venv venv

# Windows (권한 에러 발생 시: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser 실행)
```
2) 가상환경 활성화
```bash
 # windows
.\venv\Scripts\activate
```
3) 가상환경 비활성화
```bash
deactivate
```
--- 
## 3. 의존성 설치(백엔드)
    
1) requirements.txt 파일을 사용하여 필요한 패키지 설치 (항상 최신 상태로 유지하세요)
```bash
pip install -r requirements.txt
```
 2) 새로운 패키지 설치 시 requirements.txt 업데이트 (새로운 패키지 설치 시 반드시 가상환경이 활성화된 상태에서 설치)
```bash
pip freeze > requirements.txt
```
---
## 4. 깃 커밋 메시지 템플릿

프로젝트의 일관된 커밋 메시지를 위해 '.gitmessage.txt' 템플릿을 적용합니다.

❗**각자 터미널에서 실행할 명령어:**

```bash
git config --local commit.template .gitmessage.txt
```

# 5. django 서버 실행

1) 가상환경이 활성화 된 상태에서
```bash
python manage.py runserver
```
2) 브라우저에서 다음 주소로 접속
```bash
http://127.0.0.1:8000
```

# 5. 프론트엔드 환경 구성

❗`frontend` 폴더로 이동 후 실행하세요.

1) 라이브러리 설치
```bash
npm install
# package.json 프론트엔드 라이브러리 및 실행 스크립트 관리용

# "dependencies":실제 서비스 운영에 필요한 재료(react, icon)
# "devDependencies":개발할 때만 옆에서 도와주는 도구(Vite)
```
2) 브라우저에서 다음 주소로 접속
```bash
npm run dev # http://localhost:5173 접속
```

# 6. 환경 변수 설정

보안을 위해 API키와 시크릿 키는 깃허브에 올리지 않습니다.
전달받은 .env파일을 각 폴더 (frontend/, backend/)루트에 생성하세요
