const uuidv1 = require('uuid/v1')
const bcrypt = require('bcrypt')
const { body } = require('express-validator')

const db = require('../database/db')

module.exports = {

    hashPassword: (password) => {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                err ? reject(err) : resolve(hash)
             })
        })
    },

    createUser: async ({userID, username, password, email}) => {

        //ensure that Express route is checking if userInfo is complete and meets requirements before passing to this method

        userID = uuidv1()

        const result = await db.query(`INSERT INTO ${process.env.USERTABLE} (userid, username, password, email, date_created) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userID, username, password, email, new Date()])
            .catch((err) => { return } )

        try {
            
            if (result.rows[0].userid == userInfo.userID)
            {
                return true
            }

        }

        catch {
            return false
        }
    },

    checkUsername: async (reqUsername) => {

        const res = await db.query(`SELECT username FROM ${process.env.USERTABLE} WHERE username = $1`, [reqUsername])
        .catch((err) => { 
            console.log("Database connection error", err)
            return false 
        }) //too many connections to database

        try {

            if (res.rows[0].username == `${reqUsername}`) {
                return true
            }

        }   

        catch (err) { 
            return false 
        }
    },

    checkPassword: async (reqEmail, reqPassword) => {

        //database call to get user password based on userInfo 
        const res = await db.query(`SELECT password FROM ${process.env.USERTABLE} WHERE email = $1`, [reqEmail])
        .catch((err) => { 
            console.log("Database connection error: ", err)
            return false 
        })

        if (res) {

           const hashedPassword = res.rows[0].password

           if (!hashedPassword) {
               return false
           }

            //const passwordCompare = bcrypt.compareSync(reqPassword, hashedPassword,
            const passwordCompare = await bcrypt.compare(reqPassword, hashedPassword)

            return passwordCompare 
    }

        //shouldn't happen unless client code calls with incorrect username
        return false
},

    checkUserEmail: async (email) => {
        const res = await db.query(`SELECT * FROM ${process.env.USERTABLE} WHERE email = $1`, [email])

        try {
        
            if (res.rows[0].email == `${email}`) {
                return true
            }

            else { 
                return false
            }
        }
        catch { return false }
    },

    getProfile: async (userid) => {

        //rewrite with a complex query
        try {
            const res = await db.query(`SELECT profileid FROM ${process.env.USERTABLE} WHERE userid = $1`, [userid])
            const profileResult = await db.query('SELECT * FROM ${process.env.PROFILETABLE} where profileid = $1', [res.rows[0].profileid])
        
            return profileResult.rows[0]
        }

        //or return err?
        catch (err) {
            return null
        }

    },

    getUserID: async (email) => {

        try {
            const res = await db.query(`SELECT userid, username FROM ${process.env.USERTABLE} WHERE email = $1`, [email])
        
            return res.rows[0].userid
        }

        catch (err) {
            return null
        }

    },

    getUsername: async (userID) => {

        try {
            const res = await db.query(`SELECT username FROM ${process.env.USERTABLE} WHERE userid = $1`, [userID])
        
            return res.rows[0].username
        }

        catch (err) {
            return null
        }

    },


    //POST callbacks

    register: async (userInfo) => {
            
        const hashedPassword = await module.exports.hashPassword(userInfo.password)

        userInfo.password = hashedPassword
        
        const result = await module.exports.createUser(userInfo)

        if (result)
        {
            return true
        }

        else {
            return false
        }
    },

    login: async (reqEmail, reqPassword) => {
            
        const emailResult = await module.exports.checkUserEmail(reqEmail)

        if (!emailResult) {
            return false
        }  

        const passwordResult = await module.exports.checkPassword(reqEmail, reqPassword).catch((err) => console.log(err))

        if (passwordResult) {
            return true
        }
    
        else {
            return false
        }
    },

    updateProfile: async (updates) => {

        //db.query --> pull profile info
        //put profile info into JSON
        //return JSON

    },

    formValidate: (method) => {
        
        switch (method) {

            case 'register': {
                return [
                    body('email').isEmail().withMessage("Please enter a valid e-mail"), 
                    body('stagename').not().isEmpty(), //only happens if user bypasses button and submits post request off of site
                    body('stagename').isLength({ min: 4}).withMessage("Username must be at least 4 letters long"),
                    body('password').exists().isLength({ min: 7 })
                    .withMessage('Password should be at least seven characters long')
                    .matches('[0-9]').withMessage('Password should have at lest one number')
                    .matches('[a-z]').withMessage('Password should have at least one lower case letter')
                    .matches('[A-Z]').withMessage('Password should have at least one upper case letter')
                    //.matches().withMessage(), add in regex check for special character
                    .custom((value, {req}) => {

                        if (value !== req.body.confirmPassword) {
                            return false;
                        } 
                            return value;
                        })
                    .withMessage("Passwords do not match")
                    //body('entered_phone').optional().isInt(), 
                    //phone-number is optional... change to allow for dashed
                ]
            } 
        }
    }
}
