/*
 * ion-autocomplete 0.3.2
 * Copyright 2016 Danny Povolotski 
 * Copyright modifications 2016 Guy Brand 
 * https://github.com/guylabs/ion-autocomplete
 */
(function() {

'use strict';

angular.module('ion-autocomplete', []).directive('ionAutocomplete', [
    '$ionicBackdrop', '$ionicScrollDelegate', '$document', '$q', '$parse', '$interpolate', '$ionicPlatform', '$compile', '$templateRequest',
    function ($ionicBackdrop, $ionicScrollDelegate, $document, $q, $parse, $interpolate, $ionicPlatform, $compile, $templateRequest) {
        return {
            require: ['ngModel', 'ionAutocomplete'],
            restrict: 'A',
            scope: {},
            bindToController: {
                ngModel: '=',
                externalModel: '=',
                templateData: '=',
                itemsMethod: '&',
                itemsClickedMethod: '&',
                itemsRemovedMethod: '&',
                modelToItemMethod: '&',
                cancelButtonClickedMethod: '&',
                placeholder: '@',
                cancelLabel: '@',
                selectItemsLabel: '@',
                selectedItemsLabel: '@'
            },
            controllerAs: 'viewModel',
            controller: ['$attrs', '$timeout', '$scope', function ($attrs, $timeout, $scope) {

                var valueOrDefault = function (value, defaultValue) {
                    return !value ? defaultValue : value;
                };

                var controller = this;

                // set the default values of the one way binded attributes
                $timeout(function () {
                    controller.placeholder = valueOrDefault(controller.placeholder, 'Click to enter a value...');
                    controller.cancelLabel = valueOrDefault(controller.cancelLabel, 'Done');
                    controller.selectItemsLabel = valueOrDefault(controller.selectItemsLabel, "Select an item...");
                    controller.selectedItemsLabel = valueOrDefault(controller.selectedItemsLabel, $interpolate("Selected items{{maxSelectedItems ? ' (max. ' + maxSelectedItems + ')' : ''}}:")(controller));
                });

                // set the default values of the passed in attributes
                this.maxSelectedItems = valueOrDefault($attrs.maxSelectedItems, undefined);
                this.templateUrl = valueOrDefault($attrs.templateUrl, undefined);
                this.itemsMethodValueKey = valueOrDefault($attrs.itemsMethodValueKey, undefined);
                this.itemValueKey = valueOrDefault($attrs.itemValueKey, undefined);
                this.itemViewValueKey = valueOrDefault($attrs.itemViewValueKey, undefined);
                this.componentId = valueOrDefault($attrs.componentId, undefined);
                this.loadingIcon = valueOrDefault($attrs.loadingIcon, undefined);
                this.manageExternally = valueOrDefault($attrs.manageExternally, "false");
                this.ngModelOptions = valueOrDefault($scope.$eval($attrs.ngModelOptions), {});

                // loading flag if the items-method is a function
                this.showLoadingIcon = false;

                // the items, selected items and the query for the list
                this.searchItems = [];
                this.selectedItems = [];
                this.searchQuery = undefined;

                this.isArray = function (array) {
                    return angular.isArray(array);
                };
            }],
            link: function (scope, element, attrs, controllers) {

                // get the two needed controllers
                var ngModelController = controllers[0];
                var ionAutocompleteController = controllers[1];

                // use a random css class to bind the modal to the component
                ionAutocompleteController.randomCssClass = "ion-autocomplete-random-" + Math.floor((Math.random() * 1000) + 1);

                var template = [
                    '<div class="ion-autocomplete-container ' + ionAutocompleteController.randomCssClass + ' modal" style="display: none;">',
                    '<div class="bar bar-header item-input-inset">',
                    '<label class="item-input-wrapper">',
                    '<i class="icon ion-search placeholder-icon"></i>',
                    '<input type="search" class="ion-autocomplete-search" ng-model="viewModel.searchQuery" ng-model-options="viewModel.ngModelOptions" placeholder="{{viewModel.placeholder}}"/>',
                    '</label>',
                    '<div class="ion-autocomplete-loading-icon" ng-if="viewModel.showLoadingIcon && viewModel.loadingIcon"><ion-spinner icon="{{viewModel.loadingIcon}}"></ion-spinner></div>',
                    '<button class="ion-autocomplete-cancel button button-clear" ng-click="viewModel.cancelClick()">{{viewModel.cancelLabel}}</button>',
                    '</div>',
                    '<ion-content class="has-header">',
                    '<ion-item class="item-divider">{{viewModel.selectedItemsLabel}}</ion-item>',
                    '<ion-item ng-if="viewModel.isArray(viewModel.selectedItems)" ng-repeat="selectedItem in viewModel.selectedItems track by $index" class="item-icon-left item-icon-right item-text-wrap">',
                    '<i class="icon ion-checkmark"></i>',
                    '{{viewModel.getItemValue(selectedItem, viewModel.itemViewValueKey)}}',
                    '<i class="icon ion-trash-a" style="cursor:pointer" ng-click="viewModel.removeItem($index)"></i>',
                    '</ion-item>',
                    '<ion-item ng-if="!viewModel.isArray(viewModel.selectedItems)" class="item-icon-left item-icon-right item-text-wrap">',
                    '<i class="icon ion-checkmark"></i>',
                    '{{viewModel.getItemValue(viewModel.selectedItems, viewModel.itemViewValueKey)}}',
                    '<i class="icon ion-trash-a" style="cursor:pointer" ng-click="viewModel.removeItem(0)"></i>',
                    '</ion-item>',
                    '<ion-item class="item-divider" ng-if="viewModel.searchItems.length > 0">{{viewModel.selectItemsLabel}}</ion-item>',
                    '<ion-item ng-repeat="item in viewModel.searchItems" item-height="55px" item-width="100%" ng-click="viewModel.selectItem(item)" class="item-text-wrap">',
                    '{{viewModel.getItemValue(item, viewModel.itemViewValueKey)}}',
                    '</ion-item>',
                    '</ion-content>',
                    '</div>'
                ].join('');

                // load the template synchronously or asynchronously
                $q.when().then(function () {

                    // first check if a template url is set and use this as template
                    if (ionAutocompleteController.templateUrl) {
                        return $templateRequest(ionAutocompleteController.templateUrl);
                    } else {
                        return template;
                    }
                }).then(function (template) {

                    // compile the template
                    var searchInputElement = $compile(angular.element(template))(scope);

                    // append the template to body
                    $document.find('body').append(searchInputElement);


                    // returns the value of an item
                    ionAutocompleteController.getItemValue = function (item, key) {

                        // if it's an array, go through all items and add the values to a new array and return it
                        if (angular.isArray(item)) {
                            var items = [];
                            angular.forEach(item, function (itemValue) {
                                if (key && angular.isObject(item)) {
                                    items.push($parse(key)(itemValue));
                                } else {
                                    items.push(itemValue);
                                }
                            });
                            return items;
                        } else {
                            if (key && angular.isObject(item)) {
                                return $parse(key)(item);
                            }
                        }
                        return item;
                    };

                    // function which selects the item, hides the search container and the ionic backdrop if it has not maximum selected items attribute set
                    ionAutocompleteController.selectItem = function (item) {

                        // clear the search query when an item is selected
                        ionAutocompleteController.searchQuery = undefined;

                        // return if the max selected items is not equal to 1 and the maximum amount of selected items is reached
                        if (ionAutocompleteController.maxSelectedItems != "1" &&
                            angular.isArray(ionAutocompleteController.selectedItems) &&
                            ionAutocompleteController.maxSelectedItems == ionAutocompleteController.selectedItems.length) {
                            return;
                        }

                        // store the selected items
                        if (!isKeyValueInObjectArray(ionAutocompleteController.selectedItems,
                                ionAutocompleteController.itemValueKey, ionAutocompleteController.getItemValue(item, ionAutocompleteController.itemValueKey))) {

                            // if it is a single select set the item directly
                            if (ionAutocompleteController.maxSelectedItems == "1") {
                                ionAutocompleteController.selectedItems = item;
                            } else {
                                // create a new array to update the model. See https://github.com/angular-ui/ui-select/issues/191#issuecomment-55471732
                                ionAutocompleteController.selectedItems = ionAutocompleteController.selectedItems.concat([item]);
                            }
                        }

                        // set the view value and render it
                        ngModelController.$setViewValue(ionAutocompleteController.selectedItems);
                        ngModelController.$render();

                        // hide the container and the ionic backdrop if it is a single select to enhance usability
                        if (ionAutocompleteController.maxSelectedItems == 1) {
                            ionAutocompleteController.hideModal();
                        }

                        // call items clicked callback
                        if (angular.isDefined(attrs.itemsClickedMethod)) {
                            ionAutocompleteController.itemsClickedMethod({
                                callback: {
                                    item: item,
                                    selectedItems: angular.isArray(ionAutocompleteController.selectedItems) ? ionAutocompleteController.selectedItems.slice() : ionAutocompleteController.selectedItems,
                                    componentId: ionAutocompleteController.componentId
                                }
                            });
                        }
                    };

                    // function which removes the item from the selected items.
                    ionAutocompleteController.removeItem = function (index) {

                        // clear the selected items if just one item is selected
                        if (!angular.isArray(ionAutocompleteController.selectedItems)) {
                            ionAutocompleteController.selectedItems = [];
                        } else {
                            // remove the item from the selected items and create a copy of the array to update the model.
                            // See https://github.com/angular-ui/ui-select/issues/191#issuecomment-55471732
                            var removed = ionAutocompleteController.selectedItems.splice(index, 1)[0];
                            ionAutocompleteController.selectedItems = ionAutocompleteController.selectedItems.slice();
                        }

                        // set the view value and render it
                        ngModelController.$setViewValue(ionAutocompleteController.selectedItems);
                        ngModelController.$render();

                        // call items clicked callback
                        if (angular.isDefined(attrs.itemsRemovedMethod)) {
                            ionAutocompleteController.itemsRemovedMethod({
                                callback: {
                                    item: removed,
                                    selectedItems: angular.isArray(ionAutocompleteController.selectedItems) ? ionAutocompleteController.selectedItems.slice() : ionAutocompleteController.selectedItems,
                                    componentId: ionAutocompleteController.componentId
                                }
                            });
                        }
                    };

                    // watcher on the search field model to update the list according to the input
                    scope.$watch('viewModel.searchQuery', function (query) {
                        ionAutocompleteController.fetchSearchQuery(query, false);
                    });

                    // update the search items based on the returned value of the items-method
                    ionAutocompleteController.fetchSearchQuery = function (query, isInitializing) {

                        // right away return if the query is undefined to not call the items method for nothing
                        if (query === undefined) {
                            return;
                        }

                        if (angular.isDefined(attrs.itemsMethod)) {

                            // show the loading icon
                            ionAutocompleteController.showLoadingIcon = true;

                            var queryObject = {query: query, isInitializing: isInitializing};

                            // if the component id is set, then add it to the query object
                            if (ionAutocompleteController.componentId) {
                                queryObject = {
                                    query: query,
                                    isInitializing: isInitializing,
                                    componentId: ionAutocompleteController.componentId
                                }
                            }

                            // convert the given function to a $q promise to support promises too
                            var promise = $q.when(ionAutocompleteController.itemsMethod(queryObject));

                            promise.then(function (promiseData) {

                                // if the promise data is not set do nothing
                                if (!promiseData) {
                                    return;
                                }

                                // if the given promise data object has a data property use this for the further processing as the
                                // standard httpPromises from the $http functions store the response data in a data property
                                if (promiseData && promiseData.data) {
                                    promiseData = promiseData.data;
                                }

                                // set the items which are returned by the items method
                                ionAutocompleteController.searchItems = ionAutocompleteController.getItemValue(promiseData,
                                    ionAutocompleteController.itemsMethodValueKey);

                                // force the collection repeat to redraw itself as there were issues when the first items were added
                                $ionicScrollDelegate.resize();

                                // hide the loading icon
                                ionAutocompleteController.showLoadingIcon = false;
                            }, function (error) {
                                // reject the error because we do not handle the error here
                                return $q.reject(error);
                            });
                        }
                    };

                    var searchContainerDisplayed = false;

                    ionAutocompleteController.showModal = function () {
                        if (searchContainerDisplayed) {
                            return;
                        }

                        // show the backdrop and the search container
                        $ionicBackdrop.retain();
                        angular.element($document[0].querySelector('div.ion-autocomplete-container.' + ionAutocompleteController.randomCssClass)).css('display', 'block');

                        // hide the container if the back button is pressed
                        scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(function () {
                            ionAutocompleteController.hideModal();
                        }, 300);

                        // get the compiled search field
                        var searchInputElement = angular.element($document[0].querySelector('div.ion-autocomplete-container.' + ionAutocompleteController.randomCssClass + ' input'));

                        // focus on the search input field
                        if (searchInputElement.length > 0) {
                            searchInputElement[0].focus();
                            setTimeout(function () {
                                searchInputElement[0].focus();
                            }, 0);
                        }

                        // force the collection repeat to redraw itself as there were issues when the first items were added
                        $ionicScrollDelegate.resize();

                        searchContainerDisplayed = true;
                    };

                    ionAutocompleteController.hideModal = function () {
                        angular.element($document[0].querySelector('div.ion-autocomplete-container.' + ionAutocompleteController.randomCssClass)).css('display', 'none');
                        ionAutocompleteController.searchQuery = undefined;
                        $ionicBackdrop.release();
                        scope.$deregisterBackButton && scope.$deregisterBackButton();
                        searchContainerDisplayed = false;
                    };

                    // object to store if the user moved the finger to prevent opening the modal
                    var scrolling = {
                        moved: false,
                        startX: 0,
                        startY: 0
                    };

                    // store the start coordinates of the touch start event
                    var onTouchStart = function (e) {
                        scrolling.moved = false;
                        // Use originalEvent when available, fix compatibility with jQuery
                        if (typeof(e.originalEvent) !== 'undefined') {
                            e = e.originalEvent;
                        }
                        scrolling.startX = e.touches[0].clientX;
                        scrolling.startY = e.touches[0].clientY;
                    };

                    // check if the finger moves more than 10px and set the moved flag to true
                    var onTouchMove = function (e) {
                        // Use originalEvent when available, fix compatibility with jQuery
                        if (typeof(e.originalEvent) !== 'undefined') {
                            e = e.originalEvent;
                        }
                        if (Math.abs(e.touches[0].clientX - scrolling.startX) > 10 ||
                            Math.abs(e.touches[0].clientY - scrolling.startY) > 10) {
                            scrolling.moved = true;
                        }
                    };

                    // click handler on the input field to show the search container
                    var onClick = function (event) {
                        // only open the dialog if was not touched at the beginning of a legitimate scroll event
                        if (scrolling.moved) {
                            return;
                        }

                        // prevent the default event and the propagation
                        event.preventDefault();
                        event.stopPropagation();

                        // call the fetch search query method once to be able to initialize it when the modal is shown
                        // use an empty string to signal that there is no change in the search query
                        ionAutocompleteController.fetchSearchQuery("", true);

                        // show the ionic backdrop and the search container
                        ionAutocompleteController.showModal();
                    };

                    var isKeyValueInObjectArray = function (objectArray, key, value) {
                        if (angular.isArray(objectArray)) {
                            for (var i = 0; i < objectArray.length; i++) {
                                if (ionAutocompleteController.getItemValue(objectArray[i], key) === value) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    };

                    // function to call the model to item method and select the item
                    var resolveAndSelectModelItem = function (modelValue) {
                        // convert the given function to a $q promise to support promises too
                        var promise = $q.when(ionAutocompleteController.modelToItemMethod({modelValue: modelValue}));

                        promise.then(function (promiseData) {
                            // select the item which are returned by the model to item method
                            ionAutocompleteController.selectItem(promiseData);
                        }, function (error) {
                            // reject the error because we do not handle the error here
                            return $q.reject(error);
                        });
                    };

                    // if the click is not handled externally, bind the handlers to the click and touch events of the input field
                    if (ionAutocompleteController.manageExternally == "false") {
                        element.bind('touchstart', onTouchStart);
                        element.bind('touchmove', onTouchMove);
                        element.bind('touchend click focus', onClick);
                    }

                    // cancel handler for the cancel button which clears the search input field model and hides the
                    // search container and the ionic backdrop and calls the cancel button clicked callback
                    ionAutocompleteController.cancelClick = function () {
                        ionAutocompleteController.hideModal();

                        // call cancel button clicked callback
                        if (angular.isDefined(attrs.cancelButtonClickedMethod)) {
                            ionAutocompleteController.cancelButtonClickedMethod({
                                callback: {
                                    selectedItems: angular.isArray(ionAutocompleteController.selectedItems) ? ionAutocompleteController.selectedItems.slice() : ionAutocompleteController.selectedItems,
                                    componentId: ionAutocompleteController.componentId
                                }
                            });
                        }
                    };

                    // watch the external model for changes and select the items inside the model
                    scope.$watch("viewModel.externalModel", function (newModel) {

                        if (angular.isArray(newModel) && newModel.length == 0) {
                            // clear the selected items and set the view value and render it
                            ionAutocompleteController.selectedItems = [];
                            ngModelController.$setViewValue(ionAutocompleteController.selectedItems);
                            ngModelController.$render();
                            return;
                        }

                        // prepopulate view and selected items if external model is already set
                        if (newModel && angular.isDefined(attrs.modelToItemMethod)) {
                            if (angular.isArray(newModel)) {
                                ionAutocompleteController.selectedItems = [];
                                angular.forEach(newModel, function (modelValue) {
                                    resolveAndSelectModelItem(modelValue);
                                })
                            } else {
                                resolveAndSelectModelItem(newModel);
                            }
                        }
                    });

                    // remove the component from the dom when scope is getting destroyed
                    scope.$on('$destroy', function () {

                        // angular takes care of cleaning all $watch's and listeners, but we still need to remove the modal
                        searchInputElement.remove();
                    });

                    // render the view value of the model
                    ngModelController.$render = function () {
                        element.val(ionAutocompleteController.getItemValue(ngModelController.$viewValue, ionAutocompleteController.itemViewValueKey));
                    };

                    // set the view value of the model
                    ngModelController.$formatters.push(function (modelValue) {
                        var viewValue = ionAutocompleteController.getItemValue(modelValue, ionAutocompleteController.itemViewValueKey);
                        return viewValue == undefined ? "" : viewValue;
                    });

                    // set the model value of the model
                    ngModelController.$parsers.push(function (viewValue) {
                        return ionAutocompleteController.getItemValue(viewValue, ionAutocompleteController.itemValueKey);
                    });

                });

            }
        };
    }
]);

})();