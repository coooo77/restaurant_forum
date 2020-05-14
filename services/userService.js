// const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Comment = db.Comment
const Restaurant = db.Restaurant
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship
const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

const userService = {
  // 因為瀏覽器的signUpPage、signUp、signInPage、signIn、logout跟API使用不共享，所以userService不需要寫出來了?
  // signUpPage: (req, res) => {
  //   return res.render('signup')
  // },

  // signUp: (req, res) => {
  //   // confirm password
  //   if (req.body.passwordCheck !== req.body.password) {
  //     req.flash('error_messages', '兩次密碼輸入不同！')
  //     return res.redirect('/signup')
  //   } else {
  //     // confirm unique user
  //     User.findOne({ where: { email: req.body.email } }).then(user => {
  //       if (user) {
  //         req.flash('error_messages', '信箱重複！')
  //         return res.redirect('/signup')
  //       } else {
  //         User.create({
  //           name: req.body.name,
  //           email: req.body.email,
  //           password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
  //         }).then(user => {
  //           req.flash('success_messages', '成功註冊帳號！')
  //           return res.redirect('/signin')
  //         })
  //       }
  //     })
  //   }
  // },

  // signInPage: (req, res) => {
  //   return res.render('signin')
  // },

  // signIn: (req, res) => {
  //   req.flash('success_messages', '成功登入！')
  //   res.redirect('/restaurants')
  // },

  // logout: (req, res) => {
  //   req.flash('success_messages', '登出成功！')
  //   req.logout()
  //   res.redirect('/signin')
  // },

  // 下列寫法
  // User.findByPk(req.params.id, {
  //   include: { model: Comment, include: [Restaurant] }
  // })
  // 等同於
  // User.findByPk(req.params.id)
  //   .then((user) => {
  //     Comment.findAndCountAll({
  //       where: { UserId: req.params.id },
  //       include: Restaurant
  //     })
  //   })
  // include的用法去參照model的關聯會比較清楚用法

  // 可能需要解決的問題：自己追蹤自己算是合理的功能嗎?

  getUser: (req, res, callback) => {
    User.findByPk(req.params.id, {
      include: [
        { model: Comment, include: [Restaurant] },
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' },
      ]
    }).then((user) => {
      // 找出所有評論過的餐廳(CommentedRestaurants)，但是不重複      
      const CommentedRestaurants = []
      user.Comments.forEach((comment) => {
        const data = JSON.parse(JSON.stringify(comment.dataValues.Restaurant))
        // 如果現在檢查的餐廳ID已經在CommentedRestaurants裡面，代表已經有兩則以上的評論了，不需要再把餐廳資料放進去
        if (!CommentedRestaurants.some(restaurant => restaurant.id === comment.dataValues.RestaurantId)) {
          CommentedRestaurants.push(data)
        }
      })

      const numbers = {
        numberOfComments: CommentedRestaurants.length,
        numberOfFavoritedRestaurants: user.FavoritedRestaurants.length,
        numberOfFollowers: user.Followers.length,
        numberOfFollowings: user.Followings.length
      }
      // 檢查是否是Profile的擁有者
      const isOwner = req.user.id === user.id
      const isFollowed = req.user.Followings.some(d => d.id === user.id)
      callback({
        user: user.toJSON(),
        isOwner,
        isFollowed,
        numbers,
        CommentedRestaurants
      })
    })
  },

  editUser: (req, res, callback) => {
    User.findByPk(req.params.id, {
      raw: true,
      nest: true
    }).then((user) => {
      callback({ user: user })
    })
  },

  putUser: (req, res, callback) => {
    if (!req.body.name) {
      callback({ status: 'error', message: "name didn't exist" })
    }

    const { file } = req
    if (file) {
      imgur.setClientID(IMGUR_CLIENT_ID);
      imgur.upload(file.path, (err, img) => {
        if (err) console.log('Error: ', err)
        return User.findByPk(req.params.id)
          .then((user) => {
            user.update({
              name: req.body.name,
              image: file ? img.data.link : user.image
            }).then((user) => {
              callback({ status: 'success', message: "user was successfully to update" })
            })
          })
      })
    } else {
      return User.findByPk(req.params.id)
        .then((user) => {
          user.update({
            name: req.body.name,
            image: user.image ? user.image : ''
          }).then((user) => {
            callback({ status: 'success', message: "user was successfully to update" })
          })
        })
    }
  },

  addFavorite: (req, res, callback) => {
    return Favorite.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        callback({ status: 'success', message: 'Favorite was successfully to update' })
      })
  },

  removeFavorite: (req, res, callback) => {
    return Favorite.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((favorite) => {
        favorite.destroy()
          .then((restaurant) => {
            callback({ status: 'success', message: 'Favorite was successfully to removed' })
          })
      })
  },

  addLike: (req, res, callback) => {
    return Like.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        callback({ status: 'success', message: 'Like was successfully to update' })
      })
  },

  removeLike: (req, res, callback) => {
    return Like.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then(like => like.destroy())
      .then(restaurant => {
        callback({ status: 'success', message: 'Favorite was successfully to removed' })
      })

  },

  getTopUser: (req, res, callback) => {
    return User.findAll({
      include: [
        { model: User, as: 'Followers' }
      ]
    }).then(users => {
      users = users.map(user => ({
        ...user.dataValues,
        FollowerCount: user.Followers.length,
        isFollowed: req.user.Followings.some(d => d.id === user.id)
      }))
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
      callback({ users: users })
    })
  },

  addFollowing: (req, res, callback) => {
    return Followship.create({
      followerId: req.user.id,
      followingId: req.params.userId
    })
      .then((followship) => {
        callback({ status: 'success', message: 'Following was successfully to update' })
      })
  },

  removeFollowing: (req, res, callback) => {
    return Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => followship.destroy())
      .then((followship) => {
        callback({ status: 'success', message: 'Following was successfully to removed' })
      })
  }

}

module.exports = userService