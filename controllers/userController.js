const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Comment = db.Comment
const Restaurant = db.Restaurant
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship
const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

const userController = {
  signUpPage: (req, res) => {
    return res.render('signup')
  },

  signUp: (req, res) => {
    // confirm password
    if (req.body.passwordCheck !== req.body.password) {
      req.flash('error_messages', '兩次密碼輸入不同！')
      return res.redirect('/signup')
    } else {
      // confirm unique user
      User.findOne({ where: { email: req.body.email } }).then(user => {
        if (user) {
          req.flash('error_messages', '信箱重複！')
          return res.redirect('/signup')
        } else {
          User.create({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
          }).then(user => {
            req.flash('success_messages', '成功註冊帳號！')
            return res.redirect('/signin')
          })
        }
      })
    }
  },

  signInPage: (req, res) => {
    return res.render('signin')
  },

  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },

  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },

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

  getUser: (req, res) => {
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
        // 如果CommentedRestaurants內有餐廳資料，把餐廳ID取出來做成陣列(currentData)來檢查；沒有的話就是第一次檢查，為了避免錯誤產生，所以給予空陣列[]
        const currentData = CommentedRestaurants.length ? CommentedRestaurants.map(restaurant => restaurant.id) : []
        const data = JSON.parse(JSON.stringify(comment.dataValues.Restaurant))
        // 如果現在檢查的餐廳ID已經在currentData裡面，代表已經有兩則以上的評論了，不需要再把餐廳資料放進去
        if (!currentData.includes(comment.dataValues.RestaurantId)) {
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
      const isFollowed = req.user.Followings.map(d => d.id).includes(user.id)
      return res.render('profile', {
        user: user.toJSON(),
        isOwner,
        isFollowed,
        numbers,
        CommentedRestaurants
      })
    })
  },

  editUser: (req, res) => {
    User.findByPk(req.params.id, {
      raw: true,
      nest: true
    }).then((user) => {
      return res.render('editProfile', { user: user })
    })
  },

  putUser: (req, res) => {
    if (!req.body.name) {
      req.flash('error_messages', "name didn't exist")
      return res.redirect('back')
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
              req.flash('success_messages', 'user was successfully to update')
              res.redirect(`/users/${user.id}`)
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
            req.flash('success_messages', 'user was successfully to update')
            res.redirect(`/users/${user.id}`)
          })
        })
    }
  },

  addFavorite: (req, res) => {
    return Favorite.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
  },

  removeFavorite: (req, res) => {
    return Favorite.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((favorite) => {
        favorite.destroy()
          .then((restaurant) => {
            return res.redirect('back')
          })
      })
  },

  addLike: (req, res) => {
    return Like.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
  },

  removeLike: (req, res) => {
    return Like.findOne({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then(like => like.destroy())
      .then(restaurant => res.redirect('back'))

  },

  getTopUser: (req, res) => {
    return User.findAll({
      include: [
        { model: User, as: 'Followers' }
      ]
    }).then(users => {
      users = users.map(user => ({
        ...user.dataValues,
        FollowerCount: user.Followers.length,
        isFollowed: req.user.Followings.map(d => d.id).includes(user.id)
      }))
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
      return res.render('topUser', { users: users })
    })
  },

  addFollowing: (req, res) => {
    return Followship.create({
      followerId: req.user.id,
      followingId: req.params.userId
    })
      .then((followship) => {
        return res.redirect('back')
      })
  },

  removeFollowing: (req, res) => {
    return Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => followship.destroy())
      .then((followship) => res.redirect('back'))
  }

}

module.exports = userController