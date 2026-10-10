import os
import requests
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from .firebase_init import send_push_notification
from utils import get_supabase_headers

SUPABASE_URL = os.getenv("SUPABASE_URL")

KST = timezone(timedelta(hours=9))
CHUNK_SIZE = 50  # in.(...) 필터가 URL에 들어가므로 길이 제한을 피하기 위해 나눠서 조회


def _chunks(items, size=CHUNK_SIZE):
    items = list(items)
    for i in range(0, len(items), size):
        yield items[i:i + size]


def get_due_user_ids(enabled_field, time_field, hhmm):
    """
    알림을 켰고(enabled_field=true), 설정한 시각(time_field)이 지금(hhmm)인 유저 ID 목록
    """
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/notification_settings",
        headers=get_supabase_headers(),
        params={
            enabled_field: "eq.true",
            time_field: f"eq.{hhmm}",
            "select": "user_id",
        },
    )
    if response.status_code != 200:
        raise Exception(f"notification_settings 조회 실패: {response.text}")
    return [row["user_id"] for row in response.json()]


def get_tokens_for_users(user_ids):
    """
    유저 ID 목록에 해당하는 FCM 토큰 목록 [{user_id, fcm_token}, ...]
    """
    tokens = []
    for chunk in _chunks(user_ids):
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/fcm_tokens",
            headers=get_supabase_headers(),
            params={
                "user_id": f"in.({','.join(chunk)})",
                "select": "user_id,fcm_token",
            },
        )
        if response.status_code != 200:
            raise Exception(f"fcm_tokens 조회 실패: {response.text}")
        tokens.extend(response.json())
    return tokens


def get_done_user_ids(table, date_column, user_ids, today):
    """
    오늘 이미 일기를 썼거나(diaries) 출석한(attendance_log) 유저 ID 집합
    """
    done = set()
    for chunk in _chunks(user_ids):
        if table == "diaries":
            params = {
                "user_id": f"in.({','.join(chunk)})",
                date_column: f"gte.{today}T00:00:00+09:00",
                "select": "user_id",
            }
        else:
            params = {
                "user_id": f"in.({','.join(chunk)})",
                date_column: f"eq.{today}",
                "select": "user_id",
            }
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=get_supabase_headers(),
            params=params,
        )
        if response.status_code != 200:
            raise Exception(f"{table} 조회 실패: {response.text}")
        done.update(row["user_id"] for row in response.json())
    return done


def _send_reminder(job_name, enabled_field, time_field, done_table, done_column, title, body):
    """
    공통 리마인더 로직
    1) 지금 시각(HH:MM, KST)에 알림을 받기로 설정한 유저 조회
    2) 이미 일기 작성/출석을 마친 유저 제외
    3) 남은 유저의 토큰으로 발송
    """
    now = datetime.now(KST)
    hhmm = now.strftime("%H:%M")
    today = now.date()

    try:
        due_user_ids = get_due_user_ids(enabled_field, time_field, hhmm)
        if not due_user_ids:
            return  # 이 시각에 받을 유저가 없으면 조용히 종료 (매분 실행되므로 로그 생략)

        print(f"=== {job_name} 시작 ({hhmm}, 대상 후보 {len(due_user_ids)}명) ===")

        done_user_ids = get_done_user_ids(done_table, done_column, due_user_ids, today)
        target_user_ids = [uid for uid in due_user_ids if uid not in done_user_ids]

        sent_count = 0
        for row in get_tokens_for_users(target_user_ids):
            if send_push_notification(row["fcm_token"], title=title, body=body):
                sent_count += 1

        print(f"=== {job_name} 완료: {sent_count}건 발송 ===")

    except Exception as error:
        # 한 번 실패해도 다음 분의 실행은 계속되어야 하므로 예외를 삼키고 로그만 남김
        print(f"=== {job_name} ERROR ===\n{error}\n======================")


def send_diary_reminder():
    """설정한 시각에, 오늘 일기를 아직 안 쓴 유저에게 리마인더 발송"""
    _send_reminder(
        job_name="DIARY REMINDER JOB",
        enabled_field="diary_enabled",
        time_field="diary_time",
        done_table="diaries",
        done_column="created_at",
        title="오늘의 일기를 작성해보세요",
        body="하루를 기록하고 감정을 남겨보세요.",
    )


def send_attendance_reminder():
    """설정한 시각에, 오늘 출석을 아직 안 한 유저에게 리마인더 발송"""
    _send_reminder(
        job_name="ATTENDANCE REMINDER JOB",
        enabled_field="attendance_enabled",
        time_field="attendance_time",
        done_table="attendance_log",
        done_column="checked_date",
        title="오늘 출석을 아직 안 하셨어요",
        body="출석하고 오늘의 보상을 받아가세요!",
    )


def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Asia/Seoul")
    # 유저마다 알림 시각이 다르므로 매분 실행해서 '지금 시각'이 설정 시각인 유저만 발송
    # coalesce: 지연되어 밀린 실행은 한 번으로 합침 / max_instances=1: 같은 잡 동시 실행 방지
    # misfire_grace_time: 서버가 잠깐 바빠도 30초 안이면 실행
    job_options = {"coalesce": True, "max_instances": 1, "misfire_grace_time": 30}
    scheduler.add_job(send_diary_reminder, CronTrigger(minute="*"), **job_options)
    scheduler.add_job(send_attendance_reminder, CronTrigger(minute="*"), **job_options)
    scheduler.start()
    print("=== APScheduler 시작됨 (매분 유저별 알림 시각 확인) ===")
