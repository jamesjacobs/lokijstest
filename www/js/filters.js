angular.module('app.filters', []).
    filter('splitInHalf', function() {
        return function(input, start, end, split) {
            var one = input.substring(start, split);
            var two = input.substring(split, end);
            var newCode = one + " " + two;

            return newCode;

        }
    });