# Social Network Website

### [Video Demo](https://youtu.be/5oMvd2DKT-A)

## Description
This is a Single-Page JavaScript social network website project that allows users to make posts, follow other users, and "like" posts. It is implemented using Python, JavaScript, HTML, CSS, and Django framework.

## Functionality
The SPJS social network website includes the following features:

1. New Post: Signed-in users can write new text-based posts by filling in the text area and submitting the post.
All Posts: The "All Posts" link in the navigation bar takes the user to a page where they can view all posts from all users, with the most recent posts displayed first. Each post includes the username of the poster, the post content, the date and time of the post, and the number of likes.

2. Profile Page: Clicking on a username loads that user's profile page, which displays the number of followers and the number of people the user follows. The profile page also shows all the posts made by that user in reverse chronological order. For other signed-in users, the profile page includes a "Follow" or "Unfollow" button to toggle following the user's posts.

3. Following: The "Following" link in the navigation bar takes the user to a page where they can see all posts made by users they are following. This page behaves similar to the "All Posts" page but with a limited set of posts.

4. Pagination: Posts are displayed in a paginated manner, with 10 posts per page. If there are more than ten posts, a "Next" button appears to navigate to the next page of older posts. If the user is not on the first page, a "Previous" button is available to go back to the previous page of posts.

5. Edit Post: Users can edit their own posts by clicking an "Edit" button or link. The post content is replaced with a textarea where the user can edit the content. The edited post can be saved without reloading the entire page.

6. Like and Unlike: Users can toggle their liking of a post by clicking a button or link. This action is performed asynchronously using JavaScript. The server is notified to update the like count, and the displayed like count on the page is updated without a full page reload.

## How to Use
1. Clone or download the project repository.
2. Set up a Python virtual environment and activate it.
3. Install the required dependencies using pip install -r requirements.txt.
4. Run the Django development server using python manage.py runserver.
5. Access the website in your browser at http://localhost:8000.
