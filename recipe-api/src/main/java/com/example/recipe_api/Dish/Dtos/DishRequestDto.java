package com.example.recipe_api.Dish.Dtos;

import java.util.List;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Dish.Enums.DishCategory;

import lombok.Data;

@Data
public class DishRequestDto {
    private String name;
    private List<String> photos;
    private Double calories;
    private Double proteins;
    private Double fats;
    private Double carbs;
    private List<DishIngredientRequestDto> ingredients;
    private double portionSize;
    private DishCategory category;
    private List<Flag> flags;
}
