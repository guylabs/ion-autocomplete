angular.module('ion-autocomplete', []).directive('ionAutocomplete', ['$ionicScrollDelegate', '$document', '$q', '$parse', '$interpolate', '$ionicPlatform', '$compile', '$ionicModal',
    function ($ionicScrollDelegate, $document, $q, $parse, $interpolate, $ionicPlatform, $compile, $ionicModal) {
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
                selectedItemsLabel: '@',
                templateUrl: '@',
                itemValueKey: '@',
                itemViewValueKey: '@',
                autoOpen: '='
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
                    controller.templateUrl = valueOrDefault(controller.templateUrl, undefined);
                    controller.itemValueKey = valueOrDefault(controller.itemValueKey, undefined);
                    controller.itemViewValueKey = valueOrDefault(controller.itemViewValueKey, undefined);
                    controller.autoOpen = valueOrDefault(controller.autoOpen, false);
                });

                // set the default values of the passed in attributes
                this.maxSelectedItems = valueOrDefault($attrs.maxSelectedItems, undefined);
                this.itemsMethodValueKey = valueOrDefault($attrs.itemsMethodValueKey, undefined);
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

                var template = [
                    '<ion-modal-view>'+
                    '<ion-header-bar class="item-input-inset">',
                    '<label class="item-input-wrapper">',
                    '<i class="icon ion-search placeholder-icon"></i>',
                    '<input type="search" class="ion-autocomplete-search" ng-model="viewModel.searchQuery" ng-model-options="viewModel.ngModelOptions" placeholder="{{viewModel.placeholder}}"/>',
                    '</label>',
                    '<div class="ion-autocomplete-loading-icon" ng-if="viewModel.showLoadingIcon && viewModel.loadingIcon"><ion-spinner icon="{{viewModel.loadingIcon}}"></ion-spinner></div>',
                    '<button class="ion-autocomplete-cancel button button-clear button-dark" ng-click="viewModel.cancelClick()">{{viewModel.cancelLabel}}</button>',
                    '</ion-header-bar>',
                    '<ion-content>',
                    '<ion-list>',
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
                    '<ion-item ng-repeat="item in viewModel.searchItems track by $index" item-height="55px" item-width="100%" ng-click="viewModel.selectItem(item)" class="item-text-wrap">',
                    '{{viewModel.getItemValue(item, viewModel.itemViewValueKey)}}',
                    '</ion-item>',
                    '</ion-list>',
                    '</ion-content>',
                    '</ion-modal-view>'
                ].join('');

                // load the template synchronously or asynchronously
                $q.when().then(function () {

                    // first check if a template url is set and use this as template
                    if (ionAutocompleteController.templateUrl) {
                        return $ionicModal.fromTemplateUrl(ionAutocompleteController.templateUrl, {
                            scope: scope,
                            animation: 'slide-in-up',
                            focusFirstInput: true
                        })
                    } else {
                        return $ionicModal.fromTemplate(template, {
                            scope: scope,
                            animation: 'slide-in-up',
                            focusFirstInput: true
                        })
                    }
                }).then(function (modal) {

                    // compile the template
                    var searchInputElement = angular.element(modal.$el.find('input'));

                    // if the click is not handled externally, bind the handlers to the click and touch events of the input field
                    if (ionAutocompleteController.manageExternally == "false") {

                        element[0].addEventListener('focus', function(event) {                        
                            
                            ionAutocompleteController.searchQuery = undefined;
                            ionAutocompleteController.showModal();
                        });
                    }

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
                            }, function (error) {
                                // reject the error because we do not handle the error here
                                return $q.reject(error);
                            }).finally(function () {
                                // hide the loading icon
                                ionAutocompleteController.showLoadingIcon = false;
                            });
                        }
                    };

                    var searchContainerDisplayed = false;

                    ionAutocompleteController.showModal = function () {

                        if (searchContainerDisplayed) {
                            return;
                        }

                        modal.show();

                        // hide the container if the back button is pressed
                        scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(function () {
                            
                            ionAutocompleteController.hideModal();
                        }, 300);

                        ionAutocompleteController.fetchSearchQuery("", true);

                        // force the collection repeat to redraw itself as there were issues when the first items were added
                        //$ionicScrollDelegate.resize();

                        searchContainerDisplayed = true;
                    };

                    ionAutocompleteController.hideModal = function () {
                        
                        ionAutocompleteController.searchQuery = undefined;
                        modal.hide();
                        scope.$deregisterBackButton && scope.$deregisterBackButton();
                        searchContainerDisplayed = false;
                    };

                    // object to store if the user moved the finger to prevent opening the modal
                    var scrolling = {
                        moved: false,
                        startX: 0,
                        startY: 0
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

                    if (ionAutocompleteController.autoOpen)
                        ionAutocompleteController.showModal();
                });

            }
        };
    }
]);
