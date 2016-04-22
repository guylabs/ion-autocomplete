ion-autocomplete
================
[![Build Status](https://travis-ci.org/guylabs/ion-autocomplete.svg?branch=master)](https://travis-ci.org/guylabs/ion-autocomplete)
[![Coverage Status](https://img.shields.io/coveralls/guylabs/ion-autocomplete.svg)](https://coveralls.io/r/guylabs/ion-autocomplete)
[![Bower version](https://badge.fury.io/bo/ion-autocomplete.svg)](http://badge.fury.io/bo/ion-autocomplete)
[![npm version](https://badge.fury.io/js/ion-autocomplete.svg)](http://badge.fury.io/js/ion-autocomplete)

> Configurable Ionic directive for an autocomplete dropdown.

#Table of contents

- [Demo](#demo)
- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Ionic compatibility](#ionic-compatibility)
- [Usage](#usage)
    - [Configurable options](#configurable-options)
        - [The `items-method`](#the-items-method)
        - [The `items-method-value-key`](#the-items-method-value-key)
        - [The `item-value-key`](#the-item-value-key)
        - [The `item-view-value-key`](#the-item-view-value-key)
        - [The `max-selected-items`](#the-max-selected-items)
        - [The `items-clicked-method`](#the-items-clicked-method)
        - [The `items-removed-method`](#the-items-removed-method)
        - [External model](#external-model)
        - [The `model-to-item-method`](#the-model-to-item-method)
        - [The `cancel-button-clicked-method`](#the-cancel-button-clicked-method)
        - [ComponentId](#component-id)
        - [Placeholder](#placeholder)
        - [Cancel button label](#cancel-button-label)
        - [Select items label](#select-items-label)
        - [Selected items label](#selected-items-label)
        - [Template url](#template-url)
        - [Template data](#template-data)
        - [Loading icon](#loading-icon)
        - [Manage externally](#manage-externally)
    - [Using expressions in value keys](#using-expressions-in-value-keys)
    - [Debouncing](#debouncing)
- [Release notes](#release-notes)
- [Acknowledgements](#acknowledgements)
- [License](#license)

# Demo

You can find a live demo on [Codepen](http://codepen.io/guylabs/pen/GJmwMw) or see it in action in the following image:

![Animated demo](https://github.com/guylabs/ion-autocomplete/raw/master/demo.gif)

# Introduction

For one of my private projects I needed an autocomplete component in Ionic. I searched a lot and found some plain Angular autocompletes, but these had too much other dependencies and mostly didn't look that good within Ionic. Then one day I stumbled upon the [ion-google-place](https://github.com/israelidanny/ion-google-place) project which was exactly what I was looking for, except that it was just working with the Google Places API. So I forked the project and made it configurable such that you can add the service you need. The differences between the ion-google-place project and the ion-autocomplete are listed in the features.

# Features

The ion-autocomplete component has the following features:
- Multiple selection support
- Configurable service which provides the items to list
- Allow to define the maximum number of selected items
- Configure what is stored in the model and what is seen in the list
- Configure the template used to show the autocomplete component
- Configure a callback when an item is clicked/removed
- Configure a callback when the done button is clicked
- Configure all labels used in the component

# Installation

1. Use bower to install the new module:
```bash
bower install ion-autocomplete --save
```
2. Import the `ion-autocomplete` javascript and css file into your HTML file:
```html
<script src="lib/ion-autocomplete/dist/ion-autocomplete.js"></script>
<link href="lib/ion-autocomplete/dist/ion-autocomplete.css" rel="stylesheet">
```
3. Add `ion-autocomplete` as a dependency on your Ionic app:
```javascript
angular.module('myApp', [
  'ionic',
  'ion-autocomplete'
]);
```

# Ionic compatibility

The ion-autocomplete component is running with the following Ionic versions:

ion-autocomplete version | Ionic version
------------------------ | -------------
0.0.2 - 0.1.2 | 1.0.0-beta.14
0.2.0 - 0.2.1 | 1.0.0-rc.3
0.2.2 - 0.2.3 | 1.0.0
0.3.0 - 0.3.1 | 1.1.0
0.3.2 - latest | 1.1.1

# Usage

To use the `ion-autocomplete` directive in single select mode you need set the `max-selected-items` attribute and add the following snippet to your template:
```html
//usage with the attribute restriction
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" max-selected-items="1" />
```

If you want to use it in multiple select mode you do not need to add anything special, just the following snippet to your template: 
```html
//usage with the attribute restriction
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" />
```

Check out the next chapter on how to configure the directive.

## Configurable options

### The `items-method`

You are able to pass in a callback method which gets called when the user changes the value of the search input field. This is
normally a call to the back end which retrieves the items for the specified query. Here is a small sample which will
return a static item of the query:

Define the callback in your scope:
```javascript
$scope.callbackMethod = function (query, isInitializing) {
    return [query];
}
```

And set the items method on the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" items-method="callbackMethod(query)" />
```

You are also able to return a promise from this callback method. For example:
```javascript
$scope.callbackMethod = function (query, isInitializing) {
    return $http.get(endpoint);
}
```

Note that the parameter for the `callbackMethod` needs to be named `query`. Otherwise the callback will not get called properly.
If you want to also retrieve the [ComponentId](#component-id) then you need to add a second parameter called `componentId`:
```javascript
$scope.callbackMethod = function (query, isInitializing, componentId) {
    if(componentId == "component1") {
        return $http.get(endpoint1);
    }
    return [query];
}
```

If you want to pre populate the items which are shown when the modal is visible before the user enters a query then you can check the `isInitializing` flag of
the `items-method` as this is set to true if it is called for the initial items. Here is an example which shows the `test` item as an initial item:
```javascript
$scope.callbackMethod = function (query, isInitializing) {
    if(isInitializing) {
        // depends on the configuration of the `items-method-value-key` (items) and the `item-value-key` (name) and `item-view-value-key` (name)
        return { items: [ { name: "test" } ] }
    } else {
        return $http.get(endpoint);
    }
}
```

If you want to clear the list each time the user opens the modal then just return an empty array like in the following example:
```javascript
$scope.callbackMethod = function (query, isInitializing) {
    if(isInitializing) {
        // depends on the configuration of the `items-method-value-key` (items) and the `item-value-key` (name) and `item-view-value-key` (name)
        return { items: [] }
    } else {
        return $http.get(endpoint);
    }
}
```

And if you do not want that the searched items list gets modified then just return nothing as in this example:
```javascript
$scope.callbackMethod = function (query, isInitializing) {
    if(!isInitializing) {
        return $http.get(endpoint);
    }
}
```

### The `items-method-value-key`

You are able to set the `items-method-value-key` attribute which maps to a value of the returned data of the `items-method`. If for
example your callback method returns the following object:
```json
{
    "items" : [ {
        "name" : "item1"
    },{
        "name" : "item2"
    },
        ...
    ]
}
```
Then when you do not specify the `items-method-value-key` there will be no list displayed when you search for items in
the search input field. You need to set the `items-method-value-key` to `items` such that the items are shown. If you right
away return an array of items then you do not need to set the `items-method-value-key`.

### The `item-value-key`

You are able to set the `item-value-key` attribute which maps to a value of the returned object from the `items-method`. The value
is then saved in the defined `ng-model`. Here an example:

The items method returns the following object:
```javascript
[
    {
        "id": "1",
        "name": "Item 1",
        ...
    }
    ...
]
```

And now you set the following `item-value-key`:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" item-value-key="id" />
```

Now when the user selects the `Item 1` from the list, then the value of the objects `id` is stored in the `ng-model`. If
no `item-value-key` is passed into the directive, the whole item object will be stored in the `ng-model`.

### The `item-view-value-key`

You are able to set the `item-view-value-key` attribute which maps to a value of the returned object from the `items-method`. The
value is then showed in both input fields. Here an example:

The `items-method` returns the following object:
```javascript
[
    {
        "id": "1",
        "name": "Item 1",
        ...
    }
    ...
]
```

And now you set the following `item-view-value-key`:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" item-view-value-key="name" />
```

Now when the user selects the `Item 1` from the list, then the value of the objects `name` is showed in both input fields. If
no `item-view-value-key` is passed into the directive, the whole item object will be showed in both input fields.

### The `max-selected-items`

You are able to set the `max-selected-items` attribute to any number to set the maximum selectable items inside the component. Here an example:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" max-selected-items="3" />
```

Then the user is just able to select three items out of the returned items and also delete them again. The given `ng-model` is an 
array if multiple items are selected.

### The `items-clicked-method`

You are able to pass a function to the `items-clicked-method` attribute to be notified when an item is clicked. The name of the 
parameter of the function must be `callback`. Here is an example:

Define the callback in your scope:
```javascript
$scope.clickedMethod = function (callback) {
    // print out the selected item
    console.log(callback.item); 
    
    // print out the component id
    console.log(callback.componentId);
    
    // print out the selected items if the multiple select flag is set to true and multiple elements are selected
    console.log(callback.selectedItems); 
}
```

And pass in the callback method in the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" items-clicked-method="clickedMethod(callback)" />
```

Then you get a callback object with the clicked/selected item and the selected items if you have multiple selected items (see [The `multiple-select`](#the-multiple-select)).

### The `items-removed-method`

You are able to pass a function to the `items-removed-method` attribute to be notified when an item is removed from a multi-select list. The name of the 
parameter of the function must be `callback`. It is similar to items-clicked-method.  This attribute has no defined behaviour for a single select list.

Here is an example:

Define the callback in your scope:
```javascript
$scope.removedMethod = function (callback) {
    // print out the removed item
    console.log(callback.item); 

    // print out the component id
    console.log(callback.componentId);
    
    // print out the selected items
    console.log(callback.selectedItems); 
}
```

And pass in the callback method in the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" items-removed-method="removedMethod(callback)" />
```

Then you get a callback object with the removed item and the selected items.

### External model

The two way binded external model (`external-model` attribute on the component) is used to prepopulate the selected items with the model value. The [`model-to-item-method`](#the-model-to-item-method) is used to get the view item to the model and then the item is selected in the 
component. Be aware that the `external-model` is not updated by the component when an item is selected. It is just used to prepopulate or clear the selected items. If you need to get the current selected items you are able 
to read the value of the `ng-model`. For an example have a look at the [`model-to-item-method`](#the-model-to-item-method) documentation.

If you need to clear the selected items then you are able to set the `external-model` to an empty array (another value is not clearing the selected items).

### The `model-to-item-method`

This method is used if you want to prepopulate the model of the `ion-autocomplete` component. The [external model](#external-model) needs 
to have the same data as it would have when you select the items by hand. The component then takes the model values 
and calls the specified `model-to-item-method` to resolve the item from the back end and select it such that it is preselected.

Here a small example:

Define the `model-to-item-method` and `external-model` in your scope:
```javascript
$scope.modelToItemMethod = function (modelValue) {

    // get the full model item from the model value and return it. You need to implement the `getModelItem` method by yourself 
    // as this is just a sample. The method needs to retrieve the whole item (like the `items-method`) from just the model value.
    var modelItem = getModelItem(modelValue);
    return modelItem;
}
$scope.externalModel = ['test1', 'test2', 'test3'];
```

And set the `model-to-item-method` on the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" external-model="externalModel" model-to-item-method="modelToItemMethod(modelValue)" />
```

You are also able to return a promise from this callback method. For example:
```javascript
$scope.modelToItemMethod = function (modelValue) {
    return $http.get(endpoint + '?q=' + modelValue);
}
```

Note that the parameter for the `model-to-item-method` needs to be named `modelValue`. Otherwise the callback will not get called properly.

### The `cancel-button-clicked-method`

You are able to pass a function to the `cancel-button-clicked-method` attribute to be notified when the cancel button is clicked to close the modal. The name of the 
parameter of the function must be `callback`. Here is an example:

Define the callback in your scope:
```javascript
$scope.cancelButtonClickedMethod = function (callback) {    
    // print out the component id
    console.log(callback.componentId);
    
    // print out the selected items
    console.log(callback.selectedItems); 
}
```

And pass in the callback method in the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" cancel-button-clicked-method="cancelButtonClickedMethod(callback)" />
```

Then you get a callback object with the selected items and the component id.

### Component Id

The component id is an attribute on the `ion-autocomplete` component which sets a given id to the component. This id is then returned in 
the callback object of the [`items-clicked-method`](#the-items-clicked-method) and as a second parameter of the [`items-method`](#the-items-method).
Here an example:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" component-id="component1" />`
```

You are able to set this is on each component if you have multiple components built up in a ng-repeat where you do not want to have multiple `items-method` 
for each component because you want to display other items in each component. You will also get it in the `items-clicked-method` callback object such that you just 
need to define one callback method and you can distinguish the calls with the `componentId` attribute right inside the method.

### Placeholder

You are also able to set the placeholder on the input field and on the search input field if you add the `placeholder`
attribute to the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" placeholder="Enter the query to search for ..." />`
```

### Cancel button label

You are also able to set the cancel button label (defaults to `Cancel`) if you add the `cancel-label` attribute to the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" cancel-label="Go back" />`
```

### Select items label

You are also able to set the select items label (defaults to `Select an item...`) if you add the `select-items-label` attribute to the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" select-items-label="Select your items..." />`
```

### Selected items label

You are also able to set the selected items label (defaults to `Selected items:`) if you add the `selected-items-label` attribute to the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" selected-items-label="Selected:" />`
```

### Template url

You are also able to set an own template for the autocomplete component (defaults to `''`) if you add the `template-url` attribute to the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" template-url="templates/template.html" />`
```

This way you are able to override the default template (the `template` variable [here](https://github.com/guylabs/ion-autocomplete/blob/master/src/ion-autocomplete.js#L68)) 
and use your own template. The component will use the default template if the `template-url` is not defined.

You are able to use all the configurable attributes as expressions in your template. I would advise to use the default template as base template
and then add your custom additions to it.

> Please also take care when you change how the items are shown or what method is called if an item is clicked, 
> because changing this could make the component unusable.

You will need to set the proper `randomCssClass` for the outer most div container in your template and you can get the value by using the `{{viewModel.randomCssClass}}` expression
like in the following example:

```html
<div class="ion-autocomplete-container {{viewModel.randomCssClass}} modal" style="display: none;">
```

### Template data

If you change the template with the `template-url` and want to pass in additional data then you are able to set 
the `template-data` attribute on the directive. If you for example have a `templateData.testData` expression in your own 
template like this:
```html
...
<div>{{templateData.testData}}</div>
...
```
Then you need to set the proper object on your Angular scope the following way:
```javascript
$scope.templateData = {
    testData: "test-data"
};
```
And now you just need to add the `templateData` attribute on the directive:
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" template-data="templateData" />`
```

Then the expression in your template gets resolved properly.

### Loading icon

If you want to display a loading icon when the `items-method` promise gets resolved then you need to set the `loading-icon` 
attribute to a value given by the Ionic spinner: http://ionicframework.com/docs/api/directive/ionSpinner. Then the spinner should 
be shown at the right side of the search input field. 

### Manage externally

To manage the `ion-autocomplete` component externally means that you need to handle when the search modal is shown. To enable this functionality 
you need to set the `manage-externally` attribute to `true` and then you can call the `showModal()` method on the controller. Here an example:

```javascript
// create the externally managed component and a button which has a click handler to a scope method
<input ion-autocomplete type="text" class="ion-autocomplete" autocomplete="off" ng-model="model" manage-externally="true" />
<button class="button" ng-click="clickButton()">Open modal</button>

// inside your controller you can define the 'clickButton()' method the following way
this.clickButton = function () {
    var ionAutocompleteElement = document.getElementsByClassName("ion-autocomplete");
    angular.element(ionAutocompleteElement).controller('ionAutocomplete').fetchSearchQuery("", true);
    angular.element(ionAutocompleteElement).controller('ionAutocomplete').showModal();
}
```

Then you will need to click on the button to open the search modal. This functionality is useful if the user wants to edit the selected item inside the 
input field after she/he selected the item/s.

### Selected items

If you want to clear the selected items programmatically, then you are able to set the `selected-items` attribute with a two way binded model value which then gets updated 
when the items get selected. If you want to clear them just set the given model value to an empty array.

Please *do not* use it for pre populating the selected items. For this use the standard `ng-model` value and [the `model-to-item-method`](#the-model-to-item-method).

## Using expressions in value keys

All value keys are parsed with the Angular `$parse` service such that you are able to use expressions like in the following
example:

```javascript
[
    {
        "id": "1",
        "name": "Item 1",
        "child": {
            "name": "Child Item 1",
        }
        ...
    }
    ...
]
```

This would be the JSON model returned by the `items-method` and in the next snippet we define that we want to show the
name attribute of the child object:

```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" item-view-value-key="child.name" />
```

## Debouncing

If you want to debounce the search input field request, then you are able to set the `ng-model-options` attribute on the input field where you define the `ion-autocomplete`
directive. These options will then be added to the search input field. Be aware that when you add a debounce the update of the model value will also be debounced the 
 same amount as the request to the `items-method`. Here a small example:
 
```html
<input ion-autocomplete type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off" ng-model="model" ng-model-options="{debounce:1000}" />
```

# Release notes

Check them here: [Release notes](https://github.com/guylabs/ion-autocomplete/blob/master/RELEASENOTES.md)

# Acknowledgements

When I first searched for an Ionic autocomplete component I just found the project from Danny. So please have a look at
his [ion-google-place](https://github.com/israelidanny/ion-google-place) project as this project here is a fork of it.
At this point I want to thank him for his nice work.

# License

This Ionic autocomplete directive is available under the MIT license.

(c) Danny Povolotski

(c) Modifications by Guy Brand
