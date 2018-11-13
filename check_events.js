#!/home/r0586832/workspace/anaconda3/bin/node

const fs = require('fs');
const tabletojson = require('tabletojson');
const request = require('request');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
const path = require('path');
const config = require('./config');

let table_to_json = function (event_table, $) {
    event_table = $('<table>').append(event_table);
    event_table = tabletojson.convert(event_table.html());
    return event_table[0];
};

let send_mail = function (eventTitle) {
    let transporter = nodemailer.createTransport({
        host: 'smtps.kuleuven.be',
        port: 465,
        secure: true,
        auth: {
            user: "r0586832",
            pass: config.password 
        }
    });

    let mailOptions = {
        from: '"Joppe Geluykens" <joppe.geluykens@student.kuleuven.be>',
        to: config.receivers, // list of receivers
        subject: 'New PSI Seminar 🤗: '.concat(eventTitle),
        text: eventTitle.concat(' https://www.esat.kuleuven.be/psi/seminars/overview'), // plain text body
        html: 'Title: '.concat(eventTitle, '<br/><a href="https://www.esat.kuleuven.be/psi/seminars/overview">See upcoming seminars</a>') // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
    });
};

function on_cron_tick() {
    request('https://www.esat.kuleuven.be/psi/seminars/overview', function (error, response, html) {
        if (!error && response.statusCode === 200) {
            // Download webpage
            const $ = cheerio.load(html);

            // Find event table
            let event_table = $('table[summary="Content listing"]');
            // Make sure there are future events
            if (event_table.length === 0) {
                // No future events, we're done here.
                return;
            }

            // Convert event table to JSON
            const events = table_to_json(event_table, $);

            // Read date of last seen event from file
            let date_last_seen_filepath = path.resolve(__dirname, "date_most_recent_event_seen.txt");
            fs.readFile(date_last_seen_filepath, function (err, data) {
                const most_recent_event = events[0];
                const most_recent_event_date = most_recent_event['Start Date'];

                if (data.toString() !== most_recent_event_date) {
                    // Write date of most recent event to file
                    fs.writeFile(date_last_seen_filepath, most_recent_event_date, function (err) {});

                    // Send email
                    send_mail(most_recent_event['Title']);
                }
            });
        }
    });
}

on_cron_tick();
