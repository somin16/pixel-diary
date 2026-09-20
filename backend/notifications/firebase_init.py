import os
import json
import firebase_admin
from firebase_admin import credentials, messaging

# Firebase Admin SDK 초기화 (앱 시작 시 한 번만 실행되어야 함)
if not firebase_admin._apps:
    firebase_credentials_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

    if firebase_credentials_json:
        # 배포 환경 (Render): 환경변수에 JSON 문자열로 저장된 경우
        cred_dict = json.loads(firebase_credentials_json)
        cred = credentials.Certificate(cred_dict)
    else:
        # 로컬 개발 환경: 파일로 직접 읽는 경우
        cred = credentials.Certificate(
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase-service-account.json")
        )

    firebase_admin.initialize_app(cred)


def send_push_notification(fcm_token, title, body):
    """
    단일 기기로 푸시 알림 발송
    - 실패해도 예외를 던지지 않고 성공 여부(bool)만 반환 (다른 유저 발송을 막지 않기 위함)
    """
    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            token=fcm_token,
        )
        messaging.send(message)
        return True
    except Exception as error:
        print(f"=== PUSH SEND ERROR ===\ntoken={fcm_token}\n{error}\n======================")
        return False
