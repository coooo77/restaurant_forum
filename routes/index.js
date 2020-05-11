const auth = require('../config/auth')
const restController = require('../controllers/restController.js')
const adminController = require('../controllers/adminController.js')
const userController = require('../controllers/userController.js')
const categoryController = require('../controllers/categoryController.js')
const commentController = require('../controllers/commentController.js')

const multer = require('multer')
const upload = multer({ dest: 'temp/' })

module.exports = (app, passport) => {

  app.get('/', auth.authenticated, (req, res) => res.redirect('/restaurants'))
  app.get('/restaurants', auth.authenticated, restController.getRestaurants)
  app.get('/restaurants/top', auth.authenticated, restController.getTop10Restaurants)
  app.get('/restaurants/feeds', auth.authenticated, restController.getFeeds)
  app.get('/restaurants/:id', auth.authenticated, restController.getRestaurant)
  app.get('/restaurants/:id/dashboard', auth.authenticated, restController.getDashboard)

  app.post('/comments', auth.authenticated, commentController.postComment)
  app.delete('/comments/:id', auth.authenticatedAdmin, commentController.deleteComment)

  app.get('/admin', auth.authenticatedAdmin, (req, res) => res.redirect('/admin/restaurants'))
  app.get('/admin/restaurants', auth.authenticatedAdmin, adminController.getRestaurants)
  app.get('/admin/restaurants/create', auth.authenticatedAdmin, adminController.createRestaurant)
  app.post('/admin/restaurants', auth.authenticatedAdmin, upload.single('image'), adminController.postRestaurant)
  app.get('/admin/restaurants/:id', auth.authenticatedAdmin, adminController.getRestaurant)
  app.get('/admin/restaurants/:id/edit', auth.authenticatedAdmin, adminController.editRestaurant)
  app.put('/admin/restaurants/:id', auth.authenticatedAdmin, upload.single('image'), adminController.putRestaurant)
  app.delete('/admin/restaurants/:id', auth.authenticatedAdmin, adminController.deleteRestaurant)
  app.get('/admin/users', auth.authenticatedAdmin, adminController.getUsers)
  app.put('/admin/users/:id', auth.authenticatedAdmin, adminController.putUsers)

  app.get('/signup', userController.signUpPage)
  app.post('/signup', userController.signUp)

  app.get('/signin', userController.signInPage)
  app.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.signIn)
  app.get('/logout', userController.logout)

  app.get('/users/top', auth.authenticated, userController.getTopUser)
  app.get('/users/:id', auth.authenticated, userController.getUser)
  app.get('/users/:id/edit', auth.authenticated, auth.isOwner, userController.editUser)
  app.put('/users/:id', auth.authenticated, upload.single('image'), userController.putUser)

  app.get('/admin/categories', auth.authenticatedAdmin, categoryController.getCategories)
  app.post('/admin/categories', auth.authenticatedAdmin, categoryController.postCategory)
  app.get('/admin/categories/:id', auth.authenticatedAdmin, categoryController.getCategories)
  app.put('/admin/categories/:id', auth.authenticatedAdmin, categoryController.putCategory)
  app.delete('/admin/categories/:id', auth.authenticatedAdmin, categoryController.deleteCategory)

  app.post('/favorite/:restaurantId', auth.authenticated, userController.addFavorite)
  app.delete('/favorite/:restaurantId', auth.authenticated, userController.removeFavorite)

  app.post('/like/:restaurantId', auth.authenticated, userController.addLike)
  app.delete('/like/:restaurantId', auth.authenticated, userController.removeLike)

  app.post('/following/:userId', auth.authenticated, userController.addFollowing)
  app.delete('/following/:userId', auth.authenticated, userController.removeFollowing)
}