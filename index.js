var request = require("request")
	, iconv = require("iconv-lite")
	, cheerio = require("cheerio")
	, qs = require("querystring")

var get_book_URL = function(isbn, cb) {
	var address = "http://martinus.sk?" + qs.stringify({
			uMod: "list",
			uTyp: "search",
			uQ: isbn
		});
	request.get(address, {encoding: null}, function(err, res, body) {
		if (err || res.statusCode != 200) {
			cb(err, null);
			return
		}
		var utfStr = iconv.decode(body, "win1250");
		var $ = cheerio.load(utfStr);
		var url = $("a", $(".title")).attr("href");
		if (!url) {
			cb(new Error("Book not found"), null);
			return
		}
		cb(null, url)
	});
}

var scrape_book_page = function(bookURL, cb) {
	request.get(bookURL, {encoding: null}, function(err, res, body) {
		if (err || res.statusCode != 200) {
			cb(err, null);
			return
		}
		var utfStr = iconv.decode(body, "win1250");
		var $ = cheerio.load(utfStr);
		var book = {
			title: $("h1[itemprop=name]").text().trim(),
			author: $(".subtitle > .author  strong").text(),
			publisher: $(".publisher > a").text(),
			pubYear: /\d\d\d\d/.exec($(".subtitle"))[0],
			price: parseFloat($(".oldPrice > strong").text().replace(",", ".")),
			pages: parseInt(/(\d*) strán/.exec($(".specification").text())[1]),
			imageUrl: "http://martinus.sk" + $(".detailImageHolder > a").attr("href")
		}
		cb(null, book)
	});
}

exports.getBook = function(isbn, cb) {
	get_book_URL(isbn.replace(new RegExp("-", "g"), ""), function(err, url) {
		if (err != null) {
			cb(err);
			return
		}
		scrape_book_page(url, function(err, book) {
			if (err != null) {
				cb(err);
				return
			}
			book.ISBN = isbn;
			cb(null, book);
		})
	});
}