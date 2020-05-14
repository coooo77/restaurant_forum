const db = require('../models')
const Comment = db.Comment
let commentService = {

  postComment: (req, res, callback) => {
    return Comment.create({
      text: req.body.text,
      RestaurantId: req.body.restaurantId,
      UserId: req.user.id
    })
      .then((comment) => {
        callback({
          status: 'success',
          message: 'comment was successfully to update',
          RestaurantId: comment.RestaurantId
        })
      })
  },

  deleteComment: (req, res, callback) => {
    return Comment.findByPk(req.params.id)
      .then((comment) => {
        comment.destroy()
          .then((comment) => {
            callback({
              status: 'success',
              message: 'comment was successfully to be removed',
              RestaurantId: comment.RestaurantId
            })
          })
      })
  }
}
module.exports = commentService