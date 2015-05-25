angular.module('ion-autocomplete', []).directive('ionAutocomplete', [
    '$ionicTemplateLoader', '$ionicBackdrop', '$rootScope', '$document', '$q', '$parse', '$ionicPlatform',
    function ($ionicTemplateLoader, $ionicBackdrop, $rootScope, $document, $q, $parse, $ionicPlatform) {
        return {
            require: '?ngModel',
            restrict: 'A',
            scope: {
                placeholder: '@',
                cancelLabel: '@',
                selectItemsLabel: '@',
                selectedItemsLabel: '@',
                templateUrl: '@',
                itemsMethod: '&',
                itemsMethodValueKey: '@',
                itemValueKey: '@',
                itemViewValueKey: '@',
                multipleSelect: '@',
                itemsClickedMethod: '&',
                loader: '@',
                loaderIcon: '@'
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

                // Initialise loader variables
                scope.loader = scope.loader == "true" ? true : false;
                scope.loaderIcon = !scope.loaderIcon ? '' : scope.loaderIcon;

                // Loading flag for when query method is a function/promise
                scope.loading = false;

                // the items, selected items and the query for the list
                scope.items = [];
                scope.selectedItems = [];
                scope.searchQuery = '';

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
                    '<button class="ion-autocomplete-cancel button button-clear">{{cancelLabel}}</button>',
                    '</div>',
                    '<ion-content class="has-header has-header">',
                    '<ion-list>',
                    '<ion-item class="item-divider" ng-show="selectedItems.length > 0">{{selectedItemsLabel}}</ion-item>',
                    '<ion-item ng-repeat="selectedItem in selectedItems" type="item-text-wrap" class="item-icon-left item-icon-right">',
                    '<i class="icon ion-checkmark"></i>',
                    '{{getItemValue(selectedItem, itemViewValueKey)}}',
                    '<i class="icon ion-trash-a" style="cursor:pointer" ng-click="removeItem($index)"></i>',
                    '</ion-item>',
                    '<ion-item class="item-divider" ng-show="items.length > 0">{{selectItemsLabel}}</ion-item>',
                    '<div class="ion-autocomplete-loader" ng-if="loader && loading"><ion-spinner icon="{{loaderIcon}}"></ion-spinner></div>',
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
                        compiledTemplate.scope.searchQuery = '';

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
                                    selectedItems: compiledTemplate.scope.selectedItems.slice()
                                }
                            });
                        }
                    };

                    // function which removes the item from the selected items.
                    compiledTemplate.scope.removeItem = function (index) {
                        // remove the item from the selected items and create a copy of the array to update the model.
                        // See https://github.com/angular-ui/ui-select/issues/191#issuecomment-55471732
                        compiledTemplate.scope.selectedItems.splice(index, 1);
                        compiledTemplate.scope.selectedItems = compiledTemplate.scope.selectedItems.slice();

                        // set the view value and render it
                        ngModel.$setViewValue(compiledTemplate.scope.selectedItems);
                        ngModel.$render();
                    };

                    // watcher on the search field model to update the list according to the input
                    compiledTemplate.scope.$watch('searchQuery', function (query) {

                        // if the search query is empty, clear the items
                        if (query == '') {
                            compiledTemplate.scope.items = [];
                        }

                        if (query && angular.isFunction(compiledTemplate.scope.itemsMethod)) {
                            // Set loading flag for template
                            compiledTemplate.scope.loading = true;

                            // convert the given function to a $q promise to support promises too
                            var promise = $q.when(compiledTemplate.scope.itemsMethod({query: query}));

                            promise.then(function (promiseData) {
                                // set the items which are returned by the items method
                                compiledTemplate.scope.items = compiledTemplate.scope.getItemValue(promiseData,
                                    compiledTemplate.scope.itemsMethodValueKey);
                                // Unset loading flag for template
                                compiledTemplate.scope.loading = false;
                            }, function (error) {
                                // reject the error because we do not handle the error here
                                return $q.reject(error);
                            });
                        }
                    });

                    var displaySearchContainer = function() {
                        $ionicBackdrop.retain();
                        compiledTemplate.element.css('display', 'block');
                        scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(function(){
                            hideSearchContainer();
                        }, 300);
                    };

                    var hideSearchContainer = function() {
                        compiledTemplate.element.css('display', 'none');
                        $ionicBackdrop.release();
                        scope.$deregisterBackButton && scope.$deregisterBackButton();
                    };

                    // object to store if the user moved the finger to prevent opening the modal
                    var scrolling = {
                        moved: false,
                        startX: 0,
                        startY: 0
                    };

                    // store the start coordinates of the touch start event
                    var onTouchStart = function(e) {
                        scrolling.moved = false;
                        scrolling.startX = e.touches[0].clientX;
                        scrolling.startY = e.touches[0].clientY;
                    };

                    // check if the finger moves more than 10px and set the moved flag to true
                    var onTouchMove = function(e) {
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
                    };

                    var isKeyValueInObjectArray = function (objectArray, key, value) {
                        for (var i = 0; i < objectArray.length; i++) {
                            if (scope.getItemValue(objectArray[i], key) === value) {
                                return true;
                            }
                        }
                        return false;
                    };

                    // bind the handlers to the click and touch events of the input field
                    element.bind('touchstart', onTouchStart);
                    element.bind('touchmove', onTouchMove);
                    element.bind('touchend', onClick);
                    element.bind('click', onClick);

                    // cancel handler for the cancel button which clears the search input field model and hides the
                    // search container and the ionic backdrop
                    compiledTemplate.element.find('button').bind('click', function (event) {
                        compiledTemplate.scope.searchQuery = '';
                        hideSearchContainer();
                    });

                });

                // render the view value of the model
                ngModel.$render = function () {
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
]).directive('ionAutocomplete', function() {
    return {
        require: '?ngModel',
        restrict: 'E',
        template: '<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" />',
        replace: true
    }
});
