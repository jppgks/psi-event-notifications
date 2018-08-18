const request = require('request');
const cheerio = require('cheerio')

var raw_html = ""
request('https://www.esat.kuleuven.be/psi/seminars/seminar-archive', function (error, response, html) {
  if (!error && response.statusCode == 200) {
    raw_html = html;
	const $ = cheerio.load(raw_html)
	var event_table = $('table[summary="Content listing"]')
	console.log(event_table.html())
  }
});

