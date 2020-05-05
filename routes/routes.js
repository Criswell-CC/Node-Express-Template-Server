const express = require('express')
const router = express.Router()
const { validationResult } = require('express-validator')
const users = require('../controllers/users')
const { checkAuth, checkNotAuth } = require('../middleware/middleware')

router.route('/',)
    .get((req, res) => {
        res.status(200)
    })
    
//test + work on this
router.route('/login')
    .get(checkAuth(), (req, res) => {

        //this check can be handled by Redux
        res.send({ loggedIn: true } )
    })
    .post(async (req, res) => {

        if (req.get('content-type') !== 'application/json;charset=UTF-8') {
            res.status(415).send("Incorrect content-type")
            return
        }

        const { email, password } = req.body

        const loginResult = await users.login(email, password)

        delete password
        delete req.body.password

        if (loginResult) {
            
            req.session.userID = await users.getUserID(email)

            //assign something else besides sessionID: for tracking purposes, it should be a "logged in session ID"
            res.cookie('appCookie', req.sessionID, { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), httpOnly: true, sameSite: true, signed: true })
            res.status(200).send(req.session.userID)
            return

        }
    
        //could also be database connection error (500)
        //connect to flash message in front-end
        res.status(401).send("Login check failed")
    })

router.route('/logout') 
    .get((req, res) => {
    
        res.clearCookie(process.env.SESS_ID)
        res.clearCookie('clubCookie')

        res.send({ loggedIn: false, text: "You are logged out" })
    })

router.route('/register')
    .post(users.formValidate('register'), async (req, res) => {

        if (req.get('content-type') !== 'application/json;charset=UTF-8') {
            res.status(415).send("Incorrect content-type")
            return
        }

        const emailCheck = await users.checkUserEmail(req.body.enteredEmail)
        const usernameCheck = await users.checkUsername(req.body.enteredUsername)

        if (emailCheck) {
            res.status(409).send("E-mail is already in use")
            return
        }

        if (usernameCheck) {
            res.status(409).send("Username is already in use")
            return
        }

        const validationResults = validationResult(req)
        
        if (!validationResults.isEmpty()) {
            const errors = validationResults.array().map((elem) => {
                return elem.msg;
            })

            console.log('Validation errors: ' + errors.join('&&'))
            res.status(422).send({ errors: errors })
            return
            //error parsing needs to happen somewhere so client-side can display particular errors back
        }

        //const { username, email, password } = req.body
            
        const userInfo = {
            //name: req.body.name,
            username: req.body.stagename,
            email: req.body.email,
            password: req.body.password
            //phone: req.body.entered_phone
        }
                
        const signupResult = await users.register(userInfo).catch((err) => { console.log("Errors signing up : ", err)})

        delete req.enteredPassword
        delete userInfo.password

        if (signupResult) {
            res.send("Successfuly registered.")
        }

        //should only be in case of a database connection error
        if (!signupResult) {
            res.status(500).send("Error registering. Try again.")
        }
    }
)

router.route('/authenticate')
    .get((req, res) => { 

        if (req.signedCookies.clubCookie) {
            res.status(200).send( { loggedIn: true } )

            return
        }  
        else {
            res.status(401).send({ loggedIn: false })
        }
    })

router.route('/profile')
    .get(checkAuth(), async (req, res) => {

        const profileData = users.getProfile(req.session.userID)

        res.send(profileData)

        //need to extract user ID from cookie; double check
        //const profileInfo = await users.getProfile([req.session.userID])
        //res.send(profileInfo)
    })
    .post(async (req, res) => {
        //business logic for updating profile
    })

module.exports = router
