angular.module('starter.services', [])

.factory('PouchdbFactory', ['$q', function ($q) {

    var db,
    codes = [];

    var initDB = function() {
        PouchDB.debug.enable('*');

        db = new PouchDB('codes', {adapter: 'websql', auto_compaction: true, location: 1}); // location should be 2
        // Listen for changes on the database (do not move, ever - needs to be here so import of old codes work)
        db.changes({ live: true, since: 'now', include_docs: true}).on('change', onDatabaseChange);

        db.info().then(console.log.bind(console));
    }

    var findIndex = function(array, id) {
        var low = 0, high = array.length, mid;
        while (low < high) {
            mid = (low + high) >>> 1;
            array[mid]._id < id ? low = mid + 1 : high = mid
        }
        return low;
    }

    var onDatabaseChange = function(change) {

        var index = findIndex(codes, change.id);
        var code = codes[index];

        if (change.deleted) {
            if (code) {
                codes.splice(index, 1); // delete
            }
        } else {
            if (code && code._id === change.id) {
                codes[index] = change.doc; // update
            } else {
                codes.splice(index, 0, change.doc) // insert
            }
        }
    }

    return {
        initDB: initDB
    }
}])

.factory('Chats', function() {
    // Might use a resource here that returns a JSON array

    // Some fake testing data
    var chats = [{
        id: 0,
        name: 'Ben Sparrow',
        lastText: 'You on your way?',
        face: 'img/ben.png'
    }, {
        id: 1,
        name: 'Max Lynx',
        lastText: 'Hey, it\'s me',
        face: 'img/max.png'
    }, {
        id: 2,
        name: 'Adam Bradleyson',
        lastText: 'I should buy a boat',
        face: 'img/adam.jpg'
    }, {
        id: 3,
        name: 'Perry Governor',
        lastText: 'Look at my mukluks!',
        face: 'img/perry.png'
    }, {
        id: 4,
        name: 'Mike Harrington',
        lastText: 'This is wicked good ice cream.',
        face: 'img/mike.png'
    }];

    return {
        all: function() {
            return chats;
        },
        remove: function(chat) {
            chats.splice(chats.indexOf(chat), 1);
        },
        get: function(chatId) {
            for (var i = 0; i < chats.length; i++) {
                if (chats[i].id === parseInt(chatId)) {
                    return chats[i];
                }
            }
            return null;
        }
    };
});
