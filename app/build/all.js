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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2xsZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgY2hhcnRNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgnZWRrQ2hhcnRBcHAnLCBbXG4gICAgJ2Vka0NoYXJ0SW5mbycsXG5dKVxuLmNvbnRyb2xsZXIoJ2NoYXJDdHJsJywgZnVuY3Rpb24oJHNjb3BlKSB7XG4gICAgJHNjb3BlLmNoYXJEYXRhID0gT2JqZWN0LmtleXMobmV3IEludDhBcnJheSg0MDApKVxuICAgICAgICAucmVkdWNlKGZ1bmN0aW9uKHByZXYsIG5leHQsIGkpIHtcbiAgICAgICAgICAgIHZhciBtaW4gPSAtMSxcbiAgICAgICAgICAgICAgICBtYXggPSAxLFxuICAgICAgICAgICAgICAgIHByZXZfdmFsID0gcHJldltwcmV2Lmxlbmd0aF0gfHwgMDtcblxuICAgICAgICAgICAgcHJldi5wdXNoKCtuZXh0ICsgTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluKVxuICAgICAgICAgICAgcmV0dXJuIHByZXY7XG4gICAgICAgIH0sIFtdKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9