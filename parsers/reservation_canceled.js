var Promise = require("bluebird"),
	$ 		= require('cheerio'),
	_ 		= require("lodash");


function parseDate(d) {
	var rx = new RegExp("^([a-z]+), ([a-z]+) ([0-9]+)$", "i")
	var m = d.match(rx)
	if (m) {
		return {
			day: m[1],
			month: m[2],
			date: m[3]
		}
	}
}

/**
 * Parse inquiry message
 * @param  {Object} msgObj message object
 */
module.exports = { 


	/**
	 * Get name of guest from subject
	 * @param  {String} subject message subject
	 * @param  {String} rx      regular expression to use to extract data
	 * @return {Object}         extracted data.
	 *                          data.confirmation_code		Confirmation code of a reservation
	 *                          data.month 					Cancelled reservation start month
	 *                          data.date 					Cancelled reservation start date
	 *                          data.month 					Cancelled reservation start month
	 */
	ParseSubject: function (subject, rx) {
		var result = {}
		var m = subject.match(new RegExp(rx, "i"))
		if (m) {
			result.confirmation_code = m[1];
			result.month = m[3];
			result.date = m[4];
			result.year = m[5];
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