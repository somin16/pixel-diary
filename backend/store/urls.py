from django.urls import path
from .views import ItemPurchaseView, InventoryView, DecorationItemView, ItemListView

# 상점 및 보관함 관련 URL 패턴
# /api/v1/ 하위 경로는 config/urls.py에서 include로 연결됨
urlpatterns = [
    path("items/<int:item_id>/purchase/", ItemPurchaseView.as_view(), name="item-purchase"),    # 아이템 구매
    path("users/inventory/", InventoryView.as_view(), name="inventory"),                        # 내 보관함 조회
    path("users/deco-item/", DecorationItemView.as_view(), name="decoration-items"),            # 꾸미기 아이템 조회
    path("items/", ItemListView.as_view(), name="item-list"),                                   # 아이템 목록 조회
]
