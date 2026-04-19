from django.urls import path
from .views import ItemPurchaseView

urlpatterns = [
    path("<int:item_id>/purchase/", ItemPurchaseView.as_view(), name="item-purchase"),
]
