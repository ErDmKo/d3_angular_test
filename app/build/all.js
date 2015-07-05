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
                dateMargin = 10000;

            prev.push([
                dateCounter,
                +prev_val[1] + Math.random() * (max - min) + min,
                +prev_val[2] + Math.random() * (max - min) + min,
                +prev_val[3] + Math.random() * (max - min) + min
            ]);
            dateCounter += timeStep + Math.random() * (max*dateMargin - min*dateMargin) + min*dateMargin;
            return prev;
        }, []);
});

var directiveModule = angular.module('edkChartInfo', [])
.factory('d3lib', [function(){
    return {
        get: function(){ return window.d3 }
    };
}])
.directive('chartInfo', function() {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            source: '='
        },
        template: '<div ng-transclude></div>',
        controller: [
            '$scope',
            function (scope) {
                var type = 0,
                    duration = 0,
                    changeCallBack = function(){};

                this.setCallBack = function(callBack) {
                    changeCallBack = callBack;
                };
                this.setType = function(rawType) {
                    type = rawType;
                    changeCallBack();
                };
                this.setDuration = function(rawDuration) {
                    duration = rawDuration * 1000*60*60*24;
                    changeCallBack();
                };
                this.getChartInfo = function(){
                    return (scope.source || [])
                        .reduce(function(array, source, i){
                            var elem = [source[0], source[type+1]],
                                elmDuration = source[0]- scope.source[0][0];
                            if (!duration || elmDuration <= duration) {
                                array.push(elem);
                            }
                            return array;
                        }, []);
                };
            }
        ],
    };
})
.directive('rangeSelector', function() {
    return {
        restrict: 'A',
        require: ['^chartInfo', 'rangeSelector'],
        controller: [
            '$scope',
            function(scope) {
                var callback = function() {};
                this.setCallBack = function(rawCallback){
                    callback = rawCallback;
                };
                this.setDuration = function(rawDuration){
                     callback(rawDuration);
                };
            }
        ],
        link: function(scope, element, attrs, controllers) {
            controllers[1].setCallBack(controllers[0].setDuration);
        }
    };
})
.directive('rangeItem', function() {
    return {
        restrict: 'E',
        transclude: true,
        require: '^rangeSelector',
        scope: {
            'days': '=',
            'month': '='
        },
        template: '<div ng-transclude></div>',
        link: function(scope, element, attrs, controller) {
            element.on('click', function(){
                controller
                    .setDuration(scope.days || scope.month * 30 || 0);
            })
        }
    };
})
.directive('chartItem', ['d3lib', function(d3) {
    var d3 = d3.get();
    return {
        restrict: 'E',
        require: '^chartInfo',
        link: function(scope, element, attrs, controller) {
            var charInfo = controller.getChartInfo(),
                size = {
                    width: 700,
                    height: 300
                },
                margin = {
                    top: 30,
                    right: 10,
                    bottom: 30,
                    left: 35
                },
                width = size.width - margin.left - margin.right,
                height = size.height - margin.top - margin.bottom,
                ANIMATION_DURATION = 700;

            var svg = d3
                .select(element[0])
                .append('svg')
                .attr({
                    "height": size.height,
                    "width": size.width
                })
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var background = svg
                .append('rect')
                .attr({
                    'class': 'background',
                    height: height,
                    width: width
                });

            var time_axis = svg.append("g")
                .attr({
                    'class': "x axis time",
                    transform: "translate(0," + height + ")"
                });

            var val_axis = svg.append("g")
                .attr({
                    'class': "y axis val",
                });
            var line = svg.append("g")
                .attr({
                    'class': "line_info",
                })
                .append("path")
            line
                .transition()
                .duration(ANIMATION_DURATION)
                .ease("linear")

           var locale = d3.locale({
                "decimal": ",",
                "thousands": "\xa0",
                "grouping": [3],
                "currency": ["", " руб."],
                "dateTime": "%A, %e %B %Y г. %X",
                "date": "%d.%m.%Y",
                "time": "%H:%M:%S",
                "periods": ["AM", "PM"],
                "days": ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
                "shortDays": ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
                "months": ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
                "shortMonths": ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
            });


            var insertData = function(data) {
                var customTicks = data.length/7,
                    addInfo = [];
                
                for (var i=customTicks; i<=data.length; i+=customTicks) {
                    var val = data[Math.ceil(i)];
                    if (val) {
                        addInfo.push(val);
                    }
                }

                var xScale = d3.time.scale()
                    .range([0, width])
                    .domain(d3.extent(data.map(function(d) {
                        return d[0];
                    })));

                var yScale = d3.scale.linear()
                    .range([0, height])
                    .domain(d3.extent(data.map(function(d) {
                        return d[1];
                    })));

                var hover_g = svg
                    .selectAll('.circles')
                    .data(addInfo)

                hover_g.enter()
                    .append('svg:g')
                    .attr({
                        'class': "circles",
                        transform: function(d) {
                            return 'translate('+xScale(d[0])+', 0)';
                        }
                    });
                hover_g.exit().remove();
                hover_g
                    .selectAll('text')
                    .remove()
                hover_g
                    .append('svg:text')
                    .attr({
                        transform: function(d) {
                            return 'translate(-13, '+(yScale(d[1])-13)+')';
                        }
                    })
                    .text(function(d){
                        return d[1].toFixed(2);
                    });
                hover_g
                    .selectAll('circle')
                    .remove()
                hover_g
                    .append("svg:circle")
                    .attr({
                        cx: '1',
                        cy: function(d, i) {
                            return yScale(d[1]);
                        },
                        r: 3
                    })

                var line_function = d3.svg.line()
                    .x(function(d) {
                        return xScale(d[0]);
                    })
                    .y(function(d) {
                        return yScale(d[1]);
                    })

                line
                      .data([data])
                      .attr("class", "line")
                      .attr("d", line_function);

                 var xAxisTime = d3.svg.axis()
                    .scale(xScale)
                    .orient("bottom")
                    .ticks(5)
                    .innerTickSize(-height)
                    .outerTickSize(0)
                    .tickFormat(locale.timeFormat('%e.%m'))
                    
                 var yAxisVal = d3.svg.axis()
                    .scale(yScale)
                    .orient("left")
                    .ticks(5)
                    .innerTickSize(-width)
                    .outerTickSize(0)

                 val_axis
                    .transition()
                    .duration(ANIMATION_DURATION)
                    .ease("linear")
                    .call(yAxisVal)

                 time_axis
                    .transition()
                    .duration(ANIMATION_DURATION)
                    .ease("linear")
                    .call(xAxisTime);
            }
            insertData(controller.getChartInfo());
            controller.setCallBack(function(){
                insertData(controller.getChartInfo());
            })
        }
    };
}])
.directive('typeSelector', function() {
    return {
        restrict: 'A',
        require: '^chartInfo',
        link: function(scope, element, attrs, controller) {
            element.on('change', function(){
                controller.setType(+element.val());
            });
        }
    };
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbnRyb2xsZXJzLmpzIiwiZGlyZWN0aXZlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGNoYXJ0TW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ2Vka0NoYXJ0QXBwJywgW1xuICAgICdlZGtDaGFydEluZm8nLFxuXSlcbi5jb250cm9sbGVyKCdjaGFyQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSkge1xuICAgIHZhciBkYXRlQ291bnRlciA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICB0aW1lU3RlcCA9IDEwMDAqNjAqNjAqMjQ7XG5cbiAgICAkc2NvcGUuY2hhckRhdGEgPSBPYmplY3Qua2V5cyhuZXcgSW50OEFycmF5KDQxMCkpXG4gICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgbmV4dCwgaSkge1xuICAgICAgICAgICAgdmFyIG1pbiA9IC0xLFxuICAgICAgICAgICAgICAgIG1heCA9IDEsXG4gICAgICAgICAgICAgICAgcHJldl92YWwgPSBwcmV2W3ByZXYubGVuZ3RoLTFdIHx8IFswLCAwLCAwLCAwXTtcbiAgICAgICAgICAgICAgICBkYXRlTWFyZ2luID0gMTAwMDA7XG5cbiAgICAgICAgICAgIHByZXYucHVzaChbXG4gICAgICAgICAgICAgICAgZGF0ZUNvdW50ZXIsXG4gICAgICAgICAgICAgICAgK3ByZXZfdmFsWzFdICsgTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluLFxuICAgICAgICAgICAgICAgICtwcmV2X3ZhbFsyXSArIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbixcbiAgICAgICAgICAgICAgICArcHJldl92YWxbM10gKyBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyBtaW5cbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgZGF0ZUNvdW50ZXIgKz0gdGltZVN0ZXAgKyBNYXRoLnJhbmRvbSgpICogKG1heCpkYXRlTWFyZ2luIC0gbWluKmRhdGVNYXJnaW4pICsgbWluKmRhdGVNYXJnaW47XG4gICAgICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgICAgfSwgW10pO1xufSk7XG4iLCJ2YXIgZGlyZWN0aXZlTW9kdWxlID0gYW5ndWxhci5tb2R1bGUoJ2Vka0NoYXJ0SW5mbycsIFtdKVxuLmZhY3RvcnkoJ2QzbGliJywgW2Z1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpeyByZXR1cm4gd2luZG93LmQzIH1cbiAgICB9O1xufV0pXG4uZGlyZWN0aXZlKCdjaGFydEluZm8nLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0cmFuc2NsdWRlOiB0cnVlLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgc291cmNlOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IG5nLXRyYW5zY2x1ZGU+PC9kaXY+JyxcbiAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgJyRzY29wZScsXG4gICAgICAgICAgICBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gMCxcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlQ2FsbEJhY2sgPSBmdW5jdGlvbigpe307XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNldENhbGxCYWNrID0gZnVuY3Rpb24oY2FsbEJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlQ2FsbEJhY2sgPSBjYWxsQmFjaztcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0VHlwZSA9IGZ1bmN0aW9uKHJhd1R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHJhd1R5cGU7XG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZUNhbGxCYWNrKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldER1cmF0aW9uID0gZnVuY3Rpb24ocmF3RHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gPSByYXdEdXJhdGlvbiAqIDEwMDAqNjAqNjAqMjQ7XG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZUNhbGxCYWNrKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldENoYXJ0SW5mbyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoc2NvcGUuc291cmNlIHx8IFtdKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlZHVjZShmdW5jdGlvbihhcnJheSwgc291cmNlLCBpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IFtzb3VyY2VbMF0sIHNvdXJjZVt0eXBlKzFdXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxtRHVyYXRpb24gPSBzb3VyY2VbMF0tIHNjb3BlLnNvdXJjZVswXVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWR1cmF0aW9uIHx8IGVsbUR1cmF0aW9uIDw9IGR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5LnB1c2goZWxlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJheTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtdKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICBdLFxuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgncmFuZ2VTZWxlY3RvcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHJlcXVpcmU6IFsnXmNoYXJ0SW5mbycsICdyYW5nZVNlbGVjdG9yJ10sXG4gICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICckc2NvcGUnLFxuICAgICAgICAgICAgZnVuY3Rpb24oc2NvcGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbigpIHt9O1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0Q2FsbEJhY2sgPSBmdW5jdGlvbihyYXdDYWxsYmFjayl7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gcmF3Q2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldER1cmF0aW9uID0gZnVuY3Rpb24ocmF3RHVyYXRpb24pe1xuICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2socmF3RHVyYXRpb24pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY29udHJvbGxlcnMpIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXJzWzFdLnNldENhbGxCYWNrKGNvbnRyb2xsZXJzWzBdLnNldER1cmF0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG59KVxuLmRpcmVjdGl2ZSgncmFuZ2VJdGVtJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZTogJ15yYW5nZVNlbGVjdG9yJyxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICdkYXlzJzogJz0nLFxuICAgICAgICAgICAgJ21vbnRoJzogJz0nXG4gICAgICAgIH0sXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBuZy10cmFuc2NsdWRlPjwvZGl2PicsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgY29udHJvbGxlcikge1xuICAgICAgICAgICAgZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJcbiAgICAgICAgICAgICAgICAgICAgLnNldER1cmF0aW9uKHNjb3BlLmRheXMgfHwgc2NvcGUubW9udGggKiAzMCB8fCAwKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9O1xufSlcbi5kaXJlY3RpdmUoJ2NoYXJ0SXRlbScsIFsnZDNsaWInLCBmdW5jdGlvbihkMykge1xuICAgIHZhciBkMyA9IGQzLmdldCgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHJlcXVpcmU6ICdeY2hhcnRJbmZvJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBjb250cm9sbGVyKSB7XG4gICAgICAgICAgICB2YXIgY2hhckluZm8gPSBjb250cm9sbGVyLmdldENoYXJ0SW5mbygpLFxuICAgICAgICAgICAgICAgIHNpemUgPSB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiA3MDAsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogMzAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtYXJnaW4gPSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcDogMzAsXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAxMCxcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tOiAzMCxcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogMzVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHdpZHRoID0gc2l6ZS53aWR0aCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgICAgICAgICAgICAgIGhlaWdodCA9IHNpemUuaGVpZ2h0IC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b20sXG4gICAgICAgICAgICAgICAgQU5JTUFUSU9OX0RVUkFUSU9OID0gNzAwO1xuXG4gICAgICAgICAgICB2YXIgc3ZnID0gZDNcbiAgICAgICAgICAgICAgICAuc2VsZWN0KGVsZW1lbnRbMF0pXG4gICAgICAgICAgICAgICAgLmFwcGVuZCgnc3ZnJylcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIFwiaGVpZ2h0XCI6IHNpemUuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6IHNpemUud2lkdGhcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKTtcblxuICAgICAgICAgICAgdmFyIGJhY2tncm91bmQgPSBzdmdcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6ICdiYWNrZ3JvdW5kJyxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgdGltZV9heGlzID0gc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6IFwieCBheGlzIHRpbWVcIixcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCJcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIHZhbF9heGlzID0gc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6IFwieSBheGlzIHZhbFwiLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGxpbmUgPSBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJzogXCJsaW5lX2luZm9cIixcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgICAgICBsaW5lXG4gICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbihBTklNQVRJT05fRFVSQVRJT04pXG4gICAgICAgICAgICAgICAgLmVhc2UoXCJsaW5lYXJcIilcblxuICAgICAgICAgICB2YXIgbG9jYWxlID0gZDMubG9jYWxlKHtcbiAgICAgICAgICAgICAgICBcImRlY2ltYWxcIjogXCIsXCIsXG4gICAgICAgICAgICAgICAgXCJ0aG91c2FuZHNcIjogXCJcXHhhMFwiLFxuICAgICAgICAgICAgICAgIFwiZ3JvdXBpbmdcIjogWzNdLFxuICAgICAgICAgICAgICAgIFwiY3VycmVuY3lcIjogW1wiXCIsIFwiINGA0YPQsS5cIl0sXG4gICAgICAgICAgICAgICAgXCJkYXRlVGltZVwiOiBcIiVBLCAlZSAlQiAlWSDQsy4gJVhcIixcbiAgICAgICAgICAgICAgICBcImRhdGVcIjogXCIlZC4lbS4lWVwiLFxuICAgICAgICAgICAgICAgIFwidGltZVwiOiBcIiVIOiVNOiVTXCIsXG4gICAgICAgICAgICAgICAgXCJwZXJpb2RzXCI6IFtcIkFNXCIsIFwiUE1cIl0sXG4gICAgICAgICAgICAgICAgXCJkYXlzXCI6IFtcItCy0L7RgdC60YDQtdGB0LXQvdGM0LVcIiwgXCLQv9C+0L3QtdC00LXQu9GM0L3QuNC6XCIsIFwi0LLRgtC+0YDQvdC40LpcIiwgXCLRgdGA0LXQtNCwXCIsIFwi0YfQtdGC0LLQtdGA0LNcIiwgXCLQv9GP0YLQvdC40YbQsFwiLCBcItGB0YPQsdCx0L7RgtCwXCJdLFxuICAgICAgICAgICAgICAgIFwic2hvcnREYXlzXCI6IFtcItCy0YFcIiwgXCLQv9C9XCIsIFwi0LLRglwiLCBcItGB0YBcIiwgXCLRh9GCXCIsIFwi0L/RglwiLCBcItGB0LFcIl0sXG4gICAgICAgICAgICAgICAgXCJtb250aHNcIjogW1wi0Y/QvdCy0LDRgNGPXCIsIFwi0YTQtdCy0YDQsNC70Y9cIiwgXCLQvNCw0YDRgtCwXCIsIFwi0LDQv9GA0LXQu9GPXCIsIFwi0LzQsNGPXCIsIFwi0LjRjtC90Y9cIiwgXCLQuNGO0LvRj1wiLCBcItCw0LLQs9GD0YHRgtCwXCIsIFwi0YHQtdC90YLRj9Cx0YDRj1wiLCBcItC+0LrRgtGP0LHRgNGPXCIsIFwi0L3QvtGP0LHRgNGPXCIsIFwi0LTQtdC60LDQsdGA0Y9cIl0sXG4gICAgICAgICAgICAgICAgXCJzaG9ydE1vbnRoc1wiOiBbXCLRj9C90LJcIiwgXCLRhNC10LJcIiwgXCLQvNCw0YBcIiwgXCLQsNC/0YBcIiwgXCLQvNCw0LlcIiwgXCLQuNGO0L1cIiwgXCLQuNGO0LtcIiwgXCLQsNCy0LNcIiwgXCLRgdC10L1cIiwgXCLQvtC60YJcIiwgXCLQvdC+0Y9cIiwgXCLQtNC10LpcIl1cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIHZhciBpbnNlcnREYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBjdXN0b21UaWNrcyA9IGRhdGEubGVuZ3RoLzcsXG4gICAgICAgICAgICAgICAgICAgIGFkZEluZm8gPSBbXTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpPWN1c3RvbVRpY2tzOyBpPD1kYXRhLmxlbmd0aDsgaSs9Y3VzdG9tVGlja3MpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IGRhdGFbTWF0aC5jZWlsKGkpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkSW5mby5wdXNoKHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgeFNjYWxlID0gZDMudGltZS5zY2FsZSgpXG4gICAgICAgICAgICAgICAgICAgIC5yYW5nZShbMCwgd2lkdGhdKVxuICAgICAgICAgICAgICAgICAgICAuZG9tYWluKGQzLmV4dGVudChkYXRhLm1hcChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZFswXTtcbiAgICAgICAgICAgICAgICAgICAgfSkpKTtcblxuICAgICAgICAgICAgICAgIHZhciB5U2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAgICAgICAgICAgICAucmFuZ2UoWzAsIGhlaWdodF0pXG4gICAgICAgICAgICAgICAgICAgIC5kb21haW4oZDMuZXh0ZW50KGRhdGEubWFwKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkWzFdO1xuICAgICAgICAgICAgICAgICAgICB9KSkpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGhvdmVyX2cgPSBzdmdcbiAgICAgICAgICAgICAgICAgICAgLnNlbGVjdEFsbCgnLmNpcmNsZXMnKVxuICAgICAgICAgICAgICAgICAgICAuZGF0YShhZGRJbmZvKVxuXG4gICAgICAgICAgICAgICAgaG92ZXJfZy5lbnRlcigpXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJ3N2ZzpnJylcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJzogXCJjaXJjbGVzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnK3hTY2FsZShkWzBdKSsnLCAwKSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGhvdmVyX2cuZXhpdCgpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIGhvdmVyX2dcbiAgICAgICAgICAgICAgICAgICAgLnNlbGVjdEFsbCgndGV4dCcpXG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmUoKVxuICAgICAgICAgICAgICAgIGhvdmVyX2dcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnc3ZnOnRleHQnKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgtMTMsICcrKHlTY2FsZShkWzFdKS0xMykrJyknO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAudGV4dChmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkWzFdLnRvRml4ZWQoMik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGhvdmVyX2dcbiAgICAgICAgICAgICAgICAgICAgLnNlbGVjdEFsbCgnY2lyY2xlJylcbiAgICAgICAgICAgICAgICAgICAgLnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgaG92ZXJfZ1xuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKFwic3ZnOmNpcmNsZVwiKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgICAgICBjeDogJzEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3k6IGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geVNjYWxlKGRbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHI6IDNcbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIHZhciBsaW5lX2Z1bmN0aW9uID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgICAgICAgICAgICAgICAueChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKGRbMF0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAueShmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geVNjYWxlKGRbMV0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgbGluZVxuICAgICAgICAgICAgICAgICAgICAgIC5kYXRhKFtkYXRhXSlcbiAgICAgICAgICAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGluZVwiKVxuICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBsaW5lX2Z1bmN0aW9uKTtcblxuICAgICAgICAgICAgICAgICB2YXIgeEF4aXNUaW1lID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAgICAgICAgICAgICAuc2NhbGUoeFNjYWxlKVxuICAgICAgICAgICAgICAgICAgICAub3JpZW50KFwiYm90dG9tXCIpXG4gICAgICAgICAgICAgICAgICAgIC50aWNrcyg1KVxuICAgICAgICAgICAgICAgICAgICAuaW5uZXJUaWNrU2l6ZSgtaGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAub3V0ZXJUaWNrU2l6ZSgwKVxuICAgICAgICAgICAgICAgICAgICAudGlja0Zvcm1hdChsb2NhbGUudGltZUZvcm1hdCgnJWUuJW0nKSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgIHZhciB5QXhpc1ZhbCA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgICAgICAgICAgICAgLnNjYWxlKHlTY2FsZSlcbiAgICAgICAgICAgICAgICAgICAgLm9yaWVudChcImxlZnRcIilcbiAgICAgICAgICAgICAgICAgICAgLnRpY2tzKDUpXG4gICAgICAgICAgICAgICAgICAgIC5pbm5lclRpY2tTaXplKC13aWR0aClcbiAgICAgICAgICAgICAgICAgICAgLm91dGVyVGlja1NpemUoMClcblxuICAgICAgICAgICAgICAgICB2YWxfYXhpc1xuICAgICAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIC5kdXJhdGlvbihBTklNQVRJT05fRFVSQVRJT04pXG4gICAgICAgICAgICAgICAgICAgIC5lYXNlKFwibGluZWFyXCIpXG4gICAgICAgICAgICAgICAgICAgIC5jYWxsKHlBeGlzVmFsKVxuXG4gICAgICAgICAgICAgICAgIHRpbWVfYXhpc1xuICAgICAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIC5kdXJhdGlvbihBTklNQVRJT05fRFVSQVRJT04pXG4gICAgICAgICAgICAgICAgICAgIC5lYXNlKFwibGluZWFyXCIpXG4gICAgICAgICAgICAgICAgICAgIC5jYWxsKHhBeGlzVGltZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbnNlcnREYXRhKGNvbnRyb2xsZXIuZ2V0Q2hhcnRJbmZvKCkpO1xuICAgICAgICAgICAgY29udHJvbGxlci5zZXRDYWxsQmFjayhmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIGluc2VydERhdGEoY29udHJvbGxlci5nZXRDaGFydEluZm8oKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfTtcbn1dKVxuLmRpcmVjdGl2ZSgndHlwZVNlbGVjdG9yJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgcmVxdWlyZTogJ15jaGFydEluZm8nLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIGNvbnRyb2xsZXIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlci5zZXRUeXBlKCtlbGVtZW50LnZhbCgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9