from django.urls import path
from .views import ItemPurchaseView

# 상점 및 보관함 관련 URL 패턴
# /api/v1/items/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("<int:item_id>/purchase/", ItemPurchaseView.as_view(), name="item-purchase"),
]
