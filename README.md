# Overview of the project
This project is modeled like a typical webshop's `REST API`, using `Node.js`, `Express.js`, and a MySQL relational database. Users can view product listings and read reviews about the products. Registered users can also leave reviews, or if they already reviewed the product edit and delete their own reviews. To create new products, edit or delete them, and for moderating reviews the user has to have administrator privileges. You can authenticate yourself by either attaching a `Bearer token` to your request, or using `cookies` automatically attached to your requests after successfully logging in via the `/login` route. 

#### [Import the Postman configuration for easier API testing!](https://github.com/utrox/generic-webshop-api-sql/tree/main/public/postman-config)
#### [Check out the MongoDb version of this project too!](https://github.com/utrox/generic-webshop-api)

## DATABASE STRUCTURE
![SQL database structure](public/postman-config/SQL-relations.png?raw=true "SQL database structure")

# API endpoints 

## AUTHENTICATION
### Register
`{{domain}}/api/v1/auth/register`

POST request. Providing a valid unused email address, an unused username, and a sufficient password will create a user account in the database. Before logging in however, the user must verify their email address to activate their account by using the token sent to their email inbox after registration.
			
The server validates that both the email address and username are unique and valid. An `activationToken` is automatically assigned to the user and temporarily stored in the database. An email gets sent to the user's email address, containing a link to activate this account. Once the user clicks this link, the `activationToken` is read from the URL, and after verification the account is activated.

```
Request body:

{
    "username": <username>;
    "email": <email address>;
    "password": <password>
}
			
Example Request body:

{
    "username": "bob2", 
    "email": "bob2@email.com", 
    "password": "secret"
}

Example response: 

{
    "msg": "Account successfully created. Please verify your email address before proceeding."
}
```
	
### Login
`{{domain}}/api/v1/auth/login`

POST request. Sends back the token as a cookie. The user is logged in until they either log out, or until the JWT token expires. (24h)
			
After providing a username and password, the server searches for the username in the database. After finding the account linked to that username, the server compares the given password, and the stored hashed password. If an account with the given username doesn't exist, or the password verification fails, or the account has not been activated, the user cannot log in. If they successfully log in, a cookie gets attached to the response, that contains a JWT token, containing the user's ID and role.
			
```

Request body:

{
    "email": <email address>
    "password": <password>
}

Example Request body:

{
    "email": "bob2@email.com", 
    "password": "secret"
}

Example response: 

{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVzZXJJRCI6MjksInJvbGUiOiJhZG1pbiIsInVzZXJuYW1lIjoiYm9iZWsifSwiaWF0IjoxNjQ2NDMxMDAxLCJleHAiOjE2NDY1MTc0MDF9.8sTeUX2ZU0Oka2qWziVEiUL708z7ZFOBnbvbkSPEM08",
    "msg": "Login successful."
}
		
```

### Logout
`{{domain}}/api/v1/auth/logout`

POST request. Deletes the cookie if it exists, thus removing the authentication token, and logging the user out.
The server sends back a cookie attached to the response overwriting the one containing the JWT needed for logging in, and expires almost immediately.

```

Example response:

{
    msg: "Logged out successfully."
}
```

### Requesting Recovery Link
`{{domain}}/api/v1/auth/request-recovery`

POST request. If the user provides a valid email address, assigned to a user in the database, a verification email gets sent to their email address to change their password.

The server generates a random recovery token that is hashed and stored in the database until it expires. This is the token that is sent to the user's email address. Normally this token would be a part of a link, that redirects the user to a form to change their password on the front-end. This project has no front-end however, so only the token is present in the email.

```
Request body:

{
    "email": <email address>
}

Example Request body:

{
    "email": "bob2@email.com"
}
Example response:

{
    "msg": "Recovery email sent. It expires in 10 minutes."
}
```

### Changing Password After Recovery
`{{domain}}/api/v1/auth/recovery`

POST request. After requesting a recovery token, check your inbox for the email containing it. Of course normally in the email would be a link that points to the front-end of the website, where you can fill out a form to change your password. Because this is a purely back-end project, you'll have to attach that token to your request manually.

After verifying the JWT token, the server gets the user by that ID from the database, and compares the provided and hashed recovery tokens. If the recovery token is valid, and the new password matches the requirements, the user's new password is hashed and stored in the database.

```
Request body:

{

    "newPassword": <new password>,
    "confirmNewPassword": <confirm password>
     "recoveryJWT": <recovery token>

}

Example Request body:

{
 "newPassword": "secretpassword", 
 "confirmNewPassword": "secretpassword",
 "recoveryJWT": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokentokentoken.KIFc77NsouX61fq38b60toOa15s7-d_s2CdB4xq5FSc"
}

Example response:

{
    msg: "Password changed successfully." 
}
```

## PRODUCTS:

### Create New Product
`{{domain}}/api/v1/products`

POST request. Requires admin privileges. Creates the product with the provided parameters, provided it passes validation. When uploading images, after renaming and writing them to the `/uploads` folder, the server stores the uploaded images' names in the database along with the other details of the product. 

[Read more about image handling.](#handling-images) 

```
Request body:

{
    "title": <title, (max 100 char.)>
    "description": <description (max 500 char.)>
    "price": <price>
    "category": <category (enum: "kitchen", "dining room", "bedroom", "living room", "bathroom", "other")>
    "manufacturer": <manufacturer name (optional, default: "Unknown")>
    "images": <up to 5 image files per request (optional, default: null)>
}

Example request:

{
    "title": "King-size wooden antic bed"
    "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ut dictum massa, eget ullamcorper mi. Phasellus vitae semper nulla. Nullam luctus sapien maximus, eleifend nisi ut, rhoncus neque. "
    "price": 350
    "category": "bedroom"
    "images": <selected files>
}

Example response: 

{
    "msg": "Product created successfully with ID 55.",
    "imageHandling": {
        "imageUploadResults": {
            "failed": [
                {
                    "image": "pexels-andrea-piacquadio-3783574.jpg",
                    "errorCause": "File over limit. (File: 1292421, limit: 1000000 bytes)"
                },
                {
                    "image": "webshop-api SQL.postman_collection.json",
                    "errorCause": "Please only upload image files."
                }
            ],
            "success": [
                {
                    "newName": "55_4WlaOq5KhsWr_jOnEnzyt.jpg",
                    "originalName": "oldman3.png"
                },
                {
                    "newName": "55_eUmJks1sOlMKL6R4WvsqC.jpg",
                    "originalName": "oldman4.png"
                }
            ]
        }
    }
}
```

### Read All/Queried Products
`{{domain}}/products/<optional queries>`

GET request. Doesn't require any privileges. Lists the products that match the provided queries. When accessing this route, the user is able to provide queries in the URL. This makes it possible for them to filter by price, category and manufacturer, search for in the title, and order by any of these properties. 

Example response: 

`{{domain}}/products/?search={str}&price={num}-{num}&category={str}&manufacturer={str}&order_by={field}`

```    

{
    "noProducts": 15,
    "products": [
        {
            "product_id": 45,
            "title": "King-size wooden antic bed",
            "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ut dictum massa, eget ullamcorper mi",
            "price": 1350,
            "manufacturer": "Unknown",
            "category": "bedroom",
            "images": [
                "55_4WlaOq5KhsWr_jOnEnzyt.jpg",
                "55_eUmJks1sOlMKL6R4WvsqC.jpg"
            ],
            "noReviews": 13,
            "avgRating": 4.43
        },
	{
            "product_id": 57,
            "title": "Ikea bed",
            "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ut dictum massa, eget ullamcorper mi",
            "price": 450,
            "manufacturer": "Ikea",
            "category": "bedroom",
            "images": [
                "57_LUWxNhkhoBegbLbURzecB.jpg",
                "57_qbLG0zkgm2bdcBxkyG15J.jpg",
		"57_gbLR0zZgY2GhrBYkYG95S.jpg"
            ],
            "noReviews": 57,
            "avgRating": 3.93
        },
	[...]
    ]
}

```

### Read Single Product
`{{domain}}/products/<productID>`

GET request. Doesn't require any privileges. Returns the product by this ID, provided it exists in the database. 

Example request:

`{{domain}}/products/62082d63uuddlrlrbaa500dd527`
```

Example response: 

{
    "product": [
        {
            "product_id": 44,
            "title": "kika bed very nice very",
            "description": "very nice bed. very good aaaaaaaaa",
            "price": 500,
            "manufacturer": "kika",
            "category": "other",
            "images": null,
            "noReviews": 15,
            "avgRating": "5.00"
        }
    ],
    "reviews": [
        {
            "review_title": "Bad product.",
            "text": "Very bad product",
            "rating": "2",
            "poster": "bob"
        },
        {
            "review_title": "Love it",
            "text": "Very nice product.",
            "rating": "5",
            "poster": "bobek"
        }, 
	[...]
    ]
}

```


### Update Product
`{{domain}}products/<productID>`

PATCH request. Requires admin privileges. Gets the `productID` from the URL and the new values from the body of the request. If a `Product` with this ID exists in the database, the server tries to update it with the new values. Because this is a PATCH request rather than a PUT request, you only need to provide fields that you want changed. The server handles validation once more. You can also add and remove images from the product. 

[Read more about image handling.](#handling-images) 


```

Request body:

{
    "title": <new title, (max 100 char. )>
    "description": <new description (max 500 char.)>
    "price": <new price>
    "category": <new category (enum: "kitchen", "dining room", "bedroom", "living room", "bathroom", "other")>
    "manufacturer": <new manufacturer name (optional, default: "Unknown")>
    "images": <up to 5 image files per request to add to product (optional, default: null)>
    "imagesToRemove": <array with names of images>
}

Example request:
{{domain}}products/55

{
    "title": "New Product name"
    "price": 399
    "images": <selected files>
    "imagesToRemove":[
        "62098851d5fe8975770f174d_G5GvfbsFLhBhNEcTT1LqK.jpg",
        "nonexistent.jpg"
        "62098851d5fe8975770f174d_REV-Rv0qevC7Gu9wSs5xR.jpg",
    ]
    "imagesToAdd" : <files>
}

Example response: 

{
    "message": "Product successfully updated with ID 55.",
    "imageHandling": {
        "imageUploadResults": {
            "failed": [
                {
                    "image": "pexels-andrea-piacquadio-3783574.jpg",
                    "errorCause": "File over limit. (File: 1292421, limit: 1000000 bytes)"
                }
            ],
            "success": [
                {
                    "newName": "55_qFCTLYxJj8wnwcLMAvRcQ.jpg",
                    "originalName": "oldman4.png"
                }
            ]
        },
        "imageRemoveResults": {
            "success": [
                "55_4WlaOq5KhsWr_jOnEnzyt.jpg"
            ],
            "failed": [
                "51_sYf1XIwhf51ANdq9wyw0V.jpg",
                "nonexistent.jpg"
            ]
        }
    }
}

```

### Delete Product
`{{domain}}products/55`

DELETE request. Requires admin privileges. Gets the `productID` from the URL.
If the product with this ID exists in the database, it gets removed. Before removing the product, all of the reviews about that product (any review that reference the product's ID in their 'product_id' field) also get deleted. 

```

Example response 

{
    "msg": "Product with ID '55' along with reviews and images about the product were successfully deleted."
}

```

## REVIEWS


### Creating Review
`{{domain}}/api/v1/reviews`

POST route. Requires user to be logged in. 
The user can create a review about a product. For every product, a user can only post one review. 

The server checks if a product with the provided `productID` exists in the database. Then it checks if the user already submitted a review about this particular product, and throws an error if so. The server handles the validation of the provided credentials, and if the given properties don't fail validation, then the Review gets recorded into the database.

```
Request body:

    {
        "product": <productID>,
        "rating" : <number between 1 and 5>,
        "title": <review title (max 100 char.)>,
        "text": <review body (max 500 char.)>
    }
    
Example request:

    {
        "product": "55",
        "rating" : 5,
        "title": "Great product.",
        "text": "Amazing product, lived up to my expectations. "
    }

Example response:  

    {
    "message": "Review about product created successfully with ID 29"
    }
```

### Getting A Single Review
`{{domain}}/api/v1/reviews/<reviewID>`

GET route. Doesn't require any permissions. Gets the reviewID from the URL.
Checks if the review with the specified `reviewID` exists. If so, sends back a response containing this data.

```

Example response: 

{
    "product_id": 45,
    "product_name": "New Product Title",
    "review_title": "Good product.",
    "text": "Very good product!",
    "rating": 5,
    "poster": "bobek"
}

```

### Updating Review
`{{domain}}/api/v1/reviews/<reviewID>`

PATCH route. Requires either admin or original poster privileges. 
Checks if the review with the specified reviewID exists. Gets the new values from the body, and tries to update these fields. Because this is a PATCH request rather than a PUT request, you only need to provide fields that you want changed. 

```
Request body:

    {
        "rating" : <new number between 1 and 5 (optional)>,
        "title": <new review title (max 100 char., optional)>,
        "text": <new review body (max 500 char., optional)>
    }
    

Example request:

{
	"rating": 2,
	"text": "At first I tought this was a good product, but it broke after two weeks. "
}


Example response:

{
    "message": "Review successfully modified with ID 29"
}


```

### Deleting Review
`{{domain}}/api/v1/reviews/<reviewID>`

DELETE route. Requires either admin or original poster privileges. 
Checks if the review with the specified reviewID exists. If so, the server removes it from the database.

```
Example response:

{
    "message": "Review successfully deleted."
}

```



# Further Explanation

## HANDLING IMAGES
### Creating Images
When creating or editing a `Product`, the admin has the option to upload images about the product to the listing. I used the `multer` middleware to be able to access the uploaded files. Once the new `Product`'s been created, the server handles the uploaded images. The server checks if all the files are of image type, and that they are under the given maximum file size limit. The files that fail this verification will be listed in the API response along with the reason why they failed verification. The files that pass the verification get renamed ('*productID*_*nanoID*.jpg'), so that they never overwrite a previously added image. The files that were successfully written to storage are then recorded in the `images` table of the database.

### Removing Images
When updating a `Product`, the admin has the option to send an array of image names to be removed. If an image exists with this name in the database, and is recorded as an image for the currently edited product, field, the image gets removed from both the database and the `/uploads` folder. Also, whenever a `Product` is deleted, it's images automatically get deleted from both storage and the database.



## Checking Authorization
Some routes should only be accessible by a selected group of people. For example creating new reviews should only be possible for registered users. Editing and deleting reviews should only be allowed to admins, and the original poster. Creating, editing and deleting products should be only available for admins. 

### Checking For Logged In User
For routes only available to logged in users/admins the `authMiddleware` custom middleware is used. This middleware checks and verifies the `JWT token` that stores the login information. If it fails to obtain this information (meaning that there is no valid token, or the token has expired) the user gets an unauthorized code and message. Otherwise the token's payload gets stored in `req.user`, where it can be accessed by the controllers or further authorization middlewares.

### Checking for OP/Admin Privileges
When accessing routes that should be only accessed by administrators, or the original poster (for example trying to edit or delete a review), the route is protected by `checkAuthorization`. This middleware checks the `userID` and `role` properties stored in `req.body`. If the user isn't an `admin`, and the `userID` isn't the ID of the original poster, the server sends an unauthorized error response. This is a relativly easy and safe check, because if the `authorization JWT token` was tampered with, the `authMiddleware` middleware would've already caught that, and would've thrown an error.

### Checking for Admin Priviliges
`checkAdminPermission` works similarly to `checkAuthorization` but only checking for the user's role.

## Recovering Account

When making a POST request to the `/request-recovery` route, the user needs to provide a valid email address. If this email address is not registered in the database, the function returns without sending the email. If the email address is in the database though, a random recovery token gets generated, and stored hashed in the database, just like you'd store a password. The user recieves an email containing a recovery token, which is just a JWT string, which contains the (unhashed) token along with the `userID`. Normally, instead of a token, the email would contain a link pointing to the actual front-end, where the user can fill out a form and change their password. Because this is a purely back-end project, you'll have to attach that token to your request manually. After reciving the reques, the server checks if 

- the token is valid, 

- the token hasn't expired,

- the token contains the correct `userID` along with the correct `recoveryToken`

- the provided passwords match

Once all of these are confirmed, the new hashed password gets saved in the database.


### TODO 
- add order functionality 

