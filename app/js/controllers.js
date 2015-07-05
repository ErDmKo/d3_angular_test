var chartModule = angular.module('edkChartApp', [
    'edkChartInfo',
])
.controller('charCtrl', function($scope) {
    $scope.charData = Object.keys(new Int8Array(400))
        .reduce(function(prev, next, i) {
            var min = -1,
                max = 1,
                prev_val = prev[prev.length] || 0;

            prev.push(+next + Math.random() * (max - min) + min)
            return prev;
        }, []);
});
