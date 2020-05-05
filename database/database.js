const pool = require('./config.js').pool

module.exports = {

    query: (text, params) => {
        return pool.query(text, params)
    },

    queryCallback: (text, params, callback) => {
        return pool.query(text, params, (err, res) => {
            //console.log('executed query', { text, rows: res })
            callback(err, res)
        })
    },

    getClient: (callback) => {
        pool.connect((err, client, done) => {
            const query = client.query.bind(client)
        })

        client.query = () => {
            client.lastQuery = arguments
            client.query.apply(client, arguments)
        }

        const timeout = setTimeout(() => {
            const release = (err) => {
                done(err)
            }
            clearTimeout(timeout);
            client.query = query
        })

        callback(err, client, release)
    },

    shutdown: () => {
        pool.end()
    }

}
