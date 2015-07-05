'use strict';

describe('edkCharApp module', function() {
    beforeEach(module('edkChartApp'));
    describe('edkCharApp controllers', function() {
        describe('edkCharApp controllers charCtrl', function() {
            it('should create random data set for char', 
                inject(function($controller) {
                    var $scope = {},
                        ctrl = $controller("charCtrl", {$scope: $scope});
                    expect($scope).to.have.property('charData');
                    expect($scope.charData).to.be.a('array');
                    expect($scope.charData).to.have.length.above(400);
                }));
        })
    });
});
