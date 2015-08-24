angular.module('ion-autocomplete', []).directive('ionAutocomplete', [
    '$ionicTemplateLoader', '$ionicBackdrop', '$ionicScrollDelegate', '$rootScope', '$document', '$q', '$parse', '$ionicPlatform',
    function ($ionicTemplateLoader, $ionicBackdrop, $ionicScrollDelegate, $rootScope, $document, $q, $parse, $ionicPlatform) {
        return {
            require: '?ngModel',
            restrict: 'A',
            scope: {
                model: '=ngModel',
                placeholder: '@',
                cancelLabel: '@',
                selectItemsLabel: '@',
                selectedItemsLabel: '@',
                templateUrl: '@',
                templateData: '=',
                itemsMethod: '&',
                itemsMethodValueKey: '@',
                itemValueKey: '@',
                itemViewValueKey: '@',
                multipleSelect: '@',
                itemsClickedMethod: '&',
                itemsRemovedMethod: '&',
                componentId: '@',
                modelToItemMethod: '&',
                loadingIcon: '@',
				valueFormat: '@'
            },
            link: function (scope, element, attrs, ngModel) {

                // do nothing if the model is not set
                if (!ngModel) return;

                // set the default values of the passed in attributes
                scope.placeholder = !scope.placeholder ? 'Click to enter a value...' : scope.placeholder;
                scope.cancelLabel = !scope.cancelLabel ? scope.multipleSelect === "true" ? 'Done' : 'Cancel' : scope.cancelLabel;
                scope.selectItemsLabel = !scope.selectItemsLabel ? 'Select an item...' : scope.selectItemsLabel;
                scope.selectedItemsLabel = !scope.selectedItemsLabel ? 'Selected items:' : scope.selectedItemsLabel;
                scope.templateUrl = !scope.templateUrl ? '' : scope.templateUrl;
                scope.loadingIcon = !scope.loadingIcon ? '' : scope.loadingIcon;

                // loading flag if the items-method is a function
                scope.showLoadingIcon = false;

                // the items, selected items and the query for the list
                scope.items = [];
                scope.selectedItems = [];
                scope.searchQuery = undefined;

                // returns the value of an item
                scope.getItemValue = function (item, key) {

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

                // the search container template
                var searchContainerTemplate = [
                    '<div class="ion-autocomplete-container modal">',
                    '<div class="bar bar-header item-input-inset">',
                    '<label class="item-input-wrapper">',
                    '<i class="icon ion-search placeholder-icon"></i>',
                    '<input type="search" class="ion-autocomplete-search" ng-model="searchQuery" placeholder="{{placeholder}}"/>',
                    '</label>',
                    '<div class="ion-autocomplete-loading-icon" ng-if="showLoadingIcon && loadingIcon"><ion-spinner icon="{{loadingIcon}}"></ion-spinner></div>',
                    '<button class="ion-autocomplete-cancel button button-clear">{{cancelLabel}}</button>',
                    '</div>',
                    '<ion-content class="has-header has-header">',
                    '<ion-list>',
                    '<ion-item class="item-divider" ng-show="selectedItems.length > 0">{{selectedItemsLabel}}</ion-item>',
                    '<ion-item ng-repeat="selectedItem in selectedItems track by $index" type="item-text-wrap" class="item-icon-left item-icon-right">',
                    '<i class="icon ion-checkmark"></i>',
                    '{{getItemValue(selectedItem, itemViewValueKey)}}',
                    '<i class="icon ion-trash-a" style="cursor:pointer" ng-click="removeItem($index)"></i>',
                    '</ion-item>',
                    '<ion-item class="item-divider" ng-show="items.length > 0">{{selectItemsLabel}}</ion-item>',
                    '<ion-item collection-repeat="item in items" item-height="55" item-width="100%" type="item-text-wrap" ng-click="selectItem(item)">',
                    '{{getItemValue(item, itemViewValueKey)}}',
                    '</ion-item>',
                    '</ion-list>',
                    '</ion-content>',
                    '</div>'
                ].join('');

                // compile the popup template
                $ionicTemplateLoader.compile({
                    templateUrl: scope.templateUrl,
                    template: searchContainerTemplate,
                    scope: scope,
                    appendTo: $document[0].body
                }).then(function (compiledTemplate) {

                    // get the compiled search field
                    var searchInputElement = angular.element(compiledTemplate.element.find('input'));

                    // function which selects the item, hides the search container and the ionic backdrop if it is not a multiple select autocomplete
                    compiledTemplate.scope.selectItem = function (item) {

                        // clear the items and the search query
                        compiledTemplate.scope.items = [];
                        compiledTemplate.scope.searchQuery = undefined;

                        // if multiple select is on store the selected items
                        if (compiledTemplate.scope.multipleSelect === "true") {

                            if (!isKeyValueInObjectArray(compiledTemplate.scope.selectedItems,
                                    compiledTemplate.scope.itemValueKey, scope.getItemValue(item, scope.itemValueKey))) {
                                // create a new array to update the model. See https://github.com/angular-ui/ui-select/issues/191#issuecomment-55471732
                                compiledTemplate.scope.selectedItems = compiledTemplate.scope.selectedItems.concat([item]);
                            }

                            // set the view value and render it
                            ngModel.$setViewValue(compiledTemplate.scope.selectedItems);
                            ngModel.$render();
                        } else {
                            // set the view value and render it
                            ngModel.$setViewValue(item);
                            ngModel.$render();

                            // hide the container and the ionic backdrop
                            hideSearchContainer();
                        }

                        // call items clicked callback
                        if (angular.isFunction(compiledTemplate.scope.itemsClickedMethod)) {
                            compiledTemplate.scope.itemsClickedMethod({
                                callback: {
                                    item: item,
                                    selectedItems: compiledTemplate.scope.selectedItems.slice(),
                                    componentId: compiledTemplate.scope.componentId
                                }
                            });
                        }
                    };

                    // function which removes the item from the selected items.
                    compiledTemplate.scope.removeItem = function (index) {
                        // remove the item from the selected items and create a copy of the array to update the model.
                        // See https://github.com/angular-ui/ui-select/issues/191#issuecomment-55471732
                        var removed = compiledTemplate.scope.selectedItems.splice(index, 1)[0];
                        compiledTemplate.scope.selectedItems = compiledTemplate.scope.selectedItems.slice();

                        // set the view value and render it
                        ngModel.$setViewValue(compiledTemplate.scope.selectedItems);
                        ngModel.$render();

                        // call items clicked callback
                        if (angular.isFunction(compiledTemplate.scope.itemsRemovedMethod)) {
                            compiledTemplate.scope.itemsRemovedMethod({
                                callback: {
                                    item: removed,
                                    selectedItems: compiledTemplate.scope.selectedItems.slice(),
                                    componentId: compiledTemplate.scope.componentId
                                }
                            });
                        }
                    };

                    // watcher on the search field model to update the list according to the input
                    compiledTemplate.scope.$watch('searchQuery', function (query) {

                        // right away return if the query is undefined to not call the items method for nothing
                        if(query === undefined) {
                            return;
                        }

                        // if the search query is empty, clear the items
                        if (query == '') {
                            compiledTemplate.scope.items = [];
                        }

                        if (angular.isFunction(compiledTemplate.scope.itemsMethod)) {

                            // show the loading icon
                            compiledTemplate.scope.showLoadingIcon = true;

                            var queryObject = {query: query};

                            // if the component id is set, then add it to the query object
                            if (compiledTemplate.scope.componentId) {
                                queryObject = {query: query, componentId: compiledTemplate.scope.componentId}
                            }

                            // convert the given function to a $q promise to support promises too
                            var promise = $q.when(compiledTemplate.scope.itemsMethod(queryObject));

                            promise.then(function (promiseData) {

                                // if the given promise data object has a data property use this for the further processing as the
                                // standard httpPromises from the $http functions store the response data in a data property
                                if (promiseData && promiseData.data) {
                                    promiseData = promiseData.data;
                                }

                                // set the items which are returned by the items method
                                compiledTemplate.scope.items = compiledTemplate.scope.getItemValue(promiseData,
                                    compiledTemplate.scope.itemsMethodValueKey);

                                // force the collection repeat to redraw itself as there were issues when the first items were added
                                $ionicScrollDelegate.resize();

                                // hide the loading icon
                                compiledTemplate.scope.showLoadingIcon = false;
                            }, function (error) {
                                // reject the error because we do not handle the error here
                                return $q.reject(error);
                            });
                        }
                    });

                    var searchContainerDisplayed = false;

                    var displaySearchContainer = function () {
                        if (searchContainerDisplayed) {
                          return;
                        }
                        $ionicBackdrop.retain();
                        compiledTemplate.element.css('display', 'block');
                        scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(function () {
                            hideSearchContainer();
                        }, 300);
                        searchContainerDisplayed = true;
                    };

                    var hideSearchContainer = function () {
                        compiledTemplate.element.css('display', 'none');
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

                        // show the ionic backdrop and the search container
                        displaySearchContainer();

                        // focus on the search input field
                        if (searchInputElement.length > 0) {
                            searchInputElement[0].focus();
                            setTimeout(function () {
                                searchInputElement[0].focus();
                            }, 0);
                        }

                        // force the collection repeat to redraw itself as there were issues when the first items were added
                        $ionicScrollDelegate.resize();
                    };

                    var isKeyValueInObjectArray = function (objectArray, key, value) {
                        for (var i = 0; i < objectArray.length; i++) {
                            if (scope.getItemValue(objectArray[i], key) === value) {
                                return true;
                            }
                        }
                        return false;
                    };

                    // function to call the model to item method and select the item
                    var resolveAndSelectModelItem = function (modelValue) {
                        // convert the given function to a $q promise to support promises too
                        var promise = $q.when(compiledTemplate.scope.modelToItemMethod({modelValue: modelValue}));

                        promise.then(function (promiseData) {
                            // select the item which are returned by the model to item method
                            compiledTemplate.scope.selectItem(promiseData);
                        }, function (error) {
                            // reject the error because we do not handle the error here
                            return $q.reject(error);
                        });
                    };

                    // bind the handlers to the click and touch events of the input field
                    element.bind('touchstart', onTouchStart);
                    element.bind('touchmove', onTouchMove);
                    element.bind('touchend click focus', onClick);

                    // cancel handler for the cancel button which clears the search input field model and hides the
                    // search container and the ionic backdrop
                    compiledTemplate.element.find('button').bind('click', function (event) {
                        compiledTemplate.scope.searchQuery = undefined;
                        hideSearchContainer();
                    });

                    // prepopulate view and selected items if model is already set
                    if (compiledTemplate.scope.model && angular.isFunction(compiledTemplate.scope.modelToItemMethod)) {
                        if (compiledTemplate.scope.multipleSelect === "true" && angular.isArray(compiledTemplate.scope.model)) {
                            angular.forEach(compiledTemplate.scope.model, function (modelValue) {
                                resolveAndSelectModelItem(modelValue);
                            })
                        } else {
                            resolveAndSelectModelItem(compiledTemplate.scope.model);
                        }
                    }

                });

                // render the view value of the model
                ngModel.$render = function () {
					if (scope.valueFormat) {
						if (ngModel.$viewValue != '') {
							var val = scope.valueFormat.replace(/\{(\w+)\}/g, function (a, prop) {
								return scope.getItemValue(ngModel.$viewValue, scope.itemViewValueKey)[prop];
							});
							element.val(val);
						}
					}
					else
						element.val(scope.getItemValue(ngModel.$viewValue, scope.itemViewValueKey));
                };

                // set the view value of the model
                ngModel.$formatters.push(function (modelValue) {
                    var viewValue = scope.getItemValue(modelValue, scope.itemViewValueKey);
                    return viewValue == undefined ? "" : viewValue;
                });

                // set the model value of the model
                ngModel.$parsers.push(function (viewValue) {
                    return scope.getItemValue(viewValue, scope.itemValueKey);
                });

            }
        };
    }
]).directive('ionAutocomplete', function () {
    return {
        require: '?ngModel',
        restrict: 'E',
        template: '<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" />',
        replace: true
    }
});
