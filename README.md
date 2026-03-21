# pixel-diary

team.CANVAS가 만드는 생성형AI그림일기앱 개발 프로젝트입니다.

## 🛠️ Tech Stack
* **Frontend:** React (Vite)
* **Backend:** Django (Python)
* **Database:** Supabase (PostgreSQL)
* **Collaboration:** GitHub, Discord, Notion


## 1. 레파지토리 클론 & 브랜치 설정

❗각자 터미널에서 실행할 명령어:

```bash
 git clone https://github.com/your-repo/pixel-diary.git
cd pixel-diary
git checkout develop
 ```
## 2. 개발 환경 구성 (백엔드, python/django)

❗ `backend` 폴더로 이동 후 실행하세요.

1) 가상환경 생성
```bash
cd backend
python -m venv venv

# (권한 에러 발생 시: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser 실행)
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

## 3. 의존성 설치(백엔드)
❗가상환경 활성화된 상태에서 하셔야 합니다
    
1) requirements.txt 파일을 사용하여 필요한 패키지 설치 (처음 설치 시 or 추가/버전업 )
```bash
pip install -r requirements.txt
```
2) requirements.txt 내용 바탕으로 가상환경 동기화 (삭제 or 다운그레이드 1개라도 있을 시)
```bash
pip install pip-tools #로컬 환경에서 1번만 하면 됩니다
pip-sync requirements.txt # 삭제된 패키지까지 자동 제거됩니다
```
3) requirements.txt 업데이트 (새로운 패키지 설치 삭제후)
```bash
pip freeze > requirements.txt
```

## 4. django 서버 실행

1) 가상환경이 활성화 된 상태에서
```bash
python manage.py runserver
```
2) 브라우저에서 다음 주소로 접속
```bash
http://127.0.0.1:8000
```

## 5. 프론트엔드 환경 구성

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

## 6. 환경 변수 설정

보안을 위해 API키와 시크릿 키는 깃허브에 올리지 않습니다.

전달받은 .env파일을 각 폴더 (frontend/, backend/)루트에 생성하세요

## 7. 깃 커밋 메시지 템플릿

프로젝트의 일관된 커밋 메시지를 위해 '.gitmessage.txt' 템플릿을 적용합니다.

❗**각자 터미널에서 실행할 명령어:**

```bash
git config --local commit.template .gitmessage.txt
```

## 8. 폴더 구조 ( 확정x )

```
PPIXEL-DIARY/ (Root)
├── .github/                # 깃허브 설정 및 이슈 템플릿
├── backend/                # [Django AI 서버]
│   ├── config/             # Django 프로젝트 설정 (settings.py 등)
│   ├── .env                # 슈파베이스 및 AI API 키
│   ├── manage.py           # Django 실행 엔트리포인트
│   ├── requirements.txt    # 파이썬 패키지 목록
│   └── db.sqlite3          # 로컬 테스트용 DB
│
├── frontend/               # [React + Phaser 게임]
│   ├── public/             # 게임 에셋 (이미지, 사운드 등)
│   ├── src/                # 실제 프론트엔드 코드
│   │   ├── (여기에 Phaser 게임 로직과 UI 컴포넌트 위치)
│   ├── .env                # 프론트엔드 환경 변수
│   ├── index.html          # 앱 메인 페이지
│   ├── package.json        # 리액트/페이저 라이브러리 관리
│   └── vite.config.js      # Vite 빌드 설정
│
├── .gitignore              # 버전 관리 제외 파일 설정
├── .gitmessage.txt         # 커밋 메시지 규칙
└── README.md               # 프로젝트 전체 가이드
```