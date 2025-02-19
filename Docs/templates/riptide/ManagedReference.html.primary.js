// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

var common = require('./ManagedReference.common.js');
var extension = require('./ManagedReference.extension.js');
var overwrite = require('./ManagedReference.overwrite.js');

exports.transform = function (model) {
  model.yamlmime = "ManagedReference";

  if (overwrite && overwrite.transform) {
    return overwrite.transform(model);
  }

  if (extension && extension.preTransform) {
    model = extension.preTransform(model);
  }

  if (common && common.transform) {
    model = common.transform(model);
  }
  if (model.type && model.type.toLowerCase() === "enum") { // MODIFIED to fix error as per https://github.com/dotnet/docfx/issues/8540
    model.isClass = false;
    model.isEnum = true;
  }
  model._disableToc = model._disableToc || !model._tocPath || (model._navPath === model._tocPath);
  model._disableNextArticle = true;

  if (extension && extension.postTransform) {
    if (model._splitReference) {
      model = postTransformMemberPage(model);
    }

    model = extension.postTransform(model);
  }

  return model;
}

exports.getOptions = function (model) {
  if (overwrite && overwrite.getOptions) {
    return overwrite.getOptions(model);
  }
  var ignoreChildrenBookmarks = model._splitReference && model.type && common.getCategory(model.type) === 'ns';

  return {
    "bookmarks": common.getBookmarks(model, ignoreChildrenBookmarks)
  };
}

function postTransformMemberPage(model) {
  var type = model.type.toLowerCase();
  var category = common.getCategory(type);
  if (category == 'class') {
      var typePropertyName = common.getTypePropertyName(type);
      if (typePropertyName) {
          model[typePropertyName] = true;
      }
      if (model.children && model.children.length > 0) {
          model.isCollection = true;
          if (model.children.length == 1) { // ADDED to only show "overloads" table when there are some
              model.isOnlyChild = true;
          }

          common.groupChildren(model, 'class');
      } else {
          model.isItem = true;
      }
  }
  return model;
}