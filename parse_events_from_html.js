var CronJob = require('cron').CronJob;
const request = require('request');
const cheerio = require('cheerio')

function on_cron_tick() {
	var raw_html = ""
	request('https://www.esat.kuleuven.be/psi/seminars/seminar-archive', function (error, response, html) {
	  if (!error && response.statusCode == 200) {
		raw_html = html;
		const $ = cheerio.load(raw_html)
		var event_table = $('table[summary="Content listing"]')
		event_table = $('<table>').append(event_table)
		console.log(event_table.html())
	  }
	});
}

console.log('Before job instantiation');
//const job = new CronJob('00 30 11 * * 1-5', on_cron_tick);
const job = new CronJob('* * * * * *', on_cron_tick);
console.log('After job instantiation');
job.start();

