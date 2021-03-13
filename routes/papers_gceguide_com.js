var Crawler = require("crawler");
var express = require('express');
var router = express.Router();
/*
const Agent = require('socks5-https-client/lib/Agent');
*/

var c = new Crawler({
  skipEventRequest: false,
  maxConnections: 30,
  method: 'GET',
  /*
  agentClass: Agent, //adding socks5 https agent
  agentOptions: {
    socksHost: '103.214.41.98',
    socksPort: 4145
  },
  */
});

router.get('/:cate/:sub/:year', function (req, res, next) {
  if (req.params.sub == 'Business Studies (9707)') {
    var sub = 'Business%20Studies%20%20(9707)';
  } else {
    var sub = req.params.sub;
  }
  var year = req.params.year;
  var server = 'https://papers.gceguide.com';
  var uri_url = server + '/' + req.params.cate + '/' + sub + '/' + year + '/';

  var uri = server + '/' + req.params.cate + '/' + sub + '/' + year;

  console.log(uri)
  c.queue([{
    uri: uri,
    callback: function (error, resC, done) {
      if (error) {
        console.log(error);
      } else {
        var $ = resC.$;
        var key = 0;
        var returnArray = {
          papers: new Array,
          count: 0
        };
        $(".file>a").each(function () {
          if ($(this).text() !== 'error_log') {
            const name = $(this).text();

            // key 字段
            key += 1;

            // info 字段
            if (name.indexOf('qp') > -1) {
              var info = 'Question Paper';
            } else if (name.indexOf('ms') > -1) {
              var info = 'Mark Scheme';
            } else if (name.indexOf('er') > -1) {
              var info = 'Examiner Report';
            } else if (name.indexOf('ir') > -1 || name.indexOf('ci') > -1) {
              var info = 'Confidential Instruction';
            } else if (name.indexOf('gt') > -1) {
              var info = 'Grade thresholds';
            } else if (name.indexOf('Data_Booklet') > -1) {
              var info = 'Data Booklet';
            } else if (name.indexOf('sci') > -1) {
              var info = 'Specimen Confidential Instruction';
            } else if (name.indexOf('sp') > -1) {
              var info = 'Specimen Paper';
            } else if (name.indexOf('sm') > -1) {
              var info = 'Specimen Mark Scheme'
            } else if (name.indexOf('in') > -1) {
              var info = 'Inert';
            } else {
              var info = 'Unknown'
            }

            // type 字段
            if (name.indexOf('.pdf') > -1) {
              var type = 'PDF';
            } else if (name.indexOf('.mp3') > -1) {
              var type = 'MP3';
            } else if (name.indexOf('.docx') > -1) {
              var type = 'DOC';
            } else {
              var type = 'Unknown'
            }

            // year 字段
            if (name.indexOf('List') > -1 || name.indexOf('-') > -1 || name.indexOf('_') == -1) {
              var year = 0;
            } else {
              var year = name.split("_")[1].substr(1);
            }

            returnArray.papers.push({
              'name': $(this).text(),
              'url': uri_url + $(this).attr('href'),
              'key': key,
              'info': [
                info
              ],
              'type': type,
              'year': year
            });
          }
        });

        returnArray.count = returnArray.papers.length;

        res.send(JSON.stringify(returnArray));
      }
      done();
    }
  }]);
});

module.exports = router;