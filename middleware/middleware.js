const { isEmpty } = require('../utilities/utilities')

const checkAuth = () => {
    return (req, res, next) => {
        if (!isEmpty(req.signedCookies.clubCookie)) {
            return next()
        }
        res.send({ loggedIn: false })
    }
}

const checkNotAuth = () => {
    return (req, res, next) => {

        if (isEmpty(req.signedCookies.clubCookie)) {
            return next()
        }
        res.send({ loggedIn: true })
    }
}

module.exports = { checkAuth, checkNotAuth }
