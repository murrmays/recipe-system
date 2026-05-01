package com.example.recipe_api.Dish.Dtos;

import java.util.List;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Dish.Enums.DishCategory;

import lombok.Data;

@Data
public class DishFilterDto {
    private String search;
    private List<DishCategory> categories;
    private List<Flag> flags;
}
