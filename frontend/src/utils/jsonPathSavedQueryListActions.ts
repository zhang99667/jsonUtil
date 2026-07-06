import { addJsonPathListItem, removeJsonPathListItem } from './jsonPathLists';
import type { JsonPathSavedQueryLists } from './jsonPathSavedQueryStorage';

export const addJsonPathHistoryItem = (
  lists: JsonPathSavedQueryLists,
  query: string
): JsonPathSavedQueryLists => ({
  ...lists,
  history: addJsonPathListItem(lists.history, query),
});

export const clearJsonPathHistory = (
  lists: JsonPathSavedQueryLists
): JsonPathSavedQueryLists => ({
  ...lists,
  history: [],
});

export const removeJsonPathFavorite = (
  lists: JsonPathSavedQueryLists,
  query: string
): JsonPathSavedQueryLists => ({
  ...lists,
  favorites: removeJsonPathListItem(lists.favorites, query),
});

export const removeJsonPathHistoryItem = (
  lists: JsonPathSavedQueryLists,
  index: number
): JsonPathSavedQueryLists => ({
  ...lists,
  history: lists.history.filter((_, itemIndex) => itemIndex !== index),
});

export const toggleJsonPathFavorite = (
  lists: JsonPathSavedQueryLists,
  query: string
): JsonPathSavedQueryLists => ({
  ...lists,
  favorites: lists.favorites.includes(query)
    ? removeJsonPathListItem(lists.favorites, query)
    : addJsonPathListItem(lists.favorites, query),
});
