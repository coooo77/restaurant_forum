const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User

const pageLimit = 10

let restController = {
  getRestaurants: (req, res, callback) => {
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
        isFavorited: req.user.FavoritedRestaurants.some(d => d.id === r.id),
        isLiked: req.user.LikedRestaurants.some(d => d.id === r.id)
      }))
      Category.findAll({
        raw: true,
        nest: true
      }).then(categories => {
        callback({
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

  getRestaurant: (req, res, callback) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' },
        { model: Comment, include: [User] }
      ]
    })
      .then(restaurant => restaurant.increment('viewCounts'))
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.some(d => d.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(d => d.id === req.user.id)
        callback({
          restaurant: restaurant.toJSON(),
          isFavorited: isFavorited,
          isLiked: isLiked
        })
      })
      .catch(err => console.error(err))
  },

  getFeeds: (req, res, callback) => {
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
        callback({
          restaurants: restaurants,
          comments: comments
        })
      })
    })
  },

  // getDashboard: (req, res) => {
  //   return Restaurant.findByPk(req.params.id, {
  //     include: Category
  //   }).then(restaurant => {
  //     Comment.findAndCountAll({
  //       where: { RestaurantId: req.params.id }
  //     }).then(data => {
  //       const numberOfComments = JSON.parse(JSON.stringify(data)).count
  //       return res.render('dashboard', {
  //         restaurant: restaurant.toJSON(),
  //         numberOfComments: numberOfComments
  //       })
  //     })
  //   })
  // },

  getDashboard: (req, res, callback) => {
    const restaurant = Restaurant.findByPk(req.params.id, { include: Category })
    const comment = Comment.findAndCountAll({ where: { RestaurantId: req.params.id } })
    Promise.all([restaurant, comment]).then((values) => {
      const [restaurants, comments] = values
      const numberOfComments = JSON.parse(JSON.stringify(comments)).count
      callback({
        restaurant: restaurants.toJSON(),
        numberOfComments: numberOfComments
      })
    })
  },

  //如果有時間可以研究一下，從資料庫取資料的時候就依照加入最愛的數量去排序，並取出前10筆資料
  getTop10Restaurants: (req, res, callback) => {
    return Restaurant.findAll({
      include: [
        { model: User, as: 'FavoritedUsers' }
      ]
    }).then((restaurants) => {
      restaurants = restaurants.map(restaurant => ({
        ...restaurant.dataValues,
        description: restaurant.dataValues.description.substring(0, 50),
        FavoriteCount: restaurant.FavoritedUsers.length,
        isFavorited: restaurant.FavoritedUsers.some(d => d.id === req.user.id)
      }))
      restaurants = restaurants.sort((a, b) => b.FavoriteCount - a.FavoriteCount)
      const top10Restaurants = restaurants.splice(0, 10)
      callback({ top10Restaurants })
    })
  }

}
module.exports = restController