var expect = require('chai').expect;

module.exports = function (bookshelf) {
  describe('Pagination Plugin', function () {
    bookshelf.plugin('pagination');
    var Models = require('../helpers/objects')(bookshelf).Models;

    describe('Model instance fetchPage', function () {
      it('fetches a single page of results with defaults', function () {
        return Models.Customer.forge().fetchPage().then(function (results) {
          ['models', 'pagination'].forEach(function (prop) {
            expect(results).to.have.property(prop);
          });

          ['rowCount', 'pageCount', 'page', 'pageSize'].forEach(function (prop) {
            expect(results.pagination).to.have.property(prop);
          })

          var md = results.pagination;

          expect(md.rowCount).to.equal(4);
          expect(md.pageCount).to.equal(1);
          expect(md.page).to.equal(1);
          expect(md.pageSize).to.equal(10);
        })
      })

      it('returns the limit and offset instead of page and pageSize', function () {
        return Models.Customer.forge().fetchPage({ limit: 2, offset: 2 }).then(function (results) {
          var md = results.pagination;
          ['rowCount', 'pageCount', 'limit', 'offset'].forEach(function (prop) {
            expect(md).to.have.property(prop);
          })
        });
      })

      it('fetches a page of results with specified page size', function () {
        return Models.Customer.forge().fetchPage({ pageSize: 2 }).then(function (results) {
          var md = results.pagination;
          expect(md.rowCount).to.equal(4);
          expect(md.pageCount).to.equal(2);
          expect(md.page).to.equal(1);
        })
      })

      it('fetches a page with specified offset', function () {
        return Models.Customer.forge().orderBy('id', 'ASC').fetchPage({ limit: 2, offset: 2 }).then(function (results) {
          var m = results.models
          expect(parseInt(m[0].get('id'))).to.equal(3);
          expect(parseInt(m[1].get('id'))).to.equal(4);
        })
      })

      it('fetches a page by page number', function () {
        return Models.Customer.forge().orderBy('id', 'ASC').fetchPage({ pageSize: 2, page: 2 }).then(function (results) {
          var m = results.models;
          expect(parseInt(m[0].get('id'))).to.equal(3);
          expect(parseInt(m[1].get('id'))).to.equal(4);
        })
      })

      it('fetches a page when other columns are specified on the original query', function () {
        return Models.Customer.forge().query(function (qb) {
          qb.column.apply(qb, ['name'])
        }).fetchPage().then(function (results) {
          var md = results.pagination;
          expect(md.rowCount).to.equal(4);
        })
      })

      it('returns correct values for rowCount and pageCount when hasTimestamps is used', function() {
        return Models.Admin.fetchPage({page: 1, pageSize: 4}).then(function(admins) {
          expect(admins.pagination.rowCount).to.be.a('number');
          expect(admins.pagination.pageCount).to.be.a('number');
        })
      })
    })

    describe('Model static fetchPage', function () {
      it('fetches a page without calling forge', function () {
        return Models.Customer.fetchPage().then(function (results) {
          ['models', 'pagination'].forEach(function (prop) {
            expect(results).to.have.property(prop);
          });
        })
      })
    })

    describe('Collection fetchPage', function () {
      it('fetches a page from a collection', function () {
        return Models.Customer.collection().fetchPage().then(function (results) {
          ['models', 'pagination'].forEach(function (prop) {
            expect(results).to.have.property(prop);
          });
        })
      })
      it('fetches a page from a relation collection', function () {
        return Models.User.forge({uid: 1}).roles().fetchPage().then(function (results) {
          expect(results.length).to.equal(1);
          ['models', 'pagination'].forEach(function (prop) {
            expect(results).to.have.property(prop);
          });
        });
      })
      it('fetches a page from a relation collection with additional condition', function () {
        return Models.User.forge({uid: 1}).roles().query(function (query) {
          query.where('roles.rid', '!=', 4);
        }).fetchPage().then(function (results) {
          expect(results.length).to.equal(0);
          ['models', 'pagination'].forEach(function (prop) {
            expect(results).to.have.property(prop);
          });
        });
      })
    })

    describe('Inside a transaction', function() {
      it('returns consistent results for rowCount and number of models', function() {
        return bookshelf.transaction(function(t) {
          var options = {transacting: t};

          return Models.Site.forge({name: 'A new site'}).save(null, options).then(function() {
            options.pageSize = 25;
            options.page = 1;
            return Models.Site.forge().fetchPage(options);
          }).then(function(sites) {
            expect(sites.pagination.rowCount).to.eql(sites.models.length);
          });
        });
      })
    })
  });
};
