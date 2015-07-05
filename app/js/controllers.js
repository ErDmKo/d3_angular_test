var chartModule = angular.module('edkChartApp', [
    'edkChartInfo',
])
.controller('charCtrl', function($scope) {
    var dateCounter = new Date().getTime(),
        timeStep = 1000*60*60*24;

    $scope.charData = Object.keys(new Int8Array(410))
        .reduce(function(prev, next, i) {
            var min = -1,
                max = 1,
                prev_val = prev[prev.length-1] || [0, 0, 0, 0];

            prev.push([
                dateCounter,
                +prev_val[1] + Math.random() * (max - min) + min,
                +prev_val[2] + Math.random() * (max - min) + min,
                +prev_val[3] + Math.random() * (max - min) + min
            ]);
            dateCounter += timeStep;
            return prev;
        }, []);
});
