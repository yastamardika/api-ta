"use strict";

const Category = use("App/Models/Category");
class CategoryController {
  async indexCategory({response}) {
    try {
      const allCategories = await Category.all();
      return response.status(200).json({ categories: allCategories });
    } catch (error) {
      return response.status(400).json({ message: "error!" });
    }
  }

  async detailCategory({response, params}) {
    try {
      const category = await Category.find(params.categoryId);
      return response.status(200).json({ categories: category });
    } catch (error) {
      return response.status(400).json({ message: "error!" });
    }
  }

  async createCategory({ request, response }) {
    const payload = request.all();
    const newCategory = await Category.create(payload);
    return response.status(200).json({ message: "berhasil", data: newCategory });
  }

  async editCategory({ params, request, response }) {
      const payload = request.all();
      const editCategory = await Category.query()
      .where("id", params.id)
      .update(payload);
      const categoryDetail = await Category.findOrFail(params.id);
    return response.status(200).json({message : 'berhasil', data: { categoryDetail, editCategory } })
  }

  async deleteCategory({ params, response }){
    const deleteCategory = await Category.query()
    .where("id", params.id)
    .delete();
    return response.status(200).json({message : 'data berhasil dihapus', data: { deleteCategory } })
  }
}

module.exports = CategoryController;
