window.onpopstate = function(event) {
    const state = event.state;
    if (state) {
        if (state.section === 'profile') {
            const username = state.username;
            load_profile(username);
        } else if (state.section === 'all') {
            load_posts('all');
        } else if (state.section === 'following') {
            load_posts('following');
        }
    } else {
        window.location.replace('/');
    }
}

document.addEventListener('DOMContentLoaded', function() {

    // By default, post button is disabled
    const postButton = document.querySelector('post-button');
    if (postButton) {
        postButton.disabled = true;

        // Enable button only if there is text in the input field
        document.querySelector('#input-field').onkeyup = () => {
            if (document.querySelector('#input-field').value.trim().length > 0)
                postButton.disabled = false;
            else
                postButton.disabled = true;
        };
    }

    const user_button = document.getElementById('user');
    if (user_button) {
        user_button.addEventListener('click', () => {
            const profileUsername = user_button.dataset.username;
            load_profile(profileUsername);
            history.pushState({ section: 'profile', username: profileUsername }, '', `${profileUsername}`);
        });
    }

    const allPostsButton = document.querySelector('#allposts');
    if (allPostsButton) {
        allPostsButton.addEventListener('click', () => {
            load_posts('all');
            history.pushState({ section: 'all' }, '', '/');
        });
    }
    
    const followingButton = document.querySelector('#following');
    if (followingButton) {
        followingButton.addEventListener('click', () => {
            load_posts('following');
            history.pushState({ section: 'following' }, '', 'following');
        });
    }

    const followButton = document.querySelector('#follow-button');
    if (followButton) {
        followButton.addEventListener('click', () => {
            const profileId = followButton.dataset.profileId;
            toggleFollow(profileId);
        });
    }

    load_posts('all');

});


function toggleFollow(profileId) {
    const followCount = document.querySelector('#followers-count');
    const followButton = document.querySelector('#follow-button');
    const csrfToken = getCookie('csrftoken');

    fetch(`/follow_unfollow/${profileId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.is_following) {
            followButton.textContent = 'Unfollow';
        } else {
            followButton.textContent = 'Follow';
        }
        followCount.textContent  = data.follower_count;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function getCookie(name) {
    const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return cookieValue ? cookieValue.pop() : '';
}

function toggleLike(postId) {
    const csrfToken = getCookie('csrftoken');
    fetch(`/like_post/${postId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
        },
    })
    .then(response => response.json())
    .then(data => {
        const likeButton = document.querySelector(`button[data-post-id="${postId}"]`);
        const likeCount = document.getElementById(`like-count-${postId}`);

        if (!likeButton || !likeCount) {
            console.error('Like button or like count element not found.');
            return;
        }

        if (data.is_liked) {
            likeButton.innerHTML = '<i class="fas fa-thumbs-up"></i>';
        } else {
            likeButton.innerHTML = '<i class="far fa-thumbs-up"></i>';
        }

        if (data.like_count === 0) {
            likeCount.textContent = `No likes`;
        } else if (data.like_count === 1) {
            likeCount.textContent = `1 Like`;
        } else {
            likeCount.textContent = `${data.like_count} Likes`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


function load_profile(username) {
    load_posts('profile', username);
    document.querySelector('#profile-view').style.display = 'block';
    const followButton = document.querySelector('#follow-button');
    
    // Reset the follow button to its default state
    followButton.style.display = 'block';

    // Make a request to the server to fetch the profile data for the given username
    fetch(`/profile/${username}/`, {
        method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('username').textContent = data.username;
        document.getElementById('followers-count').textContent = data.followers_count;
        document.getElementById('following-count').textContent = data.following_count;

        if (data.is_authenticated) {
            if (!data.is_own_profile) {
                followButton.innerHTML = `
                    <strong>${data.following ? 'Unfollow' : 'Follow'}</strong>
                `;
                followButton.dataset.profileId = data.id;
            } else {
                followButton.style.display = 'none';
            }
        } else {
            followButton.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function handleLikeButtonClick(event) {
    const postId = event.target.dataset.postId;
    toggleLike(postId);
}


function load_posts(postType = 'all', profileUsername = null, page = 1) {
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#posts-view').style.display = 'block';
    const likeButtons = document.querySelectorAll('.like-button');
    
    // Remove existing event listeners and buttons
    likeButtons.forEach(button => {
        button.removeEventListener('click', handleLikeButtonClick);
        button.remove();
    });
    let url = `/get_posts/${postType}/`;

    if (profileUsername !== null) {
        url += `${profileUsername}/`;
    }

    url += `?page=${page}`;

    fetch(url, {
        method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        if (data.is_authenticated) {
            document.querySelector('#new-post-view').style.display = 'block';
        } else {
            document.querySelector('#new-post-view').style.display = 'none';
        }
        const postsContainer = document.getElementById('posts-container');
        const posts = data.posts;
        const hasPrevious = data.has_previous;
        const hasNext = data.has_next;
        document.querySelector('#post-type').innerHTML = `<h5>${postType.charAt(0).toUpperCase() + postType.slice(1)} Posts</h5>`;
        postsContainer.innerHTML = '';

        for (const post of posts) {
            const postElement = document.createElement('div');
            postElement.classList.add('card', 'my-2', 'post');

            const cardBody = document.createElement('div');
            cardBody.classList.add('card-body');

            const cardTitle = document.createElement('h6');
            cardTitle.classList.add('card-title');
            const strong = document.createElement('strong');
            strong.textContent = post.username;
            strong.classList.add('profile-link');
            
            strong.addEventListener('mouseenter', function() {
                strong.style.textDecoration = 'underline';
            });
            
            strong.addEventListener('mouseleave', function() {
                strong.style.textDecoration = 'none';
            });
            
            strong.addEventListener('click', function() {
                load_profile(post.username);
                history.pushState({ section: 'profile', username: post.username }, '', `${post.username}`);
            });
            const small = document.createElement('small');
            const timestampSpan = document.createElement('span');
            timestampSpan.classList.add('float-end', 'text-muted');
            timestampSpan.textContent = post.timestamp;
            small.appendChild(timestampSpan);
            cardTitle.appendChild(strong);
            cardTitle.appendChild(small);

            const cardText = document.createElement('p');
            cardText.classList.add('card-text');
            cardText.textContent = post.content;

            cardBody.appendChild(cardTitle);
            cardBody.appendChild(cardText);

            if (data.is_authenticated) {
                if (post.is_author) {
                    const editLink = document.createElement('a');
                    editLink.href = `/edit_post/${post.id}`;
                    editLink.classList.add('icon-link', 'icon-link-hover', 'text-decoration-none');
                    editLink.style = '--bs-icon-link-transform: translate3d(0, -.125rem, 0);';
                    const editIcon = document.createElement('i');
                    editIcon.classList.add('fas', 'fa-pen', 'bi');
                    editIcon.setAttribute('aria-hidden', 'true');
                    editLink.appendChild(editIcon);
                    editLink.textContent = ' Edit';

                    const floatEndSpan = document.createElement('span');
                    floatEndSpan.classList.add('float-end');
                    floatEndSpan.appendChild(editLink);

                    cardBody.appendChild(floatEndSpan);
                }

                // Create the like button element
                const likeButton = document.createElement('button');
                likeButton.classList.add('like-button', 'btn');
                likeButton.id = `button${post.id}`;
                likeButton.dataset.postId = post.id;

                // Add the event listener to the likeButton element
                likeButton.addEventListener('click', handleLikeButtonClick);

                // Create the like icon element
                const likeIcon = document.createElement('i');
                likeIcon.classList.add('fas', 'fa-thumbs-up', 'bi');
                likeIcon.setAttribute('aria-hidden', 'true');

                // Check if the post is liked and set the appropriate classes
                if (!post.has_liked) {
                    likeIcon.classList.remove('fas');
                    likeIcon.classList.add('far');
                }

                // Append the likeIcon to the likeButton element
                likeButton.appendChild(likeIcon);

                cardBody.appendChild(likeButton);
            }

            const likeCountSpan = document.createElement('span');
            likeCountSpan.id = `like-count-${post.id}`;
            if (post.like_count === 0) {
                likeCountSpan.textContent = 'No likes';
            } else {
                likeCountSpan.textContent = `${post.like_count} ${post.like_count === 1 ? 'Like' : 'Likes'}`;
            }
        
            cardBody.appendChild(likeCountSpan);

            postElement.appendChild(cardBody);
            postsContainer.appendChild(postElement);
        }

        // Handle pagination
        if (hasPrevious || hasNext) {
            const paginationContainer = document.createElement('nav');
            
            if (hasPrevious) {
                const previousButton = document.createElement('button');
                previousButton.classList.add('btn', 'btn-primary', 'my-3', 'me-2', 'rounded-5');
                previousButton.textContent = 'Previous';
                previousButton.addEventListener('click', () => {
                    load_posts(postType, profileUsername, page - 1);
                });
                paginationContainer.appendChild(previousButton);
            }
            
            if (hasNext) {
                const nextButton = document.createElement('button');
                nextButton.classList.add('btn', 'btn-primary', 'my-3', 'rounded-5');
                nextButton.textContent = 'Next';
                nextButton.addEventListener('click', () => {
                    load_posts(postType, profileUsername, page + 1);
                });
                paginationContainer.appendChild(nextButton);
            }
            
            postsContainer.appendChild(paginationContainer);
        }
    })
    .catch(error => {
    console.error('Error:', error);
    });
}