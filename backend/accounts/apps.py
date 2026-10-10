from django.apps import AppConfig
import os
import sys


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # 스케줄러는 '서버 프로세스'에서만 시작 (migrate, shell 같은 관리 명령에서는 시작하지 않음)
        # - gunicorn(배포): 항상 대상 / worker가 여러 개여도 start_scheduler 안의 파일 잠금으로 한 곳에서만 실행됨
        # - runserver(로컬): 자동 재시작 시 부모 프로세스(RUN_MAIN 없음)는 건너뛰고 자식(RUN_MAIN=true)에서만 시작, --noreload면 바로 시작
        is_gunicorn = "gunicorn" in sys.argv[0]
        is_runserver = "runserver" in sys.argv

        if is_runserver:
            if os.environ.get("RUN_MAIN") != "true" and "--noreload" not in sys.argv:
                return
        elif not is_gunicorn:
            return

        from notifications.scheduler import start_scheduler
        start_scheduler()
