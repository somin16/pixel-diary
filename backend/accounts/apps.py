from django.apps import AppConfig
import os


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Django autoreload로 인해 초기화 코드가 두 번 실행되는 것을 방지
        # 배포 환경(RUN_MAIN 없음)에서는 정상적으로 실행되도록 함
        if os.environ.get('RUN_MAIN') != 'false':
            return

        from notifications.scheduler import start_scheduler
        start_scheduler()
