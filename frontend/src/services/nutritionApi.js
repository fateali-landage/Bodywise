import api from "./api";

/**
 * Searches USDA FoodData Central via backend API.
 * @param {string} query - The food name to search.
 * @returns {Promise<Object>} The server response containing the food's nutritional profile.
 */
export const searchFood = async (query) => {
  const { data } = await api.post("/api/nutrition/search", { query });
  return data;
};

/**
 * Retrieves user's custom foods library from backend.
 * @param {string} search - Optional search filtering term.
 * @returns {Promise<Object>} The server response containing user's custom foods.
 */
export const getCustomFoods = async (search = "") => {
  const url = `/api/custom-foods${search ? `?search=${encodeURIComponent(search)}` : ""}`;
  const { data } = await api.get(url);
  return data;
};

/**
 * Creates a new custom food item in the backend database.
 * @param {Object} payload - Custom food attributes.
 * @returns {Promise<Object>} The created custom food item.
 */
export const createCustomFood = async (payload) => {
  const { data } = await api.post("/api/custom-foods", payload);
  return data;
};

/**
 * Updates an existing custom food item.
 * @param {string} id - The ID of the food item.
 * @param {Object} payload - Fields to update.
 * @returns {Promise<Object>} The updated custom food item.
 */
export const updateCustomFood = async (id, payload) => {
  const { data } = await api.put(`/api/custom-foods/${id}`, payload);
  return data;
};

/**
 * Deletes a custom food item.
 * @param {string} id - The ID of the food item to delete.
 * @returns {Promise<Object>} Response confirmation message.
 */
export const deleteCustomFood = async (id) => {
  const { data } = await api.delete(`/api/custom-foods/${id}`);
  return data;
};
