const auth = {
  authenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/signin')
  },

  authenticatedAdmin: (req, res, next) => {
    if (req.isAuthenticated()) {
      if (req.user.isAdmin) { return next() }
      return res.redirect('/')
    }
    res.redirect('/signin')
  },

  isOwner: (req, res, next) => {
    // 檢查是否為該頁面擁有者
    if (Number(req.params.id) === Number(req.user.id)) {
      return next()
    } else {
      return res.redirect('back')
    }
  }
}

module.exports = auth