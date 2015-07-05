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
