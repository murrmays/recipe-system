package com.example.recipe_api.Dish.Dtos;

import lombok.Data;

@Data
public class DishIngredientRequestDto {
    private String productId; 
    private double amount; 
}
