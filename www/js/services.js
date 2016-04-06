angular.module('app.services', ['ngCordova'])

    // Old local storage
.factory('$localstorage', ['$window', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },

        get: function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },

        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },

        getObject: function(key) {
            return JSON.parse($window.localStorage[key] || '{}');
        },

        removeObject: function(key) {
            return $window.localStorage.removeItem(key);
        }
    }
}])

.factory('LokiFactory', ['$q', 'Loki', function ($q, Loki) {

    var _db;
    var _lokiCodes;

    function initDB() {
        var fsAdapter = new LokiCordovaFSAdapter({"prefix": "loki"});
        _db = new Loki('codesDB', {
            autosave: true,
            autosaveInterval: 1,
            adapter: fsAdapter
            //persistenceAdapter: fsAdapter
        });
    }

    function getAllCodes() {

        return $q(function (resolve, reject) {

            var options = {};

            _db.loadDatabase(options, function () {
                _lokiCodes = _db.getCollection('codes');

                if (!_lokiCodes) {
                    _lokiCodes = _db.addCollection('codes');
                    console.log('collection doesnt exist - creating');
                }

                resolve(_lokiCodes.data);
            });
        });
    }

    function addCode(code) {
        _lokiCodes.insert(code);
    }

    function updateCode(code) {
        _lokiCodes.update(code);
    }

    function deleteCode(code) {
        _lokiCodes.remove(code);
    }

    return {
        initDB: initDB,
        addCode: addCode,
        updateCode: updateCode,
        deleteCode: deleteCode,
        getAllCodes: getAllCodes
    }
}])

.factory('OtpFactory', ['$rootScope', '$interval', '$localstorage', 'LokiFactory',  function($rootScope, $interval, $localstorage, LokiFactory) {

        var otpCodes,
            globalTimerPromise,
            totpObj = new TOTP();

        LokiFactory.initDB();

        var stopGlobalTimer = function() {
            $interval.cancel(globalTimerPromise);
        };

        var calcOtpCodes = function() {

            LokiFactory.getAllCodes().then(function(lokiCodes) {
                var otpCodes = lokiCodes,
                    updatedCodes;

                if (otpCodes.length > 0) {
                    otpCodes.forEach(function (codeData) {

                        // Create new OTP code
                        var otp = totpObj.getOTP(codeData.secret);

                        // Update code
                        codeData.code = otp;

                        // this updates the DB but not scope
                        LokiFactory.updateCode(codeData);
                    });

                    //$rootScope.$emit('codesUpdated', otpCodes);
                    $rootScope.$emit('codesUpdated', true);
                }
            });
        };

        return {

            calcOtpCodes: calcOtpCodes,
            stopGlobalTimer: stopGlobalTimer,

            startGlobalTimer: function(secondsOnLaunch) {

                // Stop any running timers
                stopGlobalTimer();

                var globalTimerCounter = secondsOnLaunch;

                globalTimerPromise = $interval(function(secondsOnLaunch) {
                    globalTimerCounter++;

                    $rootScope.$emit('timer', globalTimerCounter);

                    // Regenerate OTP codes
                    if(globalTimerCounter == 30) {

                        calcOtpCodes();

                        globalTimerCounter = 0;
                    }
                }, 1000);
            },
        }
    }])

;
