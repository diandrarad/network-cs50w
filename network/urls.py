from django.contrib.auth.decorators import login_required
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path('profile/<str:username>/', views.profile_data, name='profile'),
    path('follow_unfollow/<int:user_id>/', views.follow_unfollow, name='follow_unfollow'),
    path('new_post/', views.new_post, name='new_post'),
    path('like_post/<int:post_id>/', views.like_post, name='like_post'),
    path('get_posts/<str:post_type>/', views.get_posts, name='get_posts'),
    path('get_posts/<str:post_type>/<str:profile_username>/', views.get_posts, name='get_posts_with_username'),
    path('edit_post/<int:post_id>/', views.edit_post, name='edit_post'),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register")
]
