package com.example.recipe_api.Product.Dtos;
import lombok.Data;
import java.util.List;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Product.Enums.ProductCategory;
import com.example.recipe_api.Product.Enums.Readiness;

@Data
public class ProductRequestDto {
    private String name;
    private List<String> photos;
    private double calories;
    private double proteins;
    private double fats;
    private double carbs;
    private String ingredients;
    private ProductCategory category;
    private Readiness readiness;
    private List<Flag> flags;
}
