import os
import requests
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from .firebase_init import send_push_notification
from utils import get_supabase_headers

SUPABASE_URL = os.getenv("SUPABASE_URL")


def send_diary_reminder():
    """
    오늘 일기를 작성하지 않은 유저에게 리마인더 발송
    """
    print("=== DIARY REMINDER JOB 시작 ===")
    headers = get_supabase_headers()
    kst = timezone(timedelta(hours=9))
    today = datetime.now(kst).date()

    # 오늘 이미 일기를 작성한 유저 목록 조회
    diary_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/diaries",
        headers=headers,
        params={
            "created_at": f"gte.{today}T00:00:00+09:00",
            "select": "user_id",
        },
    )
    written_user_ids = {row["user_id"] for row in diary_response.json()}

    # 전체 FCM 토큰 목록 조회
    token_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/fcm_tokens",
        headers=headers,
        params={"select": "user_id,fcm_token"},
    )
    all_tokens = token_response.json()

    # 오늘 일기 안 쓴 유저의 토큰에만 발송
    sent_count = 0
    for row in all_tokens:
        if row["user_id"] not in written_user_ids:
            success = send_push_notification(
                row["fcm_token"],
                title="오늘의 일기를 작성해보세요",
                body="하루를 기록하고 감정을 남겨보세요.",
            )
            if success:
                sent_count += 1

    print(f"=== DIARY REMINDER JOB 완료: {sent_count}건 발송 ===")


def send_attendance_reminder():
    """
    오늘 출석하지 않은 유저에게 리마인더 발송
    """
    print("=== ATTENDANCE REMINDER JOB 시작 ===")
    headers = get_supabase_headers()
    kst = timezone(timedelta(hours=9))
    today = datetime.now(kst).date()

    # 오늘 이미 출석한 유저 목록 조회 (attendance_log 기준)
    attendance_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/attendance_log",
        headers=headers,
        params={
            "checked_date": f"eq.{today}",
            "select": "user_id",
        },
    )
    checked_user_ids = {row["user_id"] for row in attendance_response.json()}

    # 전체 FCM 토큰 목록 조회
    token_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/fcm_tokens",
        headers=headers,
        params={"select": "user_id,fcm_token"},
    )
    all_tokens = token_response.json()

    # 오늘 미출석 유저의 토큰에만 발송
    sent_count = 0
    for row in all_tokens:
        if row["user_id"] not in checked_user_ids:
            success = send_push_notification(
                row["fcm_token"],
                title="오늘 출석을 아직 안 하셨어요",
                body="출석하고 오늘의 보상을 받아가세요!",
            )
            if success:
                sent_count += 1

    print(f"=== ATTENDANCE REMINDER JOB 완료: {sent_count}건 발송 ===")


def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Asia/Seoul")
    # 매일 오후 8시(한국 시간) 실행
    scheduler.add_job(send_diary_reminder, CronTrigger(hour=20, minute=0))
    scheduler.add_job(send_attendance_reminder, CronTrigger(hour=20, minute=0))
    scheduler.start()
    print("=== APScheduler 시작됨 (매일 20:00 KST 리마인더) ===")
