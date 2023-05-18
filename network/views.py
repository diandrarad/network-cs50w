from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.core import serializers
from django.core.paginator import Paginator
from django.urls import reverse

from .models import User, Post, Follower, Like


def index(request):
    return render(request, "network/index.html")


def new_post(request):
    if request.method == 'POST':
        content = request.POST['content']
        post = Post.objects.create(user=request.user, content=content)
        return render(request, "network/index.html")


def get_posts(request, post_type, profile_username=None):
    is_authenticated = request.user.is_authenticated

    if post_type == 'all':
        posts = Post.objects.all().order_by('-timestamp')
    elif post_type == 'following':
        if not is_authenticated:
            return JsonResponse({'error': 'Authentication required'})
        following_users = request.user.following.values_list('following_id', flat=True)
        posts = Post.objects.filter(user__in=following_users).order_by('-timestamp')
    elif post_type == 'profile':
        profile_user = get_object_or_404(User, username=profile_username)
        posts = Post.objects.filter(user=profile_user).order_by('-timestamp')
    else:
        return JsonResponse({'error': 'Invalid post type'})
    
    post_data = []
    for post in posts:
        post_data.append({
            'id': post.id,
            'username': post.user.username,
            'timestamp': post.timestamp.strftime('%B %d, %Y, %I:%M %p'),
            'content': post.content,
            'like_count': post.likes.count(),
            'has_liked': post.has_liked(request.user) if is_authenticated else False,
            'is_author': request.user == post.user if is_authenticated else False
        })
    
    paginator = Paginator(post_data, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    serialized_posts = list(page_obj.object_list)
    
    return JsonResponse({
        'posts': serialized_posts,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
        'is_authenticated': is_authenticated
    }, safe=False)  



def profile_data(request, username):
    is_authenticated = request.user.is_authenticated
    profile_user = get_object_or_404(User, username=username)
    following = False
    is_own_profile = False

    if request.user.is_authenticated:
        following = Follower.objects.filter(follower=request.user, following=profile_user).exists()
        is_own_profile = request.user == profile_user

    data = {
        'id': profile_user.id,
        'username': profile_user.username,
        'following': following,
        'is_own_profile': is_own_profile,
        'followers_count': profile_user.followers.count(),
        'following_count': profile_user.following.count(),
        'is_authenticated': is_authenticated
    }
    return JsonResponse(data)


def follow_unfollow(request, user_id):
    following_user = get_object_or_404(User, id=user_id)
    
    # Check if the current user is trying to follow themselves
    if request.user == following_user:
        return redirect('profile', id=user_id)
    try:
        # Check if the current user is already following the user
        if Follower.objects.filter(follower=request.user, following=following_user).exists():
            # Unfollow the user
            Follower.objects.filter(follower=request.user, following=following_user).delete()
            is_following = False
        else:
            # Follow the user
            Follower.objects.create(follower=request.user, following=following_user)
            is_following = True
        follower_count = following_user.followers.count()
        return JsonResponse({'follower_count': follower_count, 'is_following': is_following})
    except Exception as e:
        return JsonResponse({'error': str(e)})



def edit_post(request, post_id):
    post = Post.objects.get(pk=post_id)
    if request.user == post.user:
        if request.method == 'POST':
            post.content = request.POST['content']
            post.save()
            return render(request, "network/index.html")
        return render(request, 'network/edit_post.html', {'post': post})
    return render(request, "network/index.html")



def like_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    user = request.user
    try:
        like = Like.objects.filter(post=post, user=user).first()
        if like:
            like.delete()
            is_liked = False
        else:
            Like.objects.create(post=post, user=user)
            is_liked = True
        like_count = Like.objects.filter(post=post).count()
        return JsonResponse({'like_count': like_count, 'is_liked': is_liked})
    except Exception as e:
        return JsonResponse({'error': str(e)})


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
