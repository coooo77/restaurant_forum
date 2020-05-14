const db = require('../models')
const Comment = db.Comment
const commentService = require('../services/commentService')
let commentController = {
  postComment: (req, res) => {
    commentService.postComment(req, res, (data) => {
      req.flash('success_messages', data['message'])
      return res.redirect(`/restaurants/${data.RestaurantId}`)
    })
  },

  deleteComment: (req, res) => {
    commentService.deleteComment(req, res, (data) => {
      req.flash('success_messages', data['message'])
      return res.redirect(`/restaurants/${data.RestaurantId}`)
    })
  }
}
module.exports = commentController