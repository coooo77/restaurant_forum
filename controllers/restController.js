const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User

const pageLimit = 10

let restController = {
  getRestaurants: (req, res) => {
    let offset = 0
    let whereQuery = {}
    let categoryId = ''
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery['CategoryId'] = categoryId
    }
    Restaurant.findAndCountAll({
      include: Category,
      where: whereQuery,
      offset: offset,
      limit: pageLimit
    }).then(result => {

      let page = Number(req.query.page) || 1
      let pages = Math.ceil(result.count / pageLimit)
      let totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
      let prev = page - 1 < 1 ? 1 : page - 1
      let next = page + 1 > pages ? pages : page + 1

      const data = result.rows.map(r => ({
        ...r.dataValues,
        description: r.dataValues.description.substring(0, 50),
        categoryName: r.Category.name,
        isFavorited: req.user.FavoritedRestaurants.map(d => d.id).includes(r.id),
        isLiked: req.user.LikedRestaurants.map(d => d.id).includes(r.id)
      }))
      Category.findAll({
        raw: true,
        nest: true
      }).then(categories => {
        return res.render('restaurants', {
          restaurants: JSON.parse(JSON.stringify(data)),
          categories: categories,
          categoryId: categoryId,
          page: page,
          totalPage: totalPage,
          prev: prev,
          next: next
        })
      })
    })
  },

  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' },
        { model: Comment, include: [User] }
      ]
    }).then(restaurant => {
      restaurant.increment('viewCounts')
      const isFavorited = restaurant.FavoritedUsers.map(d => d.id).includes(req.user.id)
      const isLiked = restaurant.LikedUsers.map(d => d.id).includes(req.user.id)
      return res.render('restaurant', {
        restaurant: restaurant.toJSON(),
        isFavorited: isFavorited,
        isLiked: isLiked
      })
    })
  },

  getFeeds: (req, res) => {
    return Restaurant.findAll({
      limit: 10,
      raw: true,
      nest: true,
      order: [['createdAt', 'DESC']],
      include: [Category]
    }).then(restaurants => {
      Comment.findAll({
        limit: 10,
        raw: true,
        nest: true,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant]
      }).then(comments => {
        return res.render('feeds', {
          restaurants: restaurants,
          comments: comments
        })
      })
    })
  },

  getDashboard: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category
    }).then(restaurant => {
      Comment.findAndCountAll({
        where: { RestaurantId: req.params.id }
      }).then(data => {
        const numberOfComments = JSON.parse(JSON.stringify(data)).count
        return res.render('dashboard', {
          restaurant: restaurant.toJSON(),
          numberOfComments: numberOfComments
        })
      })
    })
  },

  getTop10Restaurants: (req, res) => {
    return Restaurant.findAll({
      include: [
        { model: User, as: 'FavoritedUsers' }
      ]
    }).then((restaurants) => {
      restaurants = restaurants.map(restaurant => ({
        ...restaurant.dataValues,
        description: restaurant.dataValues.description.substring(0, 50),
        FavoriteCount: restaurant.FavoritedUsers.length,
        isFavorited: restaurant.FavoritedUsers.map(d => d.id).includes(req.user.id)
      }))
      restaurants = restaurants.sort((a, b) => b.FavoriteCount - a.FavoriteCount)
      const top10Restaurants = restaurants.splice(0, 10)
      return res.render('top10Restaurants', { top10Restaurants })
    })
  }

}
module.exports = restController