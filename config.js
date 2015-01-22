var emailSubs = "lumir.mrkva@topmonks.com"

var config = {
	interval: 15,
	pages: [
			{
				name: 'production',
				url: 'http://www.csas.cz/webapi/api/v1/version',
		        email: emailSubs
			}
		],
	notifications: {
		hipchat: {
			token: process.env.HIPCHAT_TOKEN,
			room: 'WebApi'
		},
		email: {
		    service: 'Gmail',
		    auth: {
		        user: 'lumir.mrkva@topmonks.com',
		        pass: process.env.EMAIL_PASS
		    }
		}
	}
}

module.exports = config;