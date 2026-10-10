import os
import threading
import requests
from .firebase_init import send_push_notification
from .scheduler import get_tokens_for_users
from utils import get_supabase_headers

SUPABASE_URL = os.getenv("SUPABASE_URL")


def _send_notice_push(title, body):
    """공지 수신에 동의(notice_enabled=true)한 유저의 기기로 발송"""
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/notification_settings",
            headers=get_supabase_headers(),
            params={"notice_enabled": "eq.true", "select": "user_id"},
        )
        if response.status_code != 200:
            raise Exception(f"notification_settings 조회 실패: {response.text}")

        user_ids = [row["user_id"] for row in response.json()]
        if not user_ids:
            print("=== NOTICE PUSH: 수신 동의 유저 없음 ===")
            return

        sent_count = 0
        for row in get_tokens_for_users(user_ids):
            if send_push_notification(row["fcm_token"], title=title, body=body):
                sent_count += 1

        print(f"=== NOTICE PUSH 완료: {sent_count}건 발송 ===")

    except Exception as error:
        print(f"=== NOTICE PUSH ERROR ===\n{error}\n=========================")


def send_notice_push(title, body):
    """
    공지 등록 API에서 호출하는 진입점.
    발송에 시간이 걸릴 수 있으므로 별도 스레드에서 실행해 API 응답을 막지 않는다.
    (공지 저장은 이미 끝난 뒤에 호출할 것 — 푸시 실패가 공지 등록 실패로 이어지면 안 됨)
    """
    threading.Thread(target=_send_notice_push, args=(title, body), daemon=True).start()
