package com.example.recipe_api.Dish.Dtos;

import com.example.recipe_api.Product.Dtos.ProductReadDto;

import lombok.Data;

@Data
public class DishIngredientReadDto {
    private ProductReadDto product;
    private double amount;
}
