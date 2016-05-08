var Promise = require("bluebird"),
	$ 		= require('cheerio'),
	_ 		= require("lodash");


module.exports = { 



	/**
	 * Get guest name from subject
	 * @param {[type]} subject [description]
	 * @param {[type]} rx      [description]
	 */
	ParseSubject: function (subject, rx) {
		var result = {}
		var m = subject.match(new RegExp(rx, "i"))
		if (m) {
			result.guest_name = m[1]
			return result
		}
		return new Error("ParseSubject: failed to parse subject")
	},

	/**
	 * Parse an inquiry message
	 * @param {Object} rxCollection regular expression collection
	 */
	Parse: function (rxCollection) {
		var self = this
		var result = {};
		return function(msgType, msgObj) {
			return new Promise(function (resolve, reject){
				
				// parse subject
				var subjectData = self.ParseSubject(msgObj.subject, rxCollection.subject[msgType])
				if (subjectData instanceof Error) {
					reject(new Error(msgType + "/Parse: " + subjectData.message))
					return
				}

				result[msgType] = _.extend(subjectData, { reply_to: msgObj.replyTo })
				resolve(result)
			});
		}
	}
}