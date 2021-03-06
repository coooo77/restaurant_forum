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
const userService = require('../services/userService')

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
    userService.getUser(req, res, (data) => {
      return res.render('profile', data)
    })
  },

  editUser: (req, res) => {
    userService.editUser(req, res, (data) => {
      return res.render('editProfile', data)
    })
  },

  putUser: (req, res) => {
    userService.putUser(req, res, (data) => {
      if (data['status'] === 'error') {
        req.flash('error_messages', data['message'])
        return res.redirect('back')
      }
      req.flash('success_messages', data['message'])
      res.redirect(`/users/${req.params.id}`)
    })
  },

  addFavorite: (req, res) => {
    userService.addFavorite(req, res, (data) => {
      req.flash('success_messages', data['message'])
      return res.redirect('back')
    })
  },

  removeFavorite: (req, res) => {
    userService.removeFavorite(req, res, (data) => {
      req.flash('success_messages', data['message'])
      return res.redirect('back')
    })
  },

  addLike: (req, res) => {
    userService.addLike(req, res, (data) => {
      req.flash('success_messages', data['message'])
      return res.redirect('back')
    })
  },

  removeLike: (req, res) => {
    userService.removeLike(req, res, (data) => {
      req.flash('success_messages', data['message'])
      return res.redirect('back')
    })
  },

  getTopUser: (req, res) => {
    userService.getTopUser(req, res, (data) => {
      return res.render('topUser', data)
    })
  },

  addFollowing: (req, res) => {
    userService.addFollowing(req, res, (data) => {
      req.flash('success_messages', data['message'])
      return res.redirect('back')
    })
  },

  removeFollowing: (req, res) => {
    userService.removeFollowing(req, res, (data) => {
      req.flash('success_messages', data['message'])
      return res.redirect('back')
    })
  }
}

module.exports = userController