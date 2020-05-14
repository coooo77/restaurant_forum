const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User
const restService = require('../services/restService')
const pageLimit = 10

let restController = {
  getRestaurants: (req, res) => {
    restService.getRestaurants(req, res, (data) => {
      return res.render('restaurants', data)
    })
  },

  getRestaurant: (req, res) => {
    restService.getRestaurant(req, res, (data) => {
      return res.render('restaurant', data)
    })
  },

  getFeeds: (req, res) => {
    restService.getFeeds(req, res, (data) => {
      return res.render('feeds', data)
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

  getDashboard: (req, res) => {
    restService.getDashboard(req, res, (data) => {
      return res.render('dashboard', data)
    })
  },

  //如果有時間可以研究一下，從資料庫取資料的時候就依照加入最愛的數量去排序，並取出前10筆資料
  getTop10Restaurants: (req, res) => {
    restService.getTop10Restaurants(req, res, (data) => {
      return res.render('top10Restaurants', data)
    })
  }

}
module.exports = restController