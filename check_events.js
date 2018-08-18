#!/usr/bin/env node

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

let send_mail = function () {
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
        to: 'joppe.geluykens@student.kuleuven.be', // list of receivers
        subject: 'New PSI Seminar 🎟',
        text: 'https://www.esat.kuleuven.be/psi/seminars/overview', // plain text body
        html: '<a href="https://www.esat.kuleuven.be/psi/seminars/overview">See upcoming seminars</a>' // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
};

function on_cron_tick() {
    request('https://www.esat.kuleuven.be/psi/seminars/seminar-archive', function (error, response, html) {
        if (!error && response.statusCode === 200) {
            // Download webpage
            const $ = cheerio.load(html);

            // Find event table
            let event_table = $('table[summary="Content listing"]');

            // Convert event table to JSON
            const events = table_to_json(event_table, $);

            // Read date of last seen event from file
            let date_last_seen_filepath = "date_most_recent_event_seen.txt";
            fs.readFile(date_last_seen_filepath, function (err, data) {
                const most_recent_event = events[0];
                const most_recent_event_date = most_recent_event['Start Date'];

                if (data.toString() !== most_recent_event_date) {
                    // Write date of most recent event to file
                    fs.writeFile(date_last_seen_filepath, most_recent_event_date, function (err) {
                        console.debug("Wrote date of most recent event to file.")
                    });

                    // Send email
                    send_mail();
                }
            });
        }
    });
}

on_cron_tick();
