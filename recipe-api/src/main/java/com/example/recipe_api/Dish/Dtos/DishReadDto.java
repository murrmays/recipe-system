package com.example.recipe_api.Dish.Dtos;

import java.time.LocalDateTime;
import java.util.List;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Dish.Enums.DishCategory;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DishReadDto {
    private String id;
    private String name;
    private List<String> photos;
    private double calories;
    private double proteins;
    private double fats;
    private double carbs;
    private List<DishIngredientReadDto> ingredients;
    private double portionSize;
    private DishCategory category;
    private List<Flag> flags;
    private LocalDateTime creationDate;
    private LocalDateTime editDate;
}
