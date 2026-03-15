# pixel-diary

team.CANVAS가 만드는 생성형AI그림일기앱 개발 프로젝트입니다.

## 🛠️ Tech Stack
* **Frontend:** React (Vite)
* **Backend:** Django (Python)
* **Database:** Supabase (PostgreSQL)
* **Collaboration:** GitHub, Discord, Notion

---

## 1. 레파지토리 클론 & 브랜치 설정

    ❗**각자 터미널에서 실행할 명령어:**

    ```bash
    git clone [https://github.com/your-repo/pixel-diary.git](https://github.com/your-repo/pixel-diary.git)
    cd pixel-diary
    git checkout develop
    ```
## 2. 개발 환경 구성 (백엔드, python/django)

    1) 가상환경 생성
    ```bash
    # 프로젝트 루트 디렉토리에서
    python -m venv venv
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
    
    1) requirements.txt 파일을 사용하여 필요한 패키지 설치
    ```bash
    pip install -r requirements.txt
    ```
    2) 새로운 패키지 설치 시 requirements.txt 업데이트
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

